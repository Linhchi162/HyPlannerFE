import { Phase } from "../store/phaseSlice";
import { askGeminiWithSystemInstruction } from "./assistantService";

export type ChecklistAiInput = {
  phases: Phase[];
  weddingDateIso?: string | null;
  brideName?: string;
  groomName?: string;
  whatIfScenario?: string;
};

export type ChecklistAiLuaChonLoai =
  | "HOAN_THANH_VIEC"
  | "GIA_HAN_GIAI_DOAN"
  | "XOA_CONG_VIEC"
  | "THEM_CONG_VIEC"
  | "SUA_CONG_VIEC";

export type ChecklistAiLuaChon = {
  id: string;
  nhan: string;
  loai: ChecklistAiLuaChonLoai;
  taskId?: string;
  phaseId?: string;
  soNgay?: number;
  /** THEM_CONG_VIEC: tên việc mới; SUA_CONG_VIEC: tên sau khi sửa (đủ cả hai trường với taskNote) */
  taskName?: string;
  taskNote?: string;
};

export type ChecklistAiKetQua = {
  tomTat: string;
  luaChon: ChecklistAiLuaChon[];
};

const MAX_LUA_CHON = 10;
const MIN_LUA_CHON_GOI_Y = 5;

const CHECKLIST_AI_JSON_SYSTEM = `Bạn là trợ lý checklist cưới HyPlanner (Việt Nam). Bạn nhận dữ liệu giai đoạn và công việc kèm id.

Nhiệm vụ: trả lời CỰC NGẮN (tóm tắt tối đa 2–4 câu) và đề xuất thao tác cụ thể mà app có thể thực hiện tự động.

Bạn CHỈ được trả về MỘT object JSON hợp lệ, không markdown, không text ngoài JSON. Schema:
{
  "tomTat": "string — 2-4 câu, súc tích",
  "luaChon": [ /* nên khoảng ${MIN_LUA_CHON_GOI_Y}–${MAX_LUA_CHON} mục khi có đủ ý; tối đa ${MAX_LUA_CHON} */ ]
}

Mỗi phần tử luaChon có "nhan": chuỗi hiển thị trên nút — BẮT BUỘC ghi rõ tên công việc (copy từ dữ liệu) hoặc giai đoạn, ví dụ: "Đánh dấu xong: Đặt tiệc nhà hàng", "Xóa: Thử váy dư", "Thêm vào GĐ2: Mua nhẫn", "Gia hạn GĐ3 (+14 ngày)". Không dùng chung chung chỉ "Đánh dấu hoàn thành".

Các loại phần tử luaChon (trường bắt buộc theo từng loai):

1) HOAN_THANH_VIEC — taskId (chỉ việc CHƯA xong, id có trong dữ liệu).

2) GIA_HAN_GIAI_DOAN — phaseId, soNgay (số nguyên 1–45): cộng thêm ngày vào ngày KẾT THÚC giai đoạn.

3) XOA_CONG_VIEC — taskId (xóa việc khỏi checklist; chỉ khi thật sự dư thừa/trùng hoặc user ngầm muốn gọn — id có trong dữ liệu).

4) THEM_CONG_VIEC — phaseId, taskName (chuỗi không rỗng), taskNote (chuỗi, có thể ""): thêm việc mới vào giai đoạn đó.

5) SUA_CONG_VIEC — taskId, taskName, taskNote: nội dung SAU KHI sửa (phải gửi đủ hai chuỗi — nếu chỉ đổi tên thì giữ nguyên taskNote hiện tại từ dữ liệu; chỉ đổi ghi chú thì giữ nguyên taskName hiện tại).

Ưu tiên đa dạng: đánh dấu xong, gia hạn, thêm việc còn thiếu, sửa tên/ghi chú cho rõ, xóa trùng — không chỉ đánh dấu hoàn thành.

Chỉ dùng taskId/phaseId có trong dữ liệu. Không bịa id. Chỉ để luaChon = [] khi checklist không có việc nào để thao tác; còn lại phải có ${MIN_LUA_CHON_GOI_Y}–${MAX_LUA_CHON} gợi ý (ưu tiên việc chưa xong, gia hạn, thêm/sửa).

BẮT BUỘC: khóa gốc "tomTat" và "luaChon". soNgay là số (không để trong ngoặc kép).`;

/** Lượt chỉ tập trung luaChon (tomTat có thể ""). */
const LUA_CHON_BOOST_SYSTEM = `HyPlanner — checklist cưới. Trả về MỘT JSON hợp lệ.
Schema: {"tomTat":"","luaChon":[...]} — tomTat có thể là chuỗi rỗng "".
luaChon: bắt buộc ${MIN_LUA_CHON_GOI_Y}–${MAX_LUA_CHON} phần tử (nếu trong dữ liệu có đủ việc/giai đoạn), đa dạng loại:
HOAN_THANH_VIEC+taskId; GIA_HAN_GIAI_DOAN+phaseId+soNgay(1-45); XOA_CONG_VIEC+taskId; THEM_CONG_VIEC+phaseId+taskName+taskNote; SUA_CONG_VIEC+taskId (+ taskName/taskNote theo quy tắc đã biết).
Mỗi mục có "nhan" ghi tên việc/giai đoạn cụ thể (copy từ dữ liệu), không chỉ "Đánh dấu hoàn thành".
Chỉ id có trong dữ liệu. Không markdown.`;

const MAX_USER_PROMPT_CHARS = 16000;
const MAX_COMPACT_ID_LINES = 240;

function formatDateVi(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function buildChecklistAiUserPrompt(input: ChecklistAiInput): string {
  const today = new Date();
  const todayStr = today.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const lines: string[] = [
    `Ngày phân tích (hôm nay): ${todayStr}`,
    `Cô dâu / Chú rể (nếu có): ${input.brideName || "?"} & ${input.groomName || "?"}`,
    `Ngày cưới dự kiến: ${input.weddingDateIso ? formatDateVi(input.weddingDateIso) : "chưa có"}`,
    "",
    "=== CHECKLIST THEO GIAI ĐOẠN (dùng đúng taskId / phaseId khi đề xuất) ===",
  ];

  const sorted = [...input.phases].sort(
    (a, b) =>
      new Date(a.phaseTimeStart).getTime() -
      new Date(b.phaseTimeStart).getTime()
  );

  sorted.forEach((phase, idx) => {
    const start = formatDateVi(phase.phaseTimeStart);
    const end = formatDateVi(phase.phaseTimeEnd);
    lines.push(
      `\n[Giai đoạn ${idx + 1}] phaseId: ${phase._id} | ${start} → ${end}`
    );
    const tasks = phase.tasks || [];
    if (tasks.length === 0) {
      lines.push("  (Không có công việc)");
      return;
    }
    tasks.forEach((t) => {
      const status = t.completed ? "ĐÃ XONG" : "CHƯA XONG";
      const note = (t.taskNote || "").trim();
      lines.push(
        `  - taskId: ${t._id} | [${status}] ${t.taskName}${note ? ` | Ghi chú: ${note}` : ""}`
      );
    });
  });

  if (input.whatIfScenario?.trim()) {
    lines.push("", "=== KỊCH BẢN NGƯỜI DÙNG (nếu–thì) ===");
    lines.push(input.whatIfScenario.trim());
  }

  let out = lines.join("\n");
  if (out.length > MAX_USER_PROMPT_CHARS) {
    out =
      out.slice(0, MAX_USER_PROMPT_CHARS - 120) +
      "\n\n[... checklist rút gọn do độ dài; ưu tiên các dòng trên để phân tích.]";
  }
  return out;
}

function countAllTasks(phases: Phase[]): number {
  return phases.reduce((n, p) => n + (p.tasks?.length || 0), 0);
}

function truncateOneLine(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Bản rút gọn nhưng vẫn liệt kê phaseId + taskId để AI đề xuất thao tác.
 */
function buildCompactChecklistWithIds(input: ChecklistAiInput): string {
  const todayStr = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const lines = [
    `Hôm nay: ${todayStr}`,
    `Ngày cưới: ${input.weddingDateIso ? formatDateVi(input.weddingDateIso) : "chưa có"}`,
    `${input.brideName || "?"} & ${input.groomName || "?"}`,
    "",
    "=== GIAI_DOAN + TASK (dùng ĐÚNG phaseId / taskId trong luaChon) ===",
  ];
  const sorted = [...input.phases].sort(
    (a, b) =>
      new Date(a.phaseTimeStart).getTime() -
      new Date(b.phaseTimeStart).getTime()
  );
  let lineBudget = 0;
  for (let idx = 0; idx < sorted.length; idx++) {
    const p = sorted[idx];
    const tasks = [...(p.tasks || [])].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
    lines.push(
      `\n[GĐ${idx + 1}] phaseId: ${p._id} | ${formatDateVi(p.phaseTimeStart)} → ${formatDateVi(p.phaseTimeEnd)}`
    );
    lineBudget++;
    for (const t of tasks) {
      if (lineBudget >= MAX_COMPACT_ID_LINES) {
        lines.push("  ... (còn việc — ưu tiên đã liệt kê việc chưa xong trước)");
        break;
      }
      const st = t.completed ? "XONG" : "CHUA";
      lines.push(
        `  taskId: ${t._id} | [${st}] ${truncateOneLine(t.taskName || "", 90)}`
      );
      lineBudget++;
    }
    if (lineBudget >= MAX_COMPACT_ID_LINES) break;
  }
  if (input.whatIfScenario?.trim()) {
    lines.push("", "=== KỊCH BẢN ===", input.whatIfScenario.trim().slice(0, 900));
  }
  lines.push(
    "",
    `Hãy trả tomTat (2-4 câu) và luaChon ${MIN_LUA_CHON_GOI_Y}–${MAX_LUA_CHON} mục thao tác thực tế.`
  );
  return lines.join("\n");
}

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

/** Cắt object JSON đầu tiên (bỏ text thừa trước/sau). */
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

function unwrapRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if ("tomTat" in o || "luaChon" in o) return o;
  for (const k of ["data", "result", "output", "response"]) {
    const inner = o[k];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const u = unwrapRecord(inner);
      if (u) return u;
    }
  }
  return o;
}

function pickTomTat(o: Record<string, unknown>): string {
  const keys = [
    "tomTat",
    "tom_tat",
    "tomtat",
    "summary",
    "tómTắt",
    "ketQua",
    "noiDung",
    "message",
    "text",
  ];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 1200);
    if (typeof v === "number" && Number.isFinite(v)) {
      return String(v).slice(0, 1200);
    }
    if (Array.isArray(v) && v.length && v.every((x) => typeof x === "string")) {
      return v.join(" ").trim().slice(0, 1200);
    }
  }
  return "";
}

function pickLuaChonArray(o: Record<string, unknown>): unknown[] {
  const keys = ["luaChon", "lua_chon", "choices", "actions", "luaChons"];
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

const MAX_GIA_HAN_NGAY = 45;

function asPositiveInt(v: unknown, max: number): number | null {
  const n =
    typeof v === "number" && Number.isFinite(v)
      ? v
      : parseInt(String(v ?? "").trim(), 10);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (r >= 1 && r <= max) return r;
  return null;
}

function normalizeLoai(loai: unknown): ChecklistAiLuaChonLoai | null {
  const s = String(loai ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
  if (s.includes("HOAN_THANH") || s === "COMPLETE_TASK") {
    return "HOAN_THANH_VIEC";
  }
  if (
    s.includes("GIA_HAN") ||
    s.includes("EXTEND") ||
    s.includes("DELAY_PHASE")
  ) {
    return "GIA_HAN_GIAI_DOAN";
  }
  if (
    s.includes("XOA") ||
    s.includes("DELETE") ||
    s.includes("REMOVE_TASK")
  ) {
    return "XOA_CONG_VIEC";
  }
  if (
    s.includes("THEM") ||
    s.includes("ADD_TASK") ||
    s.includes("CREATE_TASK") ||
    s === "NEW_TASK"
  ) {
    return "THEM_CONG_VIEC";
  }
  if (
    s.includes("SUA") ||
    s.includes("EDIT") ||
    s.includes("UPDATE_TASK") ||
    s.includes("RENAME")
  ) {
    return "SUA_CONG_VIEC";
  }
  return null;
}

function asIdString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function asTaskText(v: unknown, maxLen: number): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, maxLen);
}

function asTaskTextAllowEmpty(v: unknown, maxLen: number): string {
  if (v == null) return "";
  return String(v).trim().slice(0, maxLen);
}

const MAX_TASK_NAME_LEN = 300;
const MAX_TASK_NOTE_LEN = 800;

function parseLuaChonItems(arr: unknown[]): ChecklistAiLuaChon[] {
  const luaChon: ChecklistAiLuaChon[] = [];
  for (let i = 0; i < arr.length && luaChon.length < MAX_LUA_CHON; i++) {
    const item = arr[i];
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const loaiNorm = normalizeLoai(rec.loai);
    const id = String(rec.id ?? i + 1);
    const nhan = String(rec.nhan ?? rec.label ?? rec.title ?? "")
      .trim()
      .slice(0, 200);
    const taskId =
      asIdString(rec.taskId) ??
      asIdString(rec.task_id) ??
      asIdString(rec.idTask);
    const phaseId =
      asIdString(rec.phaseId) ??
      asIdString(rec.phase_id) ??
      asIdString(rec.idPhase);
    const taskNameRaw = rec.taskName ?? rec.tenCongViec ?? rec.name;
    const taskNoteRaw = rec.taskNote ?? rec.ghiChu ?? rec.note;

    if (loaiNorm === "HOAN_THANH_VIEC" && taskId) {
      luaChon.push({
        id,
        nhan: nhan || "Đánh dấu hoàn thành",
        loai: "HOAN_THANH_VIEC",
        taskId,
      });
    } else if (loaiNorm === "GIA_HAN_GIAI_DOAN" && phaseId) {
      const d = asPositiveInt(
        rec.soNgay ?? rec.days ?? rec.so_ngay,
        MAX_GIA_HAN_NGAY
      );
      if (d != null) {
        luaChon.push({
          id,
          nhan: nhan || `Gia hạn giai đoạn +${d} ngày`,
          loai: "GIA_HAN_GIAI_DOAN",
          phaseId,
          soNgay: d,
        });
      }
    } else if (loaiNorm === "XOA_CONG_VIEC" && taskId) {
      luaChon.push({
        id,
        nhan: nhan || "Xóa công việc",
        loai: "XOA_CONG_VIEC",
        taskId,
      });
    } else if (loaiNorm === "THEM_CONG_VIEC" && phaseId) {
      const tn = asTaskText(taskNameRaw, MAX_TASK_NAME_LEN);
      if (!tn) continue;
      const note = asTaskTextAllowEmpty(taskNoteRaw, MAX_TASK_NOTE_LEN);
      luaChon.push({
        id,
        nhan: nhan || `Thêm: ${tn.slice(0, 40)}`,
        loai: "THEM_CONG_VIEC",
        phaseId,
        taskName: tn,
        taskNote: note,
      });
    } else if (loaiNorm === "SUA_CONG_VIEC" && taskId) {
      const hasName =
        Object.prototype.hasOwnProperty.call(rec, "taskName") ||
        Object.prototype.hasOwnProperty.call(rec, "tenCongViec") ||
        Object.prototype.hasOwnProperty.call(rec, "name");
      const hasNote =
        Object.prototype.hasOwnProperty.call(rec, "taskNote") ||
        Object.prototype.hasOwnProperty.call(rec, "ghiChu") ||
        Object.prototype.hasOwnProperty.call(rec, "note");
      if (!hasName && !hasNote) continue;
      if (hasName && !hasNote) {
        const tn = asTaskTextAllowEmpty(taskNameRaw, MAX_TASK_NAME_LEN);
        if (!tn.trim()) continue;
        luaChon.push({
          id,
          nhan: nhan || "Đổi tên công việc",
          loai: "SUA_CONG_VIEC",
          taskId,
          taskName: tn,
        });
      } else if (!hasName && hasNote) {
        const note = asTaskTextAllowEmpty(taskNoteRaw, MAX_TASK_NOTE_LEN);
        luaChon.push({
          id,
          nhan: nhan || "Cập nhật ghi chú công việc",
          loai: "SUA_CONG_VIEC",
          taskId,
          taskNote: note,
        });
      } else {
        const tn = asTaskTextAllowEmpty(taskNameRaw, MAX_TASK_NAME_LEN);
        const note = asTaskTextAllowEmpty(taskNoteRaw, MAX_TASK_NOTE_LEN);
        if (!tn.trim()) continue;
        luaChon.push({
          id,
          nhan: nhan || "Sửa công việc",
          loai: "SUA_CONG_VIEC",
          taskId,
          taskName: tn,
          taskNote: note,
        });
      }
    }
  }
  return luaChon;
}

function normalizeJsonRoot(parsed: unknown): unknown {
  if (Array.isArray(parsed)) {
    if (
      parsed.length === 1 &&
      parsed[0] &&
      typeof parsed[0] === "object" &&
      !Array.isArray(parsed[0])
    ) {
      return parsed[0];
    }
    if (
      parsed.length > 0 &&
      parsed.every((x) => x && typeof x === "object" && !Array.isArray(x))
    ) {
      return { tomTat: "", luaChon: parsed };
    }
  }
  return parsed;
}

function normalizeParsedObject(o: unknown): ChecklistAiKetQua | null {
  const rec = unwrapRecord(o);
  if (!rec) return null;
  let tomTat = pickTomTat(rec);
  const luaChon = parseLuaChonItems(pickLuaChonArray(rec));
  if (!tomTat) {
    if (luaChon.length > 0) {
      tomTat =
        "Dưới đây là các gợi ý có thể áp dụng nhanh lên checklist của bạn.";
    } else {
      return null;
    }
  }
  return { tomTat, luaChon };
}

function collectJsonCandidates(raw: string): string[] {
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
  const unfenced = stripJsonFence(s);
  add(unfenced);

  let searchFrom = 0;
  let tries = 0;
  while (tries < 60) {
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

function tryParseChecklistPayload(s: string): ChecklistAiKetQua | null {
  const candidates = collectJsonCandidates(s);
  for (const chunk of candidates) {
    const variants = [chunk, relaxTrailingCommas(chunk)];
    for (const v of variants) {
      try {
        const parsed = normalizeJsonRoot(JSON.parse(v));
        const n = normalizeParsedObject(parsed);
        if (n) return n;
      } catch {
        /* thử tiếp */
      }
    }
  }
  return null;
}

export function parseChecklistAiJson(raw: string): ChecklistAiKetQua | null {
  if (!raw?.trim()) return null;
  return tryParseChecklistPayload(raw);
}

const DEGRADED_TOM_TAT =
  "Không đọc được định dạng chi tiết từ AI (có thể do mạng hoặc phản hồi quá dài). Bạn thử lại sau vài giây, rút gọn kịch bản, hoặc bấm Phân tích lại. Các nút thao tác nhanh tạm thời không có.";

function degradedResult(): ChecklistAiKetQua {
  return { tomTat: DEGRADED_TOM_TAT, luaChon: [] };
}

async function fetchLuaChonBoost(
  input: ChecklistAiInput
): Promise<ChecklistAiLuaChon[]> {
  const user =
    buildCompactChecklistWithIds(input) +
    '\n\nTrả về JSON: {"tomTat":"","luaChon":[...]} — tomTat có thể "". luaChon bắt buộc nhiều mục, đủ loại thao tác.';
  const opts = { maxContinuations: 0 as const };
  try {
    let raw = await askGeminiWithSystemInstruction(
      LUA_CHON_BOOST_SYSTEM,
      user,
      {
        responseMimeType: "application/json" as const,
        temperature: 0.25,
        maxOutputTokens: 6144,
      },
      opts
    );
    let p = parseChecklistAiJson(raw);
    if (p?.luaChon?.length) return p.luaChon;
    raw = await askGeminiWithSystemInstruction(
      LUA_CHON_BOOST_SYSTEM,
      user,
      { temperature: 0.2, maxOutputTokens: 6144 },
      opts
    );
    p = parseChecklistAiJson(raw);
    return p?.luaChon ?? [];
  } catch {
    return [];
  }
}

async function ensureLuaChonWhenPossible(
  input: ChecklistAiInput,
  base: ChecklistAiKetQua
): Promise<ChecklistAiKetQua> {
  if (base.luaChon.length > 0) return base;
  if (countAllTasks(input.phases) === 0) return base;
  const extra = await fetchLuaChonBoost(input);
  if (!extra.length) return base;
  return {
    ...base,
    luaChon: extra,
  };
}

export async function analyzeChecklistWithAi(
  input: ChecklistAiInput
): Promise<ChecklistAiKetQua> {
  if (!input.phases?.length) {
    throw new Error("Chưa có giai đoạn hoặc công việc để phân tích.");
  }

  const userPromptBase =
    buildChecklistAiUserPrompt(input) +
    "\n\nTrả về đúng một object JSON theo schema trong system instruction.";

  /** Một chunk duy nhất + token đủ lớn — tránh MAX_TOKENS rồi ghép "tiếp tục" làm hỏng JSON. */
  const jsonCallOpts = { maxContinuations: 0 as const };
  const jsonConfig = {
    responseMimeType: "application/json" as const,
    temperature: 0.35,
    maxOutputTokens: 8192,
  };

  let raw: string;
  try {
    raw = await askGeminiWithSystemInstruction(
      CHECKLIST_AI_JSON_SYSTEM,
      userPromptBase,
      jsonConfig,
      jsonCallOpts
    );
  } catch {
    raw = await askGeminiWithSystemInstruction(
      CHECKLIST_AI_JSON_SYSTEM,
      userPromptBase,
      { temperature: 0.35, maxOutputTokens: 8192 },
      jsonCallOpts
    );
  }

  let parsed = parseChecklistAiJson(raw);
  if (!parsed) {
    const repairPrompt =
      userPromptBase +
      `\n\nGợi ý kỹ thuật: Phản hồi phải là một object JSON hợp lệ duy nhất, có đúng hai khóa "tomTat" (chuỗi) và "luaChon" (mảng). Giữ tomTat ngắn (tối đa 3 câu), luaChon nên ${MIN_LUA_CHON_GOI_Y}–${MAX_LUA_CHON} mục khi phù hợp, không quá ${MAX_LUA_CHON}. Không markdown.`;
    raw = await askGeminiWithSystemInstruction(
      CHECKLIST_AI_JSON_SYSTEM,
      repairPrompt,
      { temperature: 0.2, maxOutputTokens: 8192 },
      jsonCallOpts
    );
    parsed = parseChecklistAiJson(raw);
  }

  if (!parsed) {
    const compactUser =
      buildCompactChecklistWithIds(input) +
      "\n\nTrả về đúng một JSON đầy đủ tomTat + luaChon (có thao tác), theo schema system checklist.";
    try {
      raw = await askGeminiWithSystemInstruction(
        CHECKLIST_AI_JSON_SYSTEM,
        compactUser,
        {
          responseMimeType: "application/json" as const,
          temperature: 0.28,
          maxOutputTokens: 6144,
        },
        jsonCallOpts
      );
      parsed = parseChecklistAiJson(raw);
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    try {
      raw = await askGeminiWithSystemInstruction(
        CHECKLIST_AI_JSON_SYSTEM,
        buildCompactChecklistWithIds(input) +
          "\n\nChỉ một object JSON: tomTat + luaChon (5–10 thao tác).",
        { temperature: 0.25, maxOutputTokens: 6144 },
        jsonCallOpts
      );
      parsed = parseChecklistAiJson(raw);
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    const boosted = await fetchLuaChonBoost(input);
    if (boosted.length) {
      parsed = {
        tomTat:
          "Dưới đây là các thao tác gợi ý. Phần phân tích dài không hiển thị đúng định dạng — bạn vẫn có thể áp dụng từng nút bên dưới.",
        luaChon: boosted,
      };
    }
  }

  if (!parsed) {
    return degradedResult();
  }
  return ensureLuaChonWhenPossible(input, parsed);
}
