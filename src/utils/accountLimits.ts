/**
 * Account limits configuration based on account type
 */

export type AccountType = "FREE" | "VIP" | "PRO";

export interface AccountLimits {
  maxAlbums: number | null; // null = unlimited
  maxInvitationTemplates: number | null; // null = all templates
  maxImagesPerPost: number | null; // null = unlimited
  maxImagesPerAlbum: number | null; // null = unlimited
  canAccessWhoIsNext: boolean;
  canAccessTableArrangement: boolean;
  canBoostPost: boolean; // Đẩy bài 24h
}

const ACCOUNT_LIMITS: Record<AccountType, AccountLimits> = {
  FREE: {
    maxAlbums: 5,
    maxInvitationTemplates: 3,
    maxImagesPerPost: 2,
    maxImagesPerAlbum: 6,
    canAccessWhoIsNext: false,
    canAccessTableArrangement: false,
    canBoostPost: false,
  },
  VIP: {
    maxAlbums: 12,
    maxInvitationTemplates: 15,
    maxImagesPerPost: null, // unlimited
    maxImagesPerAlbum: null, // unlimited
    canAccessWhoIsNext: true,
    canAccessTableArrangement: true,
    canBoostPost: false,
  },
  PRO: {
    maxAlbums: null, // unlimited
    maxInvitationTemplates: null, // all templates
    maxImagesPerPost: null, // unlimited
    maxImagesPerAlbum: null, // unlimited
    canAccessWhoIsNext: true,
    canAccessTableArrangement: true,
    canBoostPost: true,
  },
};

/**
 * Get account limits for a specific account type
 */
export const getAccountLimits = (
  accountType: AccountType = "FREE"
): AccountLimits => {
  return ACCOUNT_LIMITS[accountType] || ACCOUNT_LIMITS.FREE;
};

/**
 * Check if user can create more albums
 */
export const canCreateAlbum = (
  currentAlbumCount: number,
  accountType: AccountType = "FREE"
): boolean => {
  const limits = getAccountLimits(accountType);
  if (limits.maxAlbums === null) return true; // unlimited
  return currentAlbumCount < limits.maxAlbums;
};

/**
 * Check if user can access a specific invitation template
 */
export const canAccessInvitationTemplate = (
  templateIndex: number,
  accountType: AccountType = "FREE"
): boolean => {
  const limits = getAccountLimits(accountType);
  if (limits.maxInvitationTemplates === null) return true; // all templates
  return templateIndex < limits.maxInvitationTemplates;
};

/**
 * Check if user can add more images to a post
 */
export const canAddImageToPost = (
  currentImageCount: number,
  accountType: AccountType = "FREE"
): boolean => {
  const limits = getAccountLimits(accountType);
  if (limits.maxImagesPerPost === null) return true; // unlimited
  return currentImageCount < limits.maxImagesPerPost;
};

/**
 * Check if user can add more images to an album
 */
export const canAddImageToAlbum = (
  currentImageCount: number,
  accountType: AccountType = "FREE"
): boolean => {
  const limits = getAccountLimits(accountType);
  if (limits.maxImagesPerAlbum === null) return true; // unlimited
  return currentImageCount < limits.maxImagesPerAlbum;
};

/**
 * Get maximum allowed images for post
 */
export const getMaxImagesPerPost = (
  accountType: AccountType = "FREE"
): number | null => {
  return getAccountLimits(accountType).maxImagesPerPost;
};

/**
 * Get maximum allowed images for album
 */
export const getMaxImagesPerAlbum = (
  accountType: AccountType = "FREE"
): number | null => {
  return getAccountLimits(accountType).maxImagesPerAlbum;
};

/**
 * Get upgrade message based on feature
 */
export const getUpgradeMessage = (feature: string): string => {
  const messages: Record<string, string> = {
    album:
      "Bạn đã đạt giới hạn số lượng album. Nâng cấp tài khoản để tạo thêm album.",
    invitation:
      "Mẫu thiệp này yêu cầu tài khoản VIP. Vui lòng nâng cấp tài khoản.",
    postImage:
      "Bạn đã đạt giới hạn số lượng ảnh trong bài đăng. Nâng cấp để thêm nhiều ảnh hơn.",
    albumImage:
      "Bạn đã đạt giới hạn số lượng ảnh trong album. Nâng cấp để thêm nhiều ảnh hơn.",
    whoIsNext:
      "Tính năng này chỉ dành cho tài khoản VIP. Vui lòng nâng cấp tài khoản.",
    tableArrangement:
      "Tính năng gợi ý bố trí bàn tiệc chỉ dành cho tài khoản VIP.",
  };
  return (
    messages[feature] || "Vui lòng nâng cấp tài khoản để sử dụng tính năng này."
  );
};
