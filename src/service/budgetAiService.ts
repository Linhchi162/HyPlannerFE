import type { GroupActivity } from "../store/groupActivitySlice";
import type { Activity } from "../store/activitySlice";
import { askGeminiWithSystemInstruction } from "./assistantService";

export type BudgetAiResult = {
  comparison: string;
  suggestions: string[];
};

const BUDGET_AI_SYSTEM = `Bạn là chuyên gia tư vấn ngân sách đám cưới trong app HyPlanner (Việt Nam).
Người dùng gửi một object JSON có:
- weddingBudgetCap: số hoặc null — tổng ngân sách cưới đã khai báo (VND), có thể null.
- groups: mảng nhóm, mỗi phần tử có group (tên nhóm) và items[] với name, expected (dự kiến), actual (thực tế), payer (bride|groom|both hoặc null).

Nhiệm vụ: đọc dữ liệu, so sánh tổng dự kiến vs tổng thực tế, chỉ ra hạng mục/nhóm nổi bật nếu lệch rõ, và đối chiếu ngắn với weddingBudgetCap nếu có.

BẮT BUỘC trả về một object JSON với ĐÚNG hai khóa tiếng Anh sau (để app parse được):
- "comparison": một chuỗi tiếng Việt (một câu hoặc hai câu ngắn).
- "suggestions": mảng các chuỗi tiếng Việt (ít nhất 2 phần tử), mỗi phần là một gợi ý hành động.

Ví dụ hợp lệ:
{"comparison":"Tổng dự kiến 50 triệu, thực tế 48 triệu — đang thấp hơn dự kiến 2 triệu.","suggestions":["Cập nhật thực tế các khoản còn lại","Rà nhóm trang trí nếu còn phát sinh"]}

Không markdown, không bọc \`\`\`, không thêm khóa ngoài hai khóa trên.
Nếu không có hạng mục: comparison nói chưa có dữ liệu; suggestions hướng dẫn thêm hạng mục.`;

function sanitizeAiJsonRaw(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function relaxTrailingCommas(json: string): string {
  let prev = "";
  let cur = json;
  let guard = 0;
  while (cur !== prev && guard++ < 12) {
    prev = cur;
    cur = cur.replace(/,\s*([}\]])/g, "$1");
  }
  return cur;
}

function stripJsonFence(raw: string): string {
  let s = raw.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(s);
  if (fence?.[1]) s = fence[1].trim();
  else if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return s.trim();
}

function extractBalancedJsonObject(input: string): string | null {
  const start = input.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (inStr) {
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return input.slice(start, i + 1);
    }
  }
  return null;
}

function collectBudgetJsonCandidates(raw: string): string[] {
  const s = sanitizeAiJsonRaw(raw);
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (x: string) => {
    const t = x.trim();
    if (t.length < 2 || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  add(s);
  add(stripJsonFence(s));

  let searchFrom = 0;
  let tries = 0;
  while (tries < 80) {
    const idx = s.indexOf("{", searchFrom);
    if (idx < 0) break;
    tries++;
    const slice = s.slice(idx);
    const bal = extractBalancedJsonObject(slice);
    if (bal) add(bal);
    searchFrom = idx + 1;
  }

  return out;
}

function normalizeBudgetRoot(parsed: unknown): Record<string, unknown> | null {
  if (parsed == null) return null;
  if (Array.isArray(parsed)) {
    if (
      parsed.length === 1 &&
      parsed[0] &&
      typeof parsed[0] === "object" &&
      !Array.isArray(parsed[0])
    ) {
      return normalizeBudgetRoot(parsed[0]);
    }
    return null;
  }
  if (typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if ("comparison" in o || "suggestions" in o) return o;
  for (const k of ["data", "result", "output", "response", "payload"]) {
    const inner = o[k];
    if (inner && typeof inner === "object") {
      const u = normalizeBudgetRoot(inner);
      if (u) return u;
    }
  }
  return o;
}

function pickComparison(o: Record<string, unknown>): string {
  const keys = [
    "comparison",
    "soSanh",
    "so_sanh",
    "tomTat",
    "tongKet",
    "summary",
    "phanTich",
    "noiDung",
    "message",
    "text",
  ];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function normalizeSuggestionStrings(arr: unknown[]): string[] {
  const out: string[] = [];
  for (const x of arr) {
    if (typeof x === "string" && x.trim()) {
      out.push(x.trim());
      continue;
    }
    if (x && typeof x === "object" && !Array.isArray(x)) {
      const r = x as Record<string, unknown>;
      const t =
        (typeof r.text === "string" && r.text.trim()) ||
        (typeof r.noiDung === "string" && r.noiDung.trim()) ||
        (typeof r.goiy === "string" && r.goiy.trim()) ||
        (typeof r.label === "string" && r.label.trim());
      if (t) out.push(t);
    }
  }
  return out.slice(0, 10);
}

function pickSuggestions(o: Record<string, unknown>): string[] {
  const keys = [
    "suggestions",
    "goiY",
    "goi_y",
    "hints",
    "khuyenNghi",
    "deXuat",
    "loiKhuyen",
  ];
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) {
      const out = normalizeSuggestionStrings(v);
      if (out.length) return out;
    }
    if (typeof v === "string" && v.trim()) {
      const parts = v
        .split(/\n+/)
        .map((line) =>
          line.replace(/^[-*•]\s*|^\d+[\.\)]\s*/, "").trim()
        )
        .filter(Boolean);
      if (parts.length) return parts.slice(0, 10);
    }
  }
  const one = o.suggestion;
  if (typeof one === "string" && one.trim()) return [one.trim()];
  return [];
}

const DEFAULT_SUGGESTIONS = [
  "Cập nhật cột thực tế mỗi khi có khoản chi để so sánh đúng với dự kiến.",
  "Rà các hạng mục lệch nhiều so với dự kiến và điều chỉnh kế hoạch hoặc ngân sách nhóm.",
];

export function parseBudgetAiJson(raw: string): BudgetAiResult | null {
  if (!raw?.trim()) return null;
  const candidates = collectBudgetJsonCandidates(raw);
  for (const chunk of candidates) {
    for (const variant of [chunk, relaxTrailingCommas(chunk)]) {
      try {
        const parsed = JSON.parse(variant);
        const rec = normalizeBudgetRoot(parsed);
        if (!rec) continue;
        const comparison = pickComparison(rec);
        if (!comparison) continue;
        let suggestions = pickSuggestions(rec);
        if (!suggestions.length) {
          suggestions = [...DEFAULT_SUGGESTIONS];
        }
        return { comparison, suggestions };
      } catch {
        /* thử tiếp */
      }
    }
  }
  return null;
}

function looksLikeTruncatedOrRawBudgetJson(s: string): boolean {
  const t = s.trim();
  if (!t.startsWith("{")) return false;
  return /"comparison"\s*:/.test(t) || /"suggestions"\s*:/.test(t);
}

/** Khi model trả văn bản tự do — không dùng nếu vẫn là JSON (kể cả cắt cụt), tránh hiển thị raw JSON trong UI. */
function parseBudgetPlainFallback(raw: string): BudgetAiResult | null {
  const t = sanitizeAiJsonRaw(raw);
  if (t.length < 8) return null;
  if (looksLikeTruncatedOrRawBudgetJson(t)) return null;
  const lines = t
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•\d]+[\.\)]\s*/, "").trim())
    .filter((l) => l.length > 0);
  if (!lines.length) return null;
  const comparison = lines[0].slice(0, 600);
  if (looksLikeTruncatedOrRawBudgetJson(comparison)) return null;
  const rest = lines.slice(1).filter((l) => !/^\s*\{/.test(l));
  const suggestions =
    rest.length >= 1 ? rest.slice(0, 8) : [...DEFAULT_SUGGESTIONS];
  return { comparison, suggestions };
}

export function buildBudgetAiPayload(
  groupActivities: GroupActivity[],
  weddingBudgetCap: number | null | undefined
): string {
  const cap =
    weddingBudgetCap != null && Number.isFinite(Number(weddingBudgetCap))
      ? Number(weddingBudgetCap)
      : null;
  const groups = (groupActivities || []).map((g) => ({
    group: g.groupName || "",
    items: (g.activities || []).map((act) => {
      const a = act as Activity;
      return {
        name: a.activityName || "",
        expected: Number(a.expectedBudget) || 0,
        actual: Number(a.actualBudget) || 0,
        payer: a.payer ?? null,
      };
    }),
  }));
  return JSON.stringify({ weddingBudgetCap: cap, currency: "VND", groups });
}

const JSON_CALL_OPTS = { maxContinuations: 0 as const };

/**
 * Phân tích ngân sách bằng Gemini (cần EXPO_PUBLIC_GEMINI_API_KEY).
 */
export async function analyzeBudgetWithAi(
  groupActivities: GroupActivity[],
  weddingBudgetCap: number | null | undefined
): Promise<BudgetAiResult> {
  const userPayload = buildBudgetAiPayload(groupActivities, weddingBudgetCap);

  let raw = await askGeminiWithSystemInstruction(
    BUDGET_AI_SYSTEM,
    userPayload,
    {
      responseMimeType: "application/json" as const,
      temperature: 0.25,
      maxOutputTokens: 1536,
    },
    JSON_CALL_OPTS
  );

  let parsed = parseBudgetAiJson(raw);
  if (parsed) return parsed;

  raw = await askGeminiWithSystemInstruction(
    BUDGET_AI_SYSTEM,
    `${userPayload}\n\nNhắc lại: chỉ trả về một object JSON thuần, hai khóa comparison và suggestions (mảng chuỗi).`,
    {
      temperature: 0.2,
      maxOutputTokens: 1536,
    },
    JSON_CALL_OPTS
  );

  parsed = parseBudgetAiJson(raw);
  if (parsed) return parsed;

  const plain = parseBudgetPlainFallback(raw);
  if (plain) return plain;

  throw new Error("Không đọc được phản hồi AI. Vui lòng thử lại.");
}
