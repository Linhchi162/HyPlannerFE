import Hashids from "hashids";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db, ensureAnonymousFirebaseAuth } from "./firebase";
import type { WeddingRoleAssignmentsDoc } from "./weddingRoleFirestore";

export type JoinRequestStatus = "pending" | "approved" | "rejected";

export type WeddingJoinRequest = {
  applicantUserId: string;
  fullName: string;
  email: string;
  picture?: string;
  inviteCode: string;
  status: JoinRequestStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  decidedByUserId?: string;
};

/** Cùng giá trị với SECRET_KEY_SALT trên BE. Trên Expo bắt buộc dùng EXPO_PUBLIC_SECRET_KEY_SALT (mới được build vào app). */
export function getInviteCodeSalt(): string {
  return (
    process.env.EXPO_PUBLIC_SECRET_KEY_SALT ||
    process.env.SECRET_KEY_SALT ||
    ""
  );
}

export function encodeEventIdToInviteCode(
  eventId: string,
  saltOverride?: string
): string | null {
  const salt = saltOverride ?? getInviteCodeSalt();
  if (!eventId?.trim()) return null;
  try {
    const hashids = new Hashids(salt, 6);
    return hashids.encodeHex(eventId);
  } catch {
    return null;
  }
}

export function decodeEventIdFromInviteCode(code: string): string | null {
  const trimmed = code?.trim();
  const salt = getInviteCodeSalt();
  if (!trimmed) return null;
  try {
    const hashids = new Hashids(salt, 6);
    const hex = hashids.decodeHex(trimmed);
    return hex && hex.length > 0 ? hex : null;
  } catch {
    return null;
  }
}

/** Cho phép applicant đọc creatorId để gửi push (không chứa PII khác). */
export async function setWeddingPublicMeta(
  eventId: string,
  creatorId: string
): Promise<void> {
  if (!eventId || !creatorId) return;
  await ensureAnonymousFirebaseAuth();
  await setDoc(
    doc(db, "weddingPublicMeta", eventId),
    { creatorId, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getWeddingPublicMetaCreatorId(
  eventId: string
): Promise<string | null> {
  await ensureAnonymousFirebaseAuth();
  const snap = await getDoc(doc(db, "weddingPublicMeta", eventId));
  if (!snap.exists()) return null;
  const data = snap.data() as { creatorId?: string };
  const c = data?.creatorId;
  return typeof c === "string" ? c : null;
}

async function readPartnerUserId(eventId: string): Promise<string | null> {
  await ensureAnonymousFirebaseAuth();
  const snap = await getDoc(doc(db, "weddingRoleAssignments", eventId));
  if (!snap.exists()) return null;
  const d = snap.data() as WeddingRoleAssignmentsDoc;
  return typeof d.partnerUserId === "string" ? d.partnerUserId : null;
}

export async function submitWeddingJoinRequest(args: {
  eventId: string;
  inviteCode: string;
  applicantUserId: string;
  fullName: string;
  email: string;
  picture?: string;
}): Promise<void> {
  await ensureAnonymousFirebaseAuth();
  const ref = doc(
    db,
    "weddingJoinRequests",
    args.eventId,
    "requests",
    args.applicantUserId
  );
  await setDoc(
    ref,
    {
      applicantUserId: args.applicantUserId,
      fullName: args.fullName,
      email: args.email,
      picture: args.picture ?? null,
      inviteCode: args.inviteCode.trim(),
      status: "pending" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeMyJoinRequest(
  eventId: string,
  applicantUserId: string,
  callback: (req: WeddingJoinRequest | null) => void
): Unsubscribe {
  const ref = doc(db, "weddingJoinRequests", eventId, "requests", applicantUserId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(snap.data() as WeddingJoinRequest);
    },
    () => callback(null)
  );
}

export function subscribePendingJoinRequests(
  eventId: string,
  callback: (items: WeddingJoinRequest[]) => void
): Unsubscribe {
  const col = collection(db, "weddingJoinRequests", eventId, "requests");
  return onSnapshot(
    col,
    (snap) => {
      const list: WeddingJoinRequest[] = [];
      snap.forEach((d) => {
        const row = d.data() as WeddingJoinRequest;
        if (row.status === "pending") list.push(row);
      });
      list.sort((a, b) => {
        const ta = (a.createdAt as { seconds?: number })?.seconds ?? 0;
        const tb = (b.createdAt as { seconds?: number })?.seconds ?? 0;
        return ta - tb;
      });
      callback(list);
    },
    () => callback([])
  );
}

export async function markJoinRequestRejected(args: {
  eventId: string;
  applicantUserId: string;
  decidedByUserId: string;
}): Promise<void> {
  await ensureAnonymousFirebaseAuth();
  const ref = doc(
    db,
    "weddingJoinRequests",
    args.eventId,
    "requests",
    args.applicantUserId
  );
  await updateDoc(ref, {
    status: "rejected",
    decidedByUserId: args.decidedByUserId,
    updatedAt: serverTimestamp(),
  });
}

export async function markJoinRequestApproved(args: {
  eventId: string;
  applicantUserId: string;
  decidedByUserId: string;
}): Promise<void> {
  await ensureAnonymousFirebaseAuth();
  const ref = doc(
    db,
    "weddingJoinRequests",
    args.eventId,
    "requests",
    args.applicantUserId
  );
  await updateDoc(ref, {
    status: "approved",
    decidedByUserId: args.decidedByUserId,
    updatedAt: serverTimestamp(),
  });
}

/** Danh sách userId cần nhận thông báo (chủ + Hỷ Partner nếu có). */
export async function getJoinRequestNotifierUserIds(
  eventId: string
): Promise<string[]> {
  const creatorId = await getWeddingPublicMetaCreatorId(eventId);
  const partnerId = await readPartnerUserId(eventId);
  const out: string[] = [];
  if (creatorId) out.push(creatorId);
  if (partnerId && partnerId !== creatorId) out.push(partnerId);
  return out;
}
