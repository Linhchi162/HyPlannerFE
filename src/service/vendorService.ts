import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  runTransaction,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type VendorServiceItem = {
  id: string;
  name: string;
  price?: string;
};

export type VendorPayload = {
  name: string;
  category: string;
  location: string;
  phone?: string;
  description?: string;
  services?: VendorServiceItem[];
  imageUrl?: string;
  galleryUrls?: string[];
};

export type Vendor = VendorPayload & {
  id: string;
  rating?: number;
  ratingCount?: number;
  status?: "pending" | "active" | "inactive";
};

export type VendorRequestPayload = {
  vendorId: string;
  vendorName: string;
  userId: string;
  userName: string;
  userEmail?: string;
  services: VendorServiceItem[];
  note?: string;
};

export type VendorRequest = VendorRequestPayload & {
  id: string;
  status?: "new" | "in_progress" | "done";
  createdAt?: any;
};

const VENDOR_LIST_CACHE_KEY = "vendor:list";
const vendorProfileCacheKey = (uid: string) => `vendor:profile:${uid}`;

export const getCachedVendors = async (): Promise<Vendor[]> => {
  const raw = await AsyncStorage.getItem(VENDOR_LIST_CACHE_KEY);
  return raw ? (JSON.parse(raw) as Vendor[]) : [];
};

export const setCachedVendors = async (vendors: Vendor[]) => {
  await AsyncStorage.setItem(VENDOR_LIST_CACHE_KEY, JSON.stringify(vendors));
};

export const getCachedVendorProfile = async (
  uid: string
): Promise<Vendor | null> => {
  const raw = await AsyncStorage.getItem(vendorProfileCacheKey(uid));
  return raw ? (JSON.parse(raw) as Vendor) : null;
};

export const setCachedVendorProfile = async (uid: string, vendor: Vendor) => {
  await AsyncStorage.setItem(vendorProfileCacheKey(uid), JSON.stringify(vendor));
};

export const getVendors = async (): Promise<Vendor[]> => {
  const snapshot = await getDocs(collection(db, "vendors"));
  const data = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Vendor, "id">),
  }));
  await setCachedVendors(data);
  return data;
};

export const subscribeVendors = (
  callback: (vendors: Vendor[]) => void
) => {
  const unsub = onSnapshot(collection(db, "vendors"), (snapshot) => {
    const data = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Vendor, "id">),
    }));
    setCachedVendors(data);
    callback(data);
  });
  return unsub;
};

export const getVendorDetail = async (vendorId: string): Promise<Vendor | null> => {
  const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
  if (!vendorDoc.exists()) return null;
  return { id: vendorDoc.id, ...(vendorDoc.data() as Omit<Vendor, "id">) };
};

export const submitVendorApplication = async (payload: VendorPayload) => {
  return addDoc(collection(db, "vendors"), {
    ...payload,
    description: payload.description ?? "",
    services: payload.services ?? [],
    status: "pending",
    rating: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
  });
};

export const getVendorProfileByUid = async (
  uid: string
): Promise<Vendor | null> => {
  const vendorDoc = await getDoc(doc(db, "vendors", uid));
  if (!vendorDoc.exists()) return null;
  const data = {
    id: vendorDoc.id,
    ...(vendorDoc.data() as Omit<Vendor, "id">),
  };
  await setCachedVendorProfile(uid, data);
  return data;
};

export const subscribeVendorProfile = (
  uid: string,
  callback: (vendor: Vendor | null) => void
) => {
  const unsub = onSnapshot(doc(db, "vendors", uid), (vendorDoc) => {
    if (!vendorDoc.exists()) {
      callback(null);
      return;
    }
    const data = {
      id: vendorDoc.id,
      ...(vendorDoc.data() as Omit<Vendor, "id">),
    };
    setCachedVendorProfile(uid, data);
    callback(data);
  });
  return unsub;
};

export const updateVendorProfile = async (
  uid: string,
  payload: Partial<VendorPayload>
) => {
  await setDoc(
    doc(db, "vendors", uid),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  const cached = await getCachedVendorProfile(uid);
  await setCachedVendorProfile(uid, {
    id: uid,
    ...(cached || {}),
    ...payload,
  });
};

export const deleteVendorProfile = async (uid: string) => {
  await deleteDoc(doc(db, "vendors", uid));
  await AsyncStorage.removeItem(vendorProfileCacheKey(uid));
};

export const updateVendorFcmToken = async (uid: string, token: string) => {
  await updateDoc(doc(db, "vendors", uid), {
    fcmTokens: arrayUnion(token),
    updatedAt: serverTimestamp(),
  });
};

export const rateVendor = async (
  vendorId: string,
  userId: string,
  rating: number
) => {
  const vendorRef = doc(db, "vendors", vendorId);
  const ratingRef = doc(db, "vendors", vendorId, "ratings", userId);
  await runTransaction(db, async (transaction) => {
    const vendorSnap = await transaction.get(vendorRef);
    if (!vendorSnap.exists()) throw new Error("vendor-not-found");

    const ratingSnap = await transaction.get(ratingRef);
    if (ratingSnap.exists()) throw new Error("already-rated");

    const vendorData = vendorSnap.data() as Vendor;
    const currentAvg = Number(vendorData.rating || 0);
    const currentCount = Number(vendorData.ratingCount || 0);

    const newCount = currentCount + 1;
    const newAvg =
      newCount > 0 ? (currentAvg * currentCount + rating) / newCount : rating;
    transaction.update(vendorRef, {
      rating: Number(newAvg.toFixed(2)),
      ratingCount: newCount,
      updatedAt: serverTimestamp(),
    });
    transaction.set(ratingRef, { rating, createdAt: serverTimestamp() });
  });
};

export const getVendorUserRating = async (
  vendorId: string,
  userId: string
): Promise<number | null> => {
  const ratingRef = doc(db, "vendors", vendorId, "ratings", userId);
  const snap = await getDoc(ratingRef);
  if (!snap.exists()) return null;
  const value = Number(snap.data()?.rating || 0);
  return value > 0 ? value : null;
};

export const submitVendorRequest = async (payload: VendorRequestPayload) => {
  return addDoc(collection(db, "vendorRequests"), {
    ...payload,
    status: "new",
    createdAt: serverTimestamp(),
  });
};

export const subscribeVendorRequests = (
  vendorId: string,
  callback: (requests: VendorRequest[]) => void
) => {
  const q = query(
    collection(db, "vendorRequests"),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc")
  );
  const unsub = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<VendorRequest, "id">),
    }));
    callback(data);
  });
  return unsub;
};
