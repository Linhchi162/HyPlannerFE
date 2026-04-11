import { Dispatch } from "@reduxjs/toolkit";
import { getPhases, updatePhase } from "./phaseService";
import {
  createTask,
  deleteTask,
  editTask,
  markTaskCompleted,
} from "./taskService";
import { Phase } from "../store/phaseSlice";
import { ChecklistAiLuaChon } from "./checklistAiService";

function findTaskPhase(
  phases: Phase[],
  taskId: string
): { phase: Phase; taskIndex: number } | null {
  for (const phase of phases) {
    const tasks = phase.tasks || [];
    const idx = tasks.findIndex((t) => t._id === taskId);
    if (idx >= 0) return { phase, taskIndex: idx };
  }
  return null;
}

/**
 * Áp dụng một lựa chọn do AI đề xuất. Luôn gọi lại getPhases sau khi thành công.
 */
export async function applyChecklistAiChoice(
  choice: ChecklistAiLuaChon,
  phases: Phase[],
  eventId: string,
  dispatch: Dispatch
): Promise<void> {
  if (choice.loai === "HOAN_THANH_VIEC") {
    const tid = choice.taskId?.trim();
    if (!tid) throw new Error("Thiếu mã công việc.");
    const found = findTaskPhase(phases, tid);
    if (!found) throw new Error("Không tìm thấy công việc trong checklist hiện tại.");
    if (found.phase.tasks[found.taskIndex].completed) return;
    await markTaskCompleted(tid, true, dispatch);
    await getPhases(eventId, dispatch);
    return;
  }

  if (choice.loai === "GIA_HAN_GIAI_DOAN") {
    const pid = choice.phaseId?.trim();
    const days = choice.soNgay;
    if (!pid || days == null) throw new Error("Thiếu thông tin giai đoạn.");
    const phase = phases.find((p) => p._id === pid);
    if (!phase) throw new Error("Không tìm thấy giai đoạn trong checklist.");
    const end = new Date(phase.phaseTimeEnd);
    if (Number.isNaN(end.getTime())) throw new Error("Ngày kết thúc giai đoạn không hợp lệ.");
    end.setDate(end.getDate() + days);
    await updatePhase(
      pid,
      {
        phaseTimeStart: phase.phaseTimeStart,
        phaseTimeEnd: end.toISOString(),
      },
      dispatch
    );
    await getPhases(eventId, dispatch);
    return;
  }

  if (choice.loai === "XOA_CONG_VIEC") {
    const tid = choice.taskId?.trim();
    if (!tid) throw new Error("Thiếu mã công việc.");
    const found = findTaskPhase(phases, tid);
    if (!found) throw new Error("Không tìm thấy công việc trong checklist hiện tại.");
    await deleteTask(tid, dispatch);
    await getPhases(eventId, dispatch);
    return;
  }

  if (choice.loai === "THEM_CONG_VIEC") {
    const pid = choice.phaseId?.trim();
    const name = choice.taskName?.trim();
    if (!pid || !name) throw new Error("Thiếu giai đoạn hoặc tên công việc.");
    const phase = phases.find((p) => p._id === pid);
    if (!phase) throw new Error("Không tìm thấy giai đoạn trong checklist.");
    await createTask(
      pid,
      {
        taskName: name,
        taskNote: (choice.taskNote ?? "").trim(),
      },
      dispatch
    );
    await getPhases(eventId, dispatch);
    return;
  }

  if (choice.loai === "SUA_CONG_VIEC") {
    const tid = choice.taskId?.trim();
    if (!tid) throw new Error("Thiếu mã công việc.");
    const found = findTaskPhase(phases, tid);
    if (!found) throw new Error("Không tìm thấy công việc trong checklist hiện tại.");
    const cur = found.phase.tasks[found.taskIndex];
    const hasName = choice.taskName !== undefined;
    const hasNote = choice.taskNote !== undefined;
    if (!hasName && !hasNote) {
      throw new Error("Thiếu nội dung cập nhật cho công việc.");
    }
    const taskName = hasName ? String(choice.taskName).trim() : cur.taskName;
    const taskNote = hasNote ? String(choice.taskNote).trim() : cur.taskNote || "";
    if (!taskName) throw new Error("Tên công việc không được để trống.");
    await editTask(tid, { taskName, taskNote }, dispatch);
    await getPhases(eventId, dispatch);
    return;
  }

  throw new Error("Loại thao tác không được hỗ trợ.");
}
