import apiClient from "../api/client";

export interface Guest {
  _id: string;
  weddingEventId: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  relationship: "family" | "friend" | "colleague" | "other";
  group: "groom" | "bride" | "both";
  category?: string;
  numberOfCompanions: number;
  totalGuests: number;
  invitationStatus: "not_sent" | "sent" | "delivered" | "opened";
  attendanceStatus: "pending" | "confirmed" | "declined" | "no_response";
  tableNumber?: number;
  seatNumber?: number;
  dietaryRestrictions?: string;
  notes?: string;
  tags?: string[];
  gift?: {
    type: "money" | "item" | "both" | "none";
    amount?: number;
    description?: string;
    receivedDate?: string;
    receivedMethod?:
      | "at_event"
      | "bank_transfer"
      | "before_event"
      | "after_event"
      | "not_received";
    returnedGift?: boolean;
  };
  invitationSentDate?: string;
  responseDate?: string;
  checkedIn: boolean;
  checkedInDate?: string;
  isActive: boolean;
  personalInvitationLink?: string;
  invitationLetterId?: string;
  confirmedViaInvitation?: boolean;
  invitationConfirmDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestStats {
  total: number;
  totalGuests: number;
  confirmed: number;
  declined: number;
  pending: number;
  noResponse: number;
  groomSide: number;
  brideSide: number;
  // Thống kê trạng thái thiệp mời
  invitationSent: number;
  invitationNotSent: number;
  invitationDelivered: number;
  invitationOpened: number;
  // Tổng số khách thực tế (bao gồm người đi cùng)
  totalConfirmedGuests: number;
}

export interface TableSuggestion {
  totalGuests: number;
  confirmedGuests: number;
  potentialGuests: number;
  seatsPerTable: number;
  requiredTables: number;
  confirmedTables: number;
  potentialTables: number;
  reserveTables: number;
  suggestedTables: number;
  confirmationRate: number;
  recommendations: {
    minimum: number;
    recommended: number;
    maximum: number;
  };
  breakdown: {
    confirmedGuests: number;
    pendingGuests: number;
    declinedGuests: number;
  };
}

// Create guest
export const createGuest = async (data: Partial<Guest>): Promise<Guest> => {
  const response = await apiClient.post("/guests/create", data);
  return response.data.guest;
};

// Get all guests for a wedding event
export const getGuestsByWeddingEvent = async (
  weddingEventId: string,
  filters?: {
    group?: string;
    attendanceStatus?: string;
    relationship?: string;
  }
): Promise<{ guests: Guest[]; stats: GuestStats }> => {
  const params = new URLSearchParams(filters as any).toString();
  const response = await apiClient.get(`/guests/${weddingEventId}?${params}`);
  return response.data;
};

// Update guest
export const updateGuest = async (
  guestId: string,
  data: Partial<Guest>
): Promise<Guest> => {
  const response = await apiClient.put(`/guests/${guestId}`, data);
  return response.data.guest;
};

// Delete guest
export const deleteGuest = async (guestId: string): Promise<void> => {
  await apiClient.delete(`/guests/${guestId}`);
};

// Update attendance status
export const updateAttendanceStatus = async (
  guestId: string,
  attendanceStatus: string
): Promise<Guest> => {
  const response = await apiClient.put(`/guests/${guestId}/attendance`, {
    attendanceStatus,
  });
  return response.data.guest;
};

// Update gift
export const updateGift = async (
  guestId: string,
  gift: {
    type: string;
    amount?: number;
    description?: string;
    receivedDate?: string;
    receivedMethod?: string;
    returnedGift?: boolean;
  }
): Promise<Guest> => {
  const response = await apiClient.put(`/guests/${guestId}/gift`, gift);
  return response.data.guest;
};

// Get table suggestions
export const getTableSuggestions = async (
  weddingEventId: string,
  guestsPerTable: number = 10
): Promise<TableSuggestion> => {
  const response = await apiClient.get(
    `/guests/${weddingEventId}/table-suggestions?guestsPerTable=${guestsPerTable}`
  );
  return response.data;
};

// Import guests
export const importGuests = async (
  weddingEventId: string,
  guests: Partial<Guest>[]
): Promise<Guest[]> => {
  const response = await apiClient.post("/guests/import", {
    weddingEventId,
    guests,
  });
  return response.data.guests;
};

// Export guests
export const exportGuests = async (
  weddingEventId: string
): Promise<Guest[]> => {
  const response = await apiClient.get(`/guests/${weddingEventId}/export`);
  return response.data.guests;
};

// Notification interfaces
export interface GuestNotification {
  type:
    | "table_reminder"
    | "guest_response"
    | "thank_you_reminder"
    | "low_confirmation";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  actionText: string;
  data: any;
}

export interface NotificationStats {
  total: number;
  confirmed: number;
  pending: number;
  daysUntilWedding: number;
}

// Get notifications
export const getNotifications = async (
  weddingEventId: string
): Promise<{
  notifications: GuestNotification[];
  stats: NotificationStats;
}> => {
  const response = await apiClient.get(
    `/guests/${weddingEventId}/notifications`
  );
  return response.data;
};

// Tags interfaces
export interface PopularTag {
  tag: string;
  count: number;
}

export interface TagsResponse {
  popularTags: PopularTag[];
  commonTags: string[];
  totalUniqueTags: number;
}

// Get popular tags
export const getPopularTags = async (
  weddingEventId: string
): Promise<TagsResponse> => {
  const response = await apiClient.get(
    `/guests/${weddingEventId}/popular-tags`
  );
  return response.data;
};

// Generate personal invitation links for all guests
export const generateInvitationLinks = async (
  weddingEventId: string
): Promise<{
  message: string;
  totalGuests: number;
  updatedCount: number;
  invitationBaseUrl: string;
}> => {
  const response = await apiClient.post(
    `/guests/${weddingEventId}/generate-invitation-links`
  );
  return response.data;
};

// Update invitation status from wedding hub
export const updateInvitationStatusFromHub = async (
  guestId: string,
  data: {
    invitationStatus?: string;
    attendanceStatus?: string;
    responseMessage?: string;
  }
): Promise<Guest> => {
  const response = await apiClient.post(
    `/guests/${guestId}/update-invitation-status`,
    data
  );
  return response.data.guest;
};

// Export guest list as PDF data
export interface PDFGuestData {
  title: string;
  weddingDate?: string;
  totalGuests: number;
  totalInvited: number;
  confirmed: number;
  pending: number;
  declined: number;
  guests: Array<{
    stt: number;
    name: string;
    phoneNumber: string;
    group: string;
    relationship: string;
    totalGuests: number;
    attendanceStatus: string;
    tableNumber: string;
    dietaryRestrictions: string;
    notes: string;
    tags: string[];
  }>;
  generatedAt: string;
}

export const exportGuestListPDF = async (
  weddingEventId: string
): Promise<PDFGuestData> => {
  const response = await apiClient.get(`/guests/${weddingEventId}/export-pdf`);
  return response.data;
};

// Share link interfaces
export interface ShareLink {
  shareUrl: string;
  token: string;
  expiresAt: string;
  permissions: "view" | "edit";
}

export interface SharedGuestListData {
  weddingEvent: {
    groomName?: string;
    brideName?: string;
    weddingDate?: string;
  };
  guests: Guest[];
  stats: {
    total: number;
    totalGuests: number;
    confirmed: number;
    pending: number;
    declined: number;
  };
  permissions: "view" | "edit";
  expiresAt: string;
}

// Create shareable link for guest list
export const createShareLink = async (
  weddingEventId: string,
  options?: {
    expiresInDays?: number;
    permissions?: "view" | "edit";
  }
): Promise<ShareLink> => {
  const response = await apiClient.post(
    `/guests/${weddingEventId}/create-share-link`,
    options
  );
  return response.data;
};

// Get shared guest list (public, no auth)
export const getSharedGuestList = async (
  token: string
): Promise<SharedGuestListData> => {
  const response = await apiClient.get(`/guests/shared/${token}`);
  return response.data;
};

// Send thank you emails
export interface ThankYouEmailResponse {
  message: string;
  recipients: number;
  emails: Array<{
    to: string;
    name: string;
    subject: string;
    message: string;
  }>;
}

export const sendThankYouEmails = async (
  weddingEventId: string,
  data?: {
    message?: string;
    guestIds?: string[];
  }
): Promise<ThankYouEmailResponse> => {
  const response = await apiClient.post(
    `/guests/${weddingEventId}/send-thank-you`,
    data
  );
  return response.data;
};
