import {
  arrayUnion,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export async function updateUserFcmToken(userId: string, token: string) {
  if (!userId) return;
  await setDoc(
    doc(db, "users", userId),
    {
      fcmTokens: arrayUnion(token),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

