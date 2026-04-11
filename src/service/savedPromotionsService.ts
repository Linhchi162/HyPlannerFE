import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "hyplanner:savedPromotions:v1";

export type SavedPromotionStatus = "unused" | "used";

export type SavedPromotionEntry = {
  promotionId: string;
  savedAt: string;
  status: SavedPromotionStatus;
  /** Tab Voucher — mặc định false; có thể gán khi BE có loại voucher */
  isVoucher?: boolean;
};

async function readAll(): Promise<SavedPromotionEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is SavedPromotionEntry =>
        Boolean(x) &&
        typeof x === "object" &&
        typeof (x as SavedPromotionEntry).promotionId === "string"
    );
  } catch {
    return [];
  }
}

async function writeAll(entries: SavedPromotionEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getSavedPromotionEntries(): Promise<
  SavedPromotionEntry[]
> {
  const all = await readAll();
  return all.sort(
    (a, b) =>
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

export async function getSavedPromotionIdSet(): Promise<Set<string>> {
  const entries = await readAll();
  return new Set(entries.map((e) => e.promotionId));
}

export async function toggleSavedPromotion(
  promotionId: string
): Promise<boolean> {
  const all = await readAll();
  const idx = all.findIndex((e) => e.promotionId === promotionId);
  if (idx >= 0) {
    all.splice(idx, 1);
    await writeAll(all);
    return false;
  }
  all.push({
    promotionId,
    savedAt: new Date().toISOString(),
    status: "unused",
    isVoucher: false,
  });
  await writeAll(all);
  return true;
}

export async function removeSavedPromotion(
  promotionId: string
): Promise<void> {
  const all = (await readAll()).filter((e) => e.promotionId !== promotionId);
  await writeAll(all);
}

export async function markPromotionUsed(
  promotionId: string,
  used: boolean
): Promise<void> {
  const all = await readAll();
  const e = all.find((x) => x.promotionId === promotionId);
  if (!e) return;
  e.status = used ? "used" : "unused";
  await writeAll(all);
}
