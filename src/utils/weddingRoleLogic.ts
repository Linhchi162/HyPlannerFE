import type { WeddingRoleAssignmentsDoc } from "../service/weddingRoleFirestore";

export type EffectiveWeddingRole =
  | "owner"
  | "partner"
  | "assistant"
  | "observer"
  | "member";

export function resolveEffectiveRole(
  userId: string | undefined,
  creatorId: string,
  assignments: WeddingRoleAssignmentsDoc
): EffectiveWeddingRole {
  if (!userId) return "member";
  if (userId === creatorId) return "owner";
  if (assignments.partnerUserId && userId === assignments.partnerUserId)
    return "partner";
  if (assignments.assistantUserId && userId === assignments.assistantUserId)
    return "assistant";
  if (assignments.observerUserId && userId === assignments.observerUserId)
    return "observer";
  return "member";
}

/** Chủ kế hoạch hoặc Hỷ Partner: toàn quyền nội dung kế hoạch. */
export function hasFullPlanAccess(role: EffectiveWeddingRole): boolean {
  return role === "owner" || role === "partner" || role === "member";
}

export function isObserverRole(role: EffectiveWeddingRole): boolean {
  return role === "observer";
}

export function isAssistantRole(role: EffectiveWeddingRole): boolean {
  return role === "assistant";
}

export function canAssignRoles(role: EffectiveWeddingRole): boolean {
  return role === "owner" || role === "partner";
}
