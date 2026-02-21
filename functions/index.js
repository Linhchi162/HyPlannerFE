const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

const PAYOS_API_BASE = "https://api-merchant.payos.vn";

const getPayosConfig = () => {
  const config = functions.config().payos || {};
  return {
    clientId: config.client_id,
    apiKey: config.api_key,
    checksumKey: config.checksum_key,
    partnerCode: config.partner_code,
    returnUrl: config.return_url,
    cancelUrl: config.cancel_url,
  };
};

const createPayosSignature = (payload, checksumKey) => {
  const data = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join("&");
  return crypto
    .createHmac("sha256", checksumKey)
    .update(data)
    .digest("hex");
};

const getOrderCode = () => {
  const seed = Date.now().toString().slice(-7);
  const rand = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return Number(`${seed}${rand}`);
};

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

exports.createVendorPriorityPayment = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ message: "method-not-allowed" });
      return;
    }

    const { vendorId, amount } = req.body || {};
    if (!vendorId || !amount) {
      res.status(400).json({ message: "missing-vendor-or-amount" });
      return;
    }

    const {
      clientId,
      apiKey,
      checksumKey,
      partnerCode,
      returnUrl,
      cancelUrl,
    } = getPayosConfig();

    if (!clientId || !apiKey || !checksumKey || !returnUrl || !cancelUrl) {
      res.status(500).json({ message: "missing-payos-config" });
      return;
    }

    const orderCode = getOrderCode();
    const description = "Uu tien";
    const payload = {
      orderCode,
      amount: Number(amount),
      description,
      returnUrl,
      cancelUrl,
    };

    const signature = createPayosSignature(payload, checksumKey);

    const headers = {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    };
    if (partnerCode) headers["x-partner-code"] = partnerCode;

    const response = await fetch(`${PAYOS_API_BASE}/v2/payment-requests`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...payload, signature }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(400).json({ message: data?.desc || "payos-create-failed" });
      return;
    }

    const checkoutUrl = data?.data?.checkoutUrl || data?.checkoutUrl;
    const paymentLinkId = data?.data?.paymentLinkId || data?.paymentLinkId;

    await admin
      .firestore()
      .doc(`vendorPayments/${orderCode}`)
      .set({
        vendorId,
        amount: Number(amount),
        status: "pending",
        orderCode,
        checkoutUrl,
        paymentLinkId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({ checkoutUrl, paymentLinkId, orderCode });
  }
);

exports.payosWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ message: "method-not-allowed" });
    return;
  }

  const { checksumKey } = getPayosConfig();
  const body = req.body || {};
  const signature = body.signature;
  const data = body.data || {};

  if (!checksumKey || !signature) {
    res.status(400).json({ message: "missing-signature" });
    return;
  }

  const verifyPayload = {
    amount: data.amount,
    cancelUrl: data.cancelUrl,
    description: data.description,
    orderCode: data.orderCode,
    returnUrl: data.returnUrl,
  };

  const expected = createPayosSignature(verifyPayload, checksumKey);
  if (expected !== signature) {
    res.status(401).json({ message: "invalid-signature" });
    return;
  }

  const orderCode = String(data.orderCode || "");
  if (!orderCode) {
    res.status(400).json({ message: "missing-order-code" });
    return;
  }

  const paymentRef = admin.firestore().doc(`vendorPayments/${orderCode}`);
  const paymentSnap = await paymentRef.get();
  if (!paymentSnap.exists) {
    res.status(404).json({ message: "payment-not-found" });
    return;
  }

  const payment = paymentSnap.data() || {};
  const status = data.status || body.status || "unknown";
  const paid = status === "PAID" || status === "SUCCESS";

  await paymentRef.set(
    {
      status,
      paidAt: paid ? admin.firestore.FieldValue.serverTimestamp() : null,
      payosData: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (paid && payment.vendorId) {
    await admin.firestore().doc(`vendors/${payment.vendorId}`).set(
      {
        isFeatured: true,
        featuredPlan: "priority",
        featuredPrice: payment.amount || 50000,
        featuredSince: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  res.json({ received: true });
});
