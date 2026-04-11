import { Phase } from "../store/phaseSlice";

export type ChecklistAlertItem = {
  /** Mã ổn định để so trùng (vd: overdue:2) */
  key: string;
  title: string;
  body: string;
};

function formatShort(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Phân tích rule-based (không gọi API): quá hạn giai đoạn, sắp hết hạn, lệch phụ thuộc giữa các giai đoạn, áp lực trước ngày cưới.
 */
export function evaluateChecklistAutoAlerts(
  phases: Phase[],
  weddingDateIso?: string | null
): ChecklistAlertItem[] {
  if (!phases?.length) return [];

  const now = new Date();
  const alerts: ChecklistAlertItem[] = [];
  const sorted = [...phases].sort(
    (a, b) =>
      new Date(a.phaseTimeStart).getTime() -
      new Date(b.phaseTimeStart).getTime()
  );

  sorted.forEach((phase, index) => {
    const end = new Date(phase.phaseTimeEnd);
    const tasks = phase.tasks || [];
    const incomplete = tasks.filter((t) => !t.completed);
    if (incomplete.length === 0) return;

    const phaseLabel = index + 1;
    const endShort = formatShort(phase.phaseTimeEnd);

    if (now.getTime() > end.getTime()) {
      alerts.push({
        key: `overdue:${phase._id}`,
        title: "Giai đoạn quá hạn",
        body: `Giai đoạn ${phaseLabel} (đến ${endShort}) còn ${incomplete.length} việc chưa xong.`,
      });
    } else {
      const msLeft = end.getTime() - now.getTime();
      const daysLeft = msLeft / (24 * 3600 * 1000);
      if (daysLeft <= 7 && daysLeft > 0) {
        const rate =
          tasks.length > 0 ? (tasks.length - incomplete.length) / tasks.length : 0;
        if (rate < 0.85) {
          alerts.push({
            key: `due_soon:${phase._id}`,
            title: "Sắp hết thời gian giai đoạn",
            body: `Giai đoạn ${phaseLabel} còn ~${Math.ceil(daysLeft)} ngày, hoàn thành ${Math.round(rate * 100)}% — còn ${incomplete.length} việc.`,
          });
        }
      }
    }
  });

  // Phụ thuộc: giai đoạn trước chưa xong nhưng giai đoạn sau đã bắt đầu (theo ngày)
  for (let i = 0; i < sorted.length - 1; i++) {
    const prevTasks = sorted[i].tasks || [];
    const prevIncomplete = prevTasks.some((t) => !t.completed);
    if (!prevIncomplete) continue;

    for (let j = i + 1; j < sorted.length; j++) {
      const laterStart = new Date(sorted[j].phaseTimeStart);
      if (now.getTime() >= laterStart.getTime()) {
        alerts.push({
          key: `dep:${sorted[i]._id}:${sorted[j]._id}`,
          title: "Lệch phụ thuộc giữa các giai đoạn",
          body: `Giai đoạn ${i + 1} vẫn còn việc chưa hoàn thành trong khi giai đoạn ${j + 1} đã bắt đầu — nên ưu tiên xử lý các việc tồn đọng trước.`,
        });
        break;
      }
    }
  }

  if (weddingDateIso) {
    const wd = new Date(weddingDateIso);
    if (!Number.isNaN(wd.getTime())) {
      const daysTo = (wd.getTime() - now.getTime()) / (24 * 3600 * 1000);
      const totalIncomplete = sorted.reduce(
        (acc, p) =>
          acc + (p.tasks || []).filter((t) => !t.completed).length,
        0
      );
      if (daysTo > 0 && daysTo <= 21 && totalIncomplete >= 8) {
        alerts.push({
          key: "wedding_pressure",
          title: "Áp lực tiến độ trước ngày cưới",
          body: `Còn khoảng ${Math.ceil(daysTo)} ngày đến ngày cưới nhưng checklist còn ${totalIncomplete} việc chưa xong — cân nhắc dồn ưu tiên hoặc điều chỉnh kế hoạch.`,
        });
      }
    }
  }

  // Bỏ trùng key
  const seen = new Set<string>();
  return alerts.filter((a) => {
    if (seen.has(a.key)) return false;
    seen.add(a.key);
    return true;
  });
}

export function alertsSignature(alerts: ChecklistAlertItem[]): string {
  return alerts.map((a) => a.key).sort().join(",");
}

const STORAGE_PREFIX = "@hyplanner_checklist_auto_notify:";

export type ChecklistNotifyState = {
  signature: string;
  ts: number;
};

export function checklistNotifyStorageKey(eventId: string): string {
  return `${STORAGE_PREFIX}${eventId}`;
}

/** Khoảng cách tối thiểu giữa hai lần báo (cùng nội dung cảnh báo) */
const SAME_SIGNATURE_COOLDOWN_MS = 8 * 3600 * 1000;
/** Sau khi dữ liệu checklist đổi, cho phép báo lại sau */
const MIN_GAP_AFTER_CHANGE_MS = 20 * 60 * 1000;

export async function shouldEmitChecklistNotification(args: {
  eventId: string;
  signature: string;
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
  now?: number;
}): Promise<boolean> {
  const now = args.now ?? Date.now();
  const key = checklistNotifyStorageKey(args.eventId);
  const raw = await args.getItem(key);
  let prev: ChecklistNotifyState | null = null;
  try {
    prev = raw ? (JSON.parse(raw) as ChecklistNotifyState) : null;
  } catch {
    prev = null;
  }

  if (!prev) return true;

  if (prev.signature !== args.signature) {
    return now - prev.ts >= MIN_GAP_AFTER_CHANGE_MS;
  }

  return now - prev.ts >= SAME_SIGNATURE_COOLDOWN_MS;
}

export async function recordChecklistNotification(args: {
  eventId: string;
  signature: string;
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
  now?: number;
}): Promise<void> {
  const now = args.now ?? Date.now();
  const key = checklistNotifyStorageKey(args.eventId);
  const payload: ChecklistNotifyState = { signature: args.signature, ts: now };
  await args.setItem(key, JSON.stringify(payload));
}
