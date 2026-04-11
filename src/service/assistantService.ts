import AsyncStorage from "@react-native-async-storage/async-storage";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_TIMEOUT_MS = 45000;
const GEMINI_MAX_OUTPUT_TOKENS = 2048;
const GEMINI_MAX_CONTINUATIONS = 2;
const ASSISTANT_HISTORY_LIMIT = 60;
const ASSISTANT_STORAGE_PREFIX = "assistant_chat_history";

const getAssistantStorageKey = (userId?: string | null) =>
  `${ASSISTANT_STORAGE_PREFIX}:${userId || "guest"}`;

export const loadAssistantChatHistory = async (
  userId?: string | null
): Promise<AssistantChatMessage[]> => {
  try {
    const raw = await AsyncStorage.getItem(getAssistantStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string"
      )
      .slice(-ASSISTANT_HISTORY_LIMIT);
  } catch {
    return [];
  }
};

export const saveAssistantChatHistory = async (
  messages: AssistantChatMessage[],
  userId?: string | null
) => {
  const safeMessages = messages
    .filter((m) => !!m?.content?.trim())
    .slice(-ASSISTANT_HISTORY_LIMIT);

  await AsyncStorage.setItem(
    getAssistantStorageKey(userId),
    JSON.stringify(safeMessages)
  );
};

const mapRoleToGemini = (role: AssistantMessage["role"]): "user" | "model" =>
  role === "assistant" ? "model" : "user";

type GeminiPart = { text?: string };
type GeminiCandidate = {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
};

const extractCandidateText = (candidate?: GeminiCandidate) =>
  (candidate?.content?.parts || [])
    .map((part) => part?.text || "")
    .join("")
    .trim();

const DEFAULT_SYSTEM_INSTRUCTION =
  "Bạn là trợ lý cưới HyPlanner. Trả lời đầy đủ, rõ ràng, có cấu trúc ngắn gọn theo các bước khi phù hợp. Tránh trả lời cụt hoặc quá ngắn nếu người dùng không yêu cầu.";

const requestGeminiOnce = async (
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  apiKey: string,
  systemInstructionText: string = DEFAULT_SYSTEM_INSTRUCTION,
  generationConfigExtra?: Record<string, unknown>
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstructionText }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
            ...generationConfigExtra,
          },
        }),
        signal: controller.signal,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const errorMessage = data?.error?.message || "Gemini API error";
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Hết thời gian chờ phản hồi từ Gemini.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const askGeminiAssistant = async (
  messages: AssistantMessage[]
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu EXPO_PUBLIC_GEMINI_API_KEY trong .env");
  }

  const history = messages
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: mapRoleToGemini(m.role),
      parts: [{ text: m.content.trim() }],
    }));

  if (history.length === 0) {
    throw new Error("Nội dung hội thoại đang trống.");
  }

  const conversation = [...history];
  let finalText = "";

  for (let attempt = 0; attempt <= GEMINI_MAX_CONTINUATIONS; attempt++) {
    const data = await requestGeminiOnce(conversation, apiKey, DEFAULT_SYSTEM_INSTRUCTION);
    const candidate = (data?.candidates?.[0] || {}) as GeminiCandidate;
    const chunk = extractCandidateText(candidate);

    if (!chunk) {
      if (finalText.trim()) break;
      throw new Error("Gemini chưa trả về nội dung.");
    }

    finalText = `${finalText}${finalText ? "\n" : ""}${chunk}`;
    conversation.push({ role: "model", parts: [{ text: chunk }] });

    const finishReason = `${candidate?.finishReason || ""}`.toUpperCase();
    const wasTruncated = finishReason === "MAX_TOKENS";
    if (!wasTruncated || attempt === GEMINI_MAX_CONTINUATIONS) {
      break;
    }

    conversation.push({
      role: "user",
      parts: [{ text: "Tiếp tục phần trả lời ngay trước đó, không lặp lại nội dung đã viết." }],
    });
  }

  return finalText.trim();
};

export type GeminiSystemCallOptions = {
  /**
   * Số lần được phép "tiếp tục" khi MAX_TOKENS. Với phản hồi bắt buộc là JSON,
   * phải dùng 0: ghép nhiều chunk sẽ tạo chuỗi không parse được.
   */
  maxContinuations?: number;
};

/**
 * Một lượt hỏi–đáp với system instruction riêng (vd. phân tích checklist).
 */
export const askGeminiWithSystemInstruction = async (
  systemInstruction: string,
  userMessage: string,
  generationConfigExtra?: Record<string, unknown>,
  callOptions?: GeminiSystemCallOptions
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu EXPO_PUBLIC_GEMINI_API_KEY trong .env");
  }
  const trimmed = userMessage.trim();
  if (!trimmed) {
    throw new Error("Nội dung đang trống.");
  }

  const maxContinuations =
    callOptions?.maxContinuations ?? GEMINI_MAX_CONTINUATIONS;

  const conversation: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }> = [{ role: "user", parts: [{ text: trimmed }] }];

  let finalText = "";

  for (let attempt = 0; attempt <= maxContinuations; attempt++) {
    const data = await requestGeminiOnce(
      conversation,
      apiKey,
      systemInstruction.trim() || DEFAULT_SYSTEM_INSTRUCTION,
      generationConfigExtra
    );
    const candidate = (data?.candidates?.[0] || {}) as GeminiCandidate;
    const chunk = extractCandidateText(candidate);

    if (!chunk) {
      if (finalText.trim()) break;
      throw new Error("Gemini chưa trả về nội dung.");
    }

    finalText = `${finalText}${finalText ? "\n" : ""}${chunk}`;
    conversation.push({ role: "model", parts: [{ text: chunk }] });

    const finishReason = `${candidate?.finishReason || ""}`.toUpperCase();
    const wasTruncated = finishReason === "MAX_TOKENS";
    if (!wasTruncated || attempt === maxContinuations) {
      break;
    }

    conversation.push({
      role: "user",
      parts: [
        {
          text: "Tiếp tục phần trả lời ngay trước đó, không lặp lại nội dung đã viết.",
        },
      ],
    });
  }

  return finalText.trim();
};
