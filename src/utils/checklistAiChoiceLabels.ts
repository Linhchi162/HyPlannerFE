import { Phase } from "../store/phaseSlice";
import { ChecklistAiLuaChon } from "../service/checklistAiService";

function sortedPhases(phases: Phase[]): Phase[] {
  return [...phases].sort(
    (a, b) =>
      new Date(a.phaseTimeStart).getTime() -
      new Date(b.phaseTimeStart).getTime()
  );
}

function findTask(
  phases: Phase[],
  taskId: string
): { task: { taskName: string; taskNote?: string } } | null {
  for (const p of phases) {
    const t = p.tasks?.find((x) => x._id === taskId);
    if (t) return { task: t };
  }
  return null;
}

function phaseOrderLabel(phases: Phase[], phaseId: string): string {
  const sorted = sortedPhases(phases);
  const idx = sorted.findIndex((p) => p._id === phaseId);
  return idx >= 0 ? `Giai đoạn ${idx + 1}` : "Giai đoạn";
}

function trunc(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Nhãn nút “Áp dụng nhanh”: luôn cố gắng hiện tên việc / giai đoạn từ checklist,
 * vì AI thường để `nhan` chung chung.
 */
export function getChecklistAiChoiceDisplayLabel(
  choice: ChecklistAiLuaChon,
  phases: Phase[]
): string {
  const nhan = choice.nhan?.trim();
  const found = choice.taskId ? findTask(phases, choice.taskId) : null;
  const taskName = found?.task.taskName?.trim();

  switch (choice.loai) {
    case "HOAN_THANH_VIEC":
      if (taskName) return `Đánh dấu xong: ${trunc(taskName, 76)}`;
      return nhan || "Đánh dấu hoàn thành";
    case "XOA_CONG_VIEC":
      if (taskName) return `Xóa việc: ${trunc(taskName, 76)}`;
      return nhan || "Xóa công việc";
    case "SUA_CONG_VIEC": {
      const newName = choice.taskName?.trim();
      if (newName) {
        const from = taskName ? trunc(taskName, 42) : "việc";
        return `Đổi tên: “${from}” → “${trunc(newName, 50)}”`;
      }
      if (choice.taskNote !== undefined && taskName) {
        return `Sửa ghi chú: ${trunc(taskName, 70)}`;
      }
      if (taskName) return `Sửa: ${trunc(taskName, 76)}`;
      return nhan || "Sửa công việc";
    }
    case "GIA_HAN_GIAI_DOAN": {
      const pl = choice.phaseId
        ? phaseOrderLabel(phases, choice.phaseId)
        : "Giai đoạn";
      const d = choice.soNgay ?? "?";
      return `Gia hạn ${pl} (+${d} ngày)`;
    }
    case "THEM_CONG_VIEC": {
      const pl = choice.phaseId
        ? phaseOrderLabel(phases, choice.phaseId)
        : "checklist";
      if (choice.taskName?.trim()) {
        return `Thêm vào ${pl}: ${trunc(choice.taskName.trim(), 58)}`;
      }
      return nhan || `Thêm công việc (${pl})`;
    }
    default:
      return nhan || "Thao tác";
  }
}
