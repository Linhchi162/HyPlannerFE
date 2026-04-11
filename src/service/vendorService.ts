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
import { sendExpoPushToTokens } from "./expoPushService";

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

function normalizeVendorImageUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== "string") return "";
  let value = rawUrl.trim();
  if (!value) return "";
  value = value.replace(/\\/g, "/");

  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const base = (process.env.EXPO_PUBLIC_BASE_URL || "").trim();
    if (!base) return value;
    try {
      const target = new URL(value);
      if (target.hostname === "localhost" || target.hostname === "127.0.0.1") {
        const b = new URL(base);
        target.protocol = b.protocol;
        target.hostname = b.hostname;
        target.port = b.port;
        return target.toString();
      }
      return value;
    } catch {
      return value;
    }
  }

  const base = (process.env.EXPO_PUBLIC_BASE_URL || "").trim();
  if (!base) return value;
  try {
    const b = new URL(base);
    const path = value.startsWith("/") ? value : `/${value}`;
    return `${b.origin}${path}`;
  } catch {
    return value;
  }
}

function mapVendorDocData(
  id: string,
  data: Omit<Vendor, "id">
): Vendor {
  return {
    id,
    ...data,
    imageUrl: normalizeVendorImageUrl(data.imageUrl),
    galleryUrls: Array.isArray(data.galleryUrls)
      ? data.galleryUrls
          .map((url) => normalizeVendorImageUrl(url))
          .filter(Boolean)
      : [],
  };
}

export type VendorRequestPayload = {
  vendorId: string;
  vendorName: string;
  userId: string;
  userName: string;
  userEmail?: string;
  services: VendorServiceItem[];
  note?: string;
  /** Khách chọn từ ưu đãi đã lưu của đúng vendor — khi đơn hoàn thành → đánh dấu đã dùng */
  promotionId?: string;
  promotionTitle?: string;
};

export type VendorRequest = VendorRequestPayload & {
  id: string;
  status?: "new" | "in_progress" | "done";
  createdAt?: any;
};

const VENDOR_LIST_CACHE_KEY = "vendor:list";
const vendorProfileCacheKey = (uid: string) => `vendor:profile:${uid}`;

async function readPushTokens(
  collectionName: "users" | "vendors",
  id: string
): Promise<string[]> {
  if (!id) return [];
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    if (!snap.exists()) return [];
    const raw = snap.data();
    const arr = Array.isArray(raw?.fcmTokens) ? raw.fcmTokens : [];
    const maybeSingle = typeof raw?.pushToken === "string" ? [raw.pushToken] : [];
    return [...arr, ...maybeSingle];
  } catch (error) {
    console.error(`[vendorService] readPushTokens ${collectionName}/${id}`, error);
    return [];
  }
}

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
  const data = snapshot.docs.map((d) =>
    mapVendorDocData(d.id, d.data() as Omit<Vendor, "id">)
  );
  await setCachedVendors(data);
  return data;
};

export const subscribeVendors = (
  callback: (vendors: Vendor[]) => void
) => {
  const unsub = onSnapshot(collection(db, "vendors"), (snapshot) => {
    const data = snapshot.docs.map((d) =>
      mapVendorDocData(d.id, d.data() as Omit<Vendor, "id">)
    );
    setCachedVendors(data);
    callback(data);
  });
  return unsub;
};

export const getVendorDetail = async (vendorId: string): Promise<Vendor | null> => {
  const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
  if (!vendorDoc.exists()) return null;
  return mapVendorDocData(vendorDoc.id, vendorDoc.data() as Omit<Vendor, "id">);
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
  const data = mapVendorDocData(vendorDoc.id, vendorDoc.data() as Omit<Vendor, "id">);
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
    const data = mapVendorDocData(vendorDoc.id, vendorDoc.data() as Omit<Vendor, "id">);
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

/** Có ít nhất một yêu cầu dịch vụ đã hoàn thành (vendor đánh dấu xong) → user được đánh giá */
export const userHasCompletedVendorRequest = async (
  vendorId: string,
  userId: string
): Promise<boolean> => {
  if (!vendorId || !userId) return false;
  const q = query(
    collection(db, "vendorRequests"),
    where("vendorId", "==", vendorId),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.some((d) => (d.data() as VendorRequest).status === "done");
};

export const rateVendor = async (
  vendorId: string,
  userId: string,
  rating: number
) => {
  if (String(vendorId) === String(userId)) {
    throw new Error("cannot-rate-self");
  }
  const eligible = await userHasCompletedVendorRequest(vendorId, userId);
  if (!eligible) {
    throw new Error("service-not-completed");
  }

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
  const ref = await addDoc(collection(db, "vendorRequests"), {
    ...payload,
    status: "new",
    createdAt: serverTimestamp(),
  });
  const vendorTokens = await readPushTokens("vendors", payload.vendorId);
  await sendExpoPushToTokens(vendorTokens, {
    title: "Đơn dịch vụ mới",
    body: `${payload.userName || "Khách hàng"} vừa gửi yêu cầu dịch vụ.`,
    data: {
      type: "vendor_request_new",
      vendorId: payload.vendorId,
      requestId: ref.id,
    },
  });
  return ref;
};

export const updateVendorRequestStatus = async (
  requestId: string,
  status: VendorRequest["status"]
) => {
  const ref = doc(db, "vendorRequests", requestId);
  const before = await getDoc(ref);
  await updateDoc(doc(db, "vendorRequests", requestId), {
    status,
    updatedAt: serverTimestamp(),
  });
  const old = before.exists() ? (before.data() as VendorRequest) : null;
  if (status === "done" && old?.userId) {
    const userTokens = await readPushTokens("users", old.userId);
    await sendExpoPushToTokens(userTokens, {
      title: "Đơn dịch vụ đã hoàn thành",
      body: `${old.vendorName || "Nhà cung cấp"} đã xác nhận hoàn thành dịch vụ.`,
      data: {
        type: "vendor_request_done",
        requestId,
        vendorId: old.vendorId,
        promotionId: old.promotionId || null,
      },
    });
  }
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
  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<VendorRequest, "id">),
      }));
      callback(data);
    },
    (error) => {
      console.error("[vendorService] subscribeVendorRequests", error);
      callback([]);
    }
  );
  return unsub;
};

/** Đơn theo user (khách) — dùng đồng bộ trạng thái ưu đãi đã dùng */
export const subscribeUserVendorRequests = (
  userId: string,
  callback: (requests: VendorRequest[]) => void
) => {
  const q = query(
    collection(db, "vendorRequests"),
    where("userId", "==", userId)
  );
  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<VendorRequest, "id">),
      }));
      const millis = (c: unknown) => {
        const t = c as { toMillis?: () => number };
        return typeof t?.toMillis === "function" ? t.toMillis() : 0;
      };
      data.sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
      callback(data);
    },
    (error) => {
      console.error("[vendorService] subscribeUserVendorRequests", error);
      callback([]);
    }
  );
  return unsub;
};
