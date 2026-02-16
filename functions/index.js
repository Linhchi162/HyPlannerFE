const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.notifyVendorOnMessage = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    if (!message) return null;

    const chatId = context.params.chatId;
    const chatSnap = await admin.firestore().doc(`chats/${chatId}`).get();
    if (!chatSnap.exists) return null;

    const chat = chatSnap.data() || {};
    const senderRole = message.senderRole;

    // Notify vendor when user sends a message
    if (senderRole !== "user") return null;

    const vendorId = chat.vendorId;
    if (!vendorId) return null;

    const vendorSnap = await admin.firestore().doc(`vendors/${vendorId}`).get();
    if (!vendorSnap.exists) return null;
    const vendor = vendorSnap.data() || {};

    const tokens = Array.isArray(vendor.fcmTokens) ? vendor.fcmTokens : [];
    if (tokens.length === 0) return null;

    const payload = {
      notification: {
        title: `Tin nhắn mới từ ${chat.userName || "Khách hàng"}`,
        body: message.text || "Bạn có tin nhắn mới",
      },
      data: {
        chatId,
        userId: chat.userId || "",
        userName: chat.userName || "",
        userImageUrl: chat.userImageUrl || "",
        vendorId: chat.vendorId || "",
        vendorName: chat.vendorName || "",
        vendorImageUrl: chat.vendorImageUrl || "",
        role: "vendor",
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(payload);

    // Remove invalid tokens
    const invalidTokens = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error && res.error.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await admin.firestore().doc(`vendors/${vendorId}`).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
      });
    }

    return null;
  });

exports.notifyUserOnMessage = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    if (!message) return null;

    const chatId = context.params.chatId;
    const chatSnap = await admin.firestore().doc(`chats/${chatId}`).get();
    if (!chatSnap.exists) return null;

    const chat = chatSnap.data() || {};
    const senderRole = message.senderRole;

    // Notify user when vendor sends a message
    if (senderRole !== "vendor") return null;

    const userId = chat.userId;
    if (!userId) return null;

    const userSnap = await admin.firestore().doc(`users/${userId}`).get();
    if (!userSnap.exists) return null;
    const user = userSnap.data() || {};

    const tokens = Array.isArray(user.fcmTokens) ? user.fcmTokens : [];
    if (tokens.length === 0) return null;

    const payload = {
      notification: {
        title: `Tin nhắn mới từ ${chat.vendorName || "Nhà cung cấp"}`,
        body: message.text || "Bạn có tin nhắn mới",
      },
      data: {
        chatId,
        userId: chat.userId || "",
        userName: chat.userName || "",
        userImageUrl: chat.userImageUrl || "",
        vendorId: chat.vendorId || "",
        vendorName: chat.vendorName || "",
        vendorImageUrl: chat.vendorImageUrl || "",
        role: "user",
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(payload);

    // Remove invalid tokens
    const invalidTokens = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error && res.error.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await admin.firestore().doc(`users/${userId}`).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
      });
    }

    return null;
  });
