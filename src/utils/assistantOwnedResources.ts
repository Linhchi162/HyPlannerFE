import AsyncStorage from "@react-native-async-storage/async-storage";

export type AssistantOwnedKind =
  | "task"
  | "activity"
  | "phase"
  | "groupActivity"
  | "guest";

function storageKey(weddingEventId: string, userId: string) {
  return `hp_assistant_owned_${weddingEventId}_${userId}`;
}

function toKey(kind: AssistantOwnedKind, resourceId: string) {
  return `${kind}:${resourceId}`;
}

export async function loadAssistantOwnedKeys(
  weddingEventId: string,
  userId: string
): Promise<Set<string>> {
  if (!weddingEventId || !userId) return new Set();
  try {
    const raw = await AsyncStorage.getItem(
      storageKey(weddingEventId, userId)
    );
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export async function addAssistantOwnedKey(
  weddingEventId: string,
  userId: string,
  kind: AssistantOwnedKind,
  resourceId: string
): Promise<void> {
  if (!weddingEventId || !userId || !resourceId) return;
  const key = storageKey(weddingEventId, userId);
  const set = await loadAssistantOwnedKeys(weddingEventId, userId);
  set.add(toKey(kind, resourceId));
  await AsyncStorage.setItem(key, JSON.stringify([...set]));
}

export function isKeyOwned(
  set: Set<string>,
  kind: AssistantOwnedKind,
  resourceId: string
): boolean {
  return set.has(toKey(kind, resourceId));
}
