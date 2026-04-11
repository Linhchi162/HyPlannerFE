import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { selectCurrentUser } from "../store/authSlice";
import {
  subscribeWeddingRoleAssignments,
  type WeddingRoleAssignmentsDoc,
} from "../service/weddingRoleFirestore";
import {
  resolveEffectiveRole,
  hasFullPlanAccess,
  isObserverRole,
  isAssistantRole,
  canAssignRoles,
  type EffectiveWeddingRole,
} from "../utils/weddingRoleLogic";
import {
  addAssistantOwnedKey,
  isKeyOwned,
  loadAssistantOwnedKeys,
  type AssistantOwnedKind,
} from "../utils/assistantOwnedResources";

const emptyAssignments: WeddingRoleAssignmentsDoc = {
  partnerUserId: null,
  assistantUserId: null,
  observerUserId: null,
};

export function useWeddingPermissions() {
  const user = useSelector(selectCurrentUser);
  const weddingEvent = useSelector(
    (s: RootState) => s.weddingEvent.getWeddingEvent.weddingEvent
  );
  const eventId = weddingEvent?._id || "";
  const creatorId = weddingEvent?.creatorId || "";
  const userId = (user?.id || user?._id || "") as string;

  const [assignments, setAssignments] =
    useState<WeddingRoleAssignmentsDoc>(emptyAssignments);
  const [assistantOwned, setAssistantOwned] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!eventId) {
      setAssignments(emptyAssignments);
      return;
    }
    const unsub = subscribeWeddingRoleAssignments(eventId, setAssignments);
    return unsub;
  }, [eventId]);

  const refreshAssistantOwned = useCallback(async () => {
    if (!eventId || !userId) {
      setAssistantOwned(new Set());
      return;
    }
    const next = await loadAssistantOwnedKeys(eventId, userId);
    setAssistantOwned(next);
  }, [eventId, userId]);

  useEffect(() => {
    void refreshAssistantOwned();
  }, [refreshAssistantOwned]);

  const effectiveRole: EffectiveWeddingRole = useMemo(
    () => resolveEffectiveRole(userId, creatorId, assignments),
    [userId, creatorId, assignments]
  );

  const noteAssistantCreated = useCallback(
    async (kind: AssistantOwnedKind, resourceId: string) => {
      if (!isAssistantRole(effectiveRole) || !eventId || !userId || !resourceId)
        return;
      await addAssistantOwnedKey(eventId, userId, kind, resourceId);
      await refreshAssistantOwned();
    },
    [effectiveRole, eventId, userId, refreshAssistantOwned]
  );

  const canAddPlanContent = useMemo(
    () => !isObserverRole(effectiveRole),
    [effectiveRole]
  );

  const canMutateResource = useCallback(
    (
      kind: AssistantOwnedKind,
      resourceId: string,
      createdByUserId?: string | null
    ) => {
      if (isObserverRole(effectiveRole)) return false;
      if (hasFullPlanAccess(effectiveRole)) return true;
      if (isAssistantRole(effectiveRole)) {
        if (createdByUserId && createdByUserId === userId) return true;
        return isKeyOwned(assistantOwned, kind, resourceId);
      }
      return false;
    },
    [effectiveRole, userId, assistantOwned]
  );

  const isPrimaryCouple = useMemo(
    () => effectiveRole === "owner" || effectiveRole === "partner",
    [effectiveRole]
  );

  /** Mời thành viên / copy mã — chủ & partner; assistant/observer dùng nút rời như member. */
  const showInviteMembersInChecklist = isPrimaryCouple;

  return {
    effectiveRole,
    assignments,
    userId,
    eventId,
    creatorId,
    canAddPlanContent,
    canMutateResource,
    canAssignRoles: canAssignRoles(effectiveRole),
    isObserver: isObserverRole(effectiveRole),
    isAssistant: isAssistantRole(effectiveRole),
    hasFullPlanAccess: hasFullPlanAccess(effectiveRole),
    isPrimaryCouple,
    showInviteMembersInChecklist,
    noteAssistantCreated,
    refreshAssistantOwned,
  };
}
