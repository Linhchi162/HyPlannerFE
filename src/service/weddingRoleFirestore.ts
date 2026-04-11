import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db, ensureAnonymousFirebaseAuth } from "./firebase";

/** Lưu trên Firestore (phía client). Cần rule cho phép đọc/ghi collection `weddingRoleAssignments`. */
export type WeddingRoleAssignmentsDoc = {
  partnerUserId: string | null;
  assistantUserId: string | null;
  observerUserId: string | null;
};

const empty: WeddingRoleAssignmentsDoc = {
  partnerUserId: null,
  assistantUserId: null,
  observerUserId: null,
};

function normalize(
  raw: Record<string, unknown> | undefined
): WeddingRoleAssignmentsDoc {
  if (!raw) return { ...empty };
  return {
    partnerUserId:
      typeof raw.partnerUserId === "string" ? raw.partnerUserId : null,
    assistantUserId:
      typeof raw.assistantUserId === "string" ? raw.assistantUserId : null,
    observerUserId:
      typeof raw.observerUserId === "string" ? raw.observerUserId : null,
  };
}

export function subscribeWeddingRoleAssignments(
  weddingEventId: string,
  callback: (data: WeddingRoleAssignmentsDoc) => void
): () => void {
  if (!weddingEventId) {
    callback(empty);
    return () => {};
  }
  const ref = doc(db, "weddingRoleAssignments", weddingEventId);
  void ensureAnonymousFirebaseAuth().catch(() => {});
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        callback({ ...empty });
        return;
      }
      callback(normalize(snap.data() as Record<string, unknown>));
    },
    () => callback({ ...empty })
  );
}

export async function saveWeddingRoleAssignments(
  weddingEventId: string,
  payload: WeddingRoleAssignmentsDoc
): Promise<void> {
  await ensureAnonymousFirebaseAuth();
  const ref = doc(db, "weddingRoleAssignments", weddingEventId);
  await setDoc(
    ref,
    {
      partnerUserId: payload.partnerUserId,
      assistantUserId: payload.assistantUserId,
      observerUserId: payload.observerUserId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
