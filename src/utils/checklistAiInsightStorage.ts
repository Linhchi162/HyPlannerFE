import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChecklistAiKetQua } from "../service/checklistAiService";

const PREFIX = "hyplanner_checklist_ai_insight:v1:";

export type ChecklistAiInsightSnapshot = {
  whatIf: string;
  result: ChecklistAiKetQua | null;
  appliedIds: Record<string, boolean>;
};

function isValidResult(r: unknown): r is ChecklistAiKetQua {
  if (r == null || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return typeof o.tomTat === "string" && Array.isArray(o.luaChon);
}

export async function loadChecklistAiInsightSnapshot(
  eventId: string
): Promise<ChecklistAiInsightSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + eventId);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (typeof o.whatIf !== "string") return null;
    const result =
      o.result === null || o.result === undefined
        ? null
        : isValidResult(o.result)
          ? o.result
          : null;
    const appliedIds =
      o.appliedIds &&
      typeof o.appliedIds === "object" &&
      !Array.isArray(o.appliedIds)
        ? (o.appliedIds as Record<string, boolean>)
        : {};
    return { whatIf: o.whatIf, result, appliedIds };
  } catch {
    return null;
  }
}

export async function saveChecklistAiInsightSnapshot(
  eventId: string,
  snapshot: ChecklistAiInsightSnapshot
): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + eventId, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}
