type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

function normalizeExpoTokens(tokens: unknown[]): string[] {
  return tokens
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(
      (t) =>
        t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[")
    );
}

export async function sendExpoPushToTokens(
  tokens: unknown[],
  payload: PushPayload
): Promise<void> {
  const validTokens = normalizeExpoTokens(tokens);
  if (validTokens.length === 0) return;
  const messages = validTokens.map((to) => ({
    to,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    priority: "high",
    channelId: "default",
  }));
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("[expoPushService] sendExpoPushToTokens", error);
  }
}
