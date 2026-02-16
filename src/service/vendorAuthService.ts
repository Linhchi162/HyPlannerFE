import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
  User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export type VendorRegisterPayload = {
  email: string;
  password: string;
  name: string;
  category: string;
  location: string;
};

export const registerVendor = async (payload: VendorRegisterPayload) => {
  const { email, password, name, category, location } = payload;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  await setDoc(doc(db, "vendors", uid), {
    name,
    category,
    location,
    email,
    phone: "",
    description: "",
    services: [],
    status: "pending",
    rating: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
    role: "VENDOR",
  });
  return cred.user;
};

export const loginVendor = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const resetVendorPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const logoutVendor = async () => {
  await signOut(auth);
};

export const changeVendorPassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Chưa đăng nhập vendor.");
  }
  if (!user.email) {
    throw new Error("Không tìm thấy email tài khoản vendor.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

export const onVendorAuthStateChanged = (
  callback: (user: User | null) => void
) => onAuthStateChanged(auth, callback);
