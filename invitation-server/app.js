const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const crypto = require("crypto");

const storage = require("./storage");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

function safeSlug(slug) {
  return String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}`;
}

function getUserKeyHash(req) {
  const auth = req.headers.authorization;
  const debug = req.headers["x-debug-user"];
  const raw =
    (auth && typeof auth === "string" && auth.trim()) ||
    (debug && typeof debug === "string" && debug.trim()) ||
    "anonymous";
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function firstNameFromFullName(fullName) {
  const s = String(fullName || "").trim();
  if (!s) return "";
  const parts = s.split(/\s+/);
  // VN names: given name is often the last token
  return parts[parts.length - 1] || s;
}

function adaptWeddingData(input) {
  // Some copied BE templates expect nested fields:
  // - weddingData.groom.firstName / weddingData.bride.firstName
  // While our API uses flat groomName/brideName.
  const groomName = input?.groomName || input?.groom?.fullName || "";
  const brideName = input?.brideName || input?.bride?.fullName || "";

  const groom = input?.groom || {
    firstName: firstNameFromFullName(groomName),
    fullName: groomName,
  };
  const bride = input?.bride || {
    firstName: firstNameFromFullName(brideName),
    fullName: brideName,
  };

  return {
    ...input,
    groomName,
    brideName,
    groom,
    bride,
    language: input?.language || "vi",
    aboutCouple: input?.aboutCouple || "",
    youtubeUrl: input?.youtubeUrl || "",
    bankAccount: input?.bankAccount || null,
    guestRsvpCount: input?.guestRsvpCount || 0,
    guestbookMessages: Array.isArray(input?.guestbookMessages)
      ? input.guestbookMessages
      : [],
    loveStory: Array.isArray(input?.loveStory) ? input.loveStory : [],
    album: Array.isArray(input?.album) ? input.album : [],
    events: Array.isArray(input?.events) ? input.events : [],
  };
}

function renderTemplateOrFallback(res, templateName, weddingData, baseUrl) {
  res.render(templateName, { weddingData }, (err, html) => {
    if (err) {
      // Helpful debug headers; safe because it doesn't include secrets.
      res.setHeader("X-Invitation-Template", "fallback");
      res.setHeader(
        "X-Invitation-Template-Error",
        String(err.message || "render_error").slice(0, 180)
      );
      return res.render("invitation", { weddingData, baseUrl });
    }
    res.setHeader("X-Invitation-Template", templateName);
    return res.send(html);
  });
}

const templateImages = {
  1: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667417/download_d10emq.jpg",
  2: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667399/ee9138c3161766d811f401484930f2ad_xdtlxv.jpg",
  3: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667393/e09aec818ca43fdcae6729bc13386fc8_kcmut6.jpg",
  4: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667375/65c724ee200078ed7875f41b74053c8d_cwrkaa.jpg",
  5: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667369/7b699032cbe8fcd3022f753e7ec28254_ghl1pu.jpg",
  6: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667363/cdc21a3396dc951c2b3b629f79020a74_yv39pm.jpg",
  7: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667357/oge_jqldjy.jpg",
  8: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667346/okkkk_ljlww6.jpg",
  9: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667322/ok_hirb90.jpg",
  10: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667316/wmremove-transformed_xylbai.jpg",
  11: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667293/chat_edit_image_20251221_054120_weioig.png",
  12: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667301/chat_edit_image_20251221_054636_dmvwkn.png",
};

app.get("/", (req, res) => {
  res.json({
    status: "✅ Invitation server running",
    storage: storage.kind,
  });
});

app.get("/_debug/views", (req, res) => {
  try {
    const viewsDir = path.join(__dirname, "views");
    const files = fs.existsSync(viewsDir) ? fs.readdirSync(viewsDir) : [];
    const templates = files
      .filter((f) => /^template-\d+\.ejs$/.test(f))
      .sort((a, b) => {
        const ai = Number(a.match(/^template-(\d+)\.ejs$/)?.[1] || 0);
        const bi = Number(b.match(/^template-(\d+)\.ejs$/)?.[1] || 0);
        return ai - bi;
      });

    res.json({
      viewsDir,
      totalFiles: files.length,
      templates,
      hasFallbackInvitation: files.includes("invitation.ejs"),
      has404: files.includes("404.ejs"),
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to list views" });
  }
});

app.get("/templates", (req, res) => {
  const templates = Array.from({ length: 12 }).map((_, i) => {
    const id = i + 1;
    return {
      id,
      name: `Mẫu thiệp mời ${id}`,
      type: id % 2 === 0 ? "VIP" : "Miễn phí",
      image:
        templateImages[id] ||
        "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    };
  });
  res.json(templates);
});

app.get("/inviletter/preview/:templateId", (req, res) => {
  const templateId = Number(req.params.templateId);
  const weddingData = adaptWeddingData({
    templateId,
    groomName: "Nguyễn Văn A",
    brideName: "Trần Thị B",
    weddingDate: "2026-05-31",
    aboutCouple:
      "Đây là lời giới thiệu mẫu về cặp đôi. Bạn có thể chỉnh sửa phần này trong màn hình quản lý thiệp.",
    youtubeUrl: "https://www.youtube.com/watch?v=cpGxn9SmxTc",
    loveStory: [
      { time: "Ngày đầu", title: "Gặp gỡ", content: "Nội dung mẫu câu chuyện." },
      {
        time: "6 tháng sau",
        title: "Yêu nhau",
        content: "Nội dung mẫu câu chuyện.",
      },
    ],
    album: [
      "https://kenh14cdn.com/203336854389633024/2024/6/2/photo-7-1717318282976804803415.jpg",
      "https://s1.media.ngoisao.vn/resize_580/news/2023/02/11/xoai-non-va-xemesis-tung-bo-anh-valentine-dau-tien-ngot-nhu-mia-lui-1-ngoisaovn-w600-h901.jpeg",
    ],
    events: [
      {
        name: "Lễ Thành Hôn",
        time: "18:00, 31/05/2026",
        venue: "Nhà hàng tiệc cưới",
        address: "TP.HCM",
        mapLink: "https://maps.google.com",
      },
    ],
    bankAccount: { bankBin: "970422", accountNumber: "1234567890" },
    guestRsvpCount: 10,
    guestbookMessages: [{ name: "Khách mời", message: "Chúc mừng hạnh phúc!" }],
    slug: "sample-slug",
  });

  const templateName = `template-${templateId}`;
  return renderTemplateOrFallback(res, templateName, weddingData, getBaseUrl(req));
});

app.get("/_debug/render/:templateId", (req, res) => {
  const templateId = Number(req.params.templateId);
  const templateName = `template-${templateId}`;
  const weddingData = adaptWeddingData({
    templateId,
    groomName: "Nguyễn Văn A",
    brideName: "Trần Thị B",
    weddingDate: "2026-05-31",
    aboutCouple: "debug",
    guestRsvpCount: 10,
    guestbookMessages: [],
    slug: "sample-slug",
  });

  res.render(templateName, { weddingData }, (err, html) => {
    if (err) {
      return res.status(200).json({
        ok: false,
        templateName,
        error: String(err.message || err),
      });
    }
    return res.status(200).json({ ok: true, templateName, htmlChars: html.length });
  });
});

app.post("/invitation/invitation-letters", async (req, res) => {
  const userKeyHash = getUserKeyHash(req);
  const { templateId, groomName, brideName, weddingDate, slug } = req.body || {};

  if (!templateId || !groomName || !brideName || !weddingDate || !slug) {
    return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
  }

  const existing = await storage.getByUserKeyHash(userKeyHash);
  if (existing) {
    return res.status(409).json({
      message:
        "Mỗi tài khoản chỉ được tạo một website. Vui lòng xóa website cũ trước khi tạo mới.",
    });
  }

  const normalizedSlug = safeSlug(slug);
  if (!normalizedSlug) {
    return res.status(400).json({ message: "Slug không hợp lệ." });
  }

  const existingSlug = await storage.getBySlug(normalizedSlug);
  if (existingSlug) {
    return res.status(400).json({
      message: "Địa chỉ website này đã được sử dụng. Vui lòng chọn địa chỉ khác.",
    });
  }

  const invitation = {
    _id: String(Date.now()),
    userKeyHash,
    templateId: Number(templateId),
    groomName: String(groomName),
    brideName: String(brideName),
    weddingDate: String(weddingDate),
    slug: normalizedSlug,
    aboutCouple: "",
    youtubeUrl: "",
    loveStory: [],
    album: [],
    events: [],
    bankAccount: null,
    guestRsvpCount: 0,
    guestbookMessages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await storage.putInvitation(invitation);

  const fullUrl = `${getBaseUrl(req)}/inviletter/${invitation.slug}`;
  return res.status(201).json({
    message: "Tạo website thành công!",
    url: fullUrl,
    data: invitation,
  });
});

app.get("/invitation/my-invitation", async (req, res) => {
  const userKeyHash = getUserKeyHash(req);
  const inv = await storage.getByUserKeyHash(userKeyHash);
  res.status(200).json(inv || null);
});

app.put("/invitation/my-invitation", async (req, res) => {
  const userKeyHash = getUserKeyHash(req);
  const current = await storage.getByUserKeyHash(userKeyHash);
  if (!current) return res.status(404).json({ message: "Không tìm thấy website." });

  const {
    groomName,
    brideName,
    weddingDate,
    aboutCouple,
    youtubeUrl,
    loveStory,
    album,
    events,
    bankAccount,
  } = req.body || {};

  if (groomName !== undefined) current.groomName = groomName;
  if (brideName !== undefined) current.brideName = brideName;
  if (weddingDate !== undefined) current.weddingDate = weddingDate;
  if (aboutCouple !== undefined) current.aboutCouple = aboutCouple;
  if (youtubeUrl !== undefined) current.youtubeUrl = youtubeUrl;
  if (Array.isArray(loveStory)) current.loveStory = loveStory;
  if (Array.isArray(album)) current.album = album;
  if (Array.isArray(events)) current.events = events;
  if (bankAccount !== undefined) current.bankAccount = bankAccount;
  current.updatedAt = new Date().toISOString();

  await storage.putInvitation(current);
  res.status(200).json(current);
});

app.delete("/invitation/my-invitation", async (req, res) => {
  const userKeyHash = getUserKeyHash(req);
  const current = await storage.getByUserKeyHash(userKeyHash);
  if (!current) {
    return res.status(404).json({ message: "Không tìm thấy website để xóa." });
  }
  await storage.deleteByUserKeyHash(userKeyHash, current.slug);
  res.status(200).json({ message: "Đã xóa website thành công." });
});

const rsvpHandler = async (req, res) => {
  const slug = safeSlug(req.params.slug);
  const inv = await storage.getBySlug(slug);
  if (!inv) return res.status(404).json({ message: "Không tìm thấy thiệp mời" });

  inv.guestRsvpCount = (inv.guestRsvpCount || 0) + 1;
  inv.updatedAt = new Date().toISOString();
  await storage.putInvitation(inv);

  return res
    .status(200)
    .json({ message: "Xác nhận tham dự thành công!", count: inv.guestRsvpCount });
};

app.post("/invitation/:slug/rsvp", rsvpHandler);
// Alias used by copied BE templates
app.post("/inviletter/invitation/:slug/rsvp", rsvpHandler);

const addWishHandler = async (req, res) => {
  const slug = safeSlug(req.params.slug);
  const { name, message } = req.body || {};
  if (!name || !message) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập đầy đủ tên và lời chúc." });
  }

  const inv = await storage.getBySlug(slug);
  if (!inv) return res.status(404).json({ message: "Không tìm thấy thiệp mời" });

  inv.guestbookMessages = Array.isArray(inv.guestbookMessages)
    ? inv.guestbookMessages
    : [];
  inv.guestbookMessages.unshift({
    name: String(name).trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
  });
  inv.updatedAt = new Date().toISOString();
  await storage.putInvitation(inv);

  return res.status(201).json({ message: "Gửi lời chúc thành công!" });
};

app.post("/invitation/:slug/add-wish", addWishHandler);
// Alias used by copied BE templates
app.post("/inviletter/invitation/:slug/add-wish", addWishHandler);

app.get("/inviletter/:slug", async (req, res) => {
  const slug = safeSlug(req.params.slug);
  const inv = await storage.getBySlug(slug);
  if (!inv) return res.status(404).send("Not found");

  const weddingData = adaptWeddingData({
    templateId: inv.templateId,
    groomName: inv.groomName,
    brideName: inv.brideName,
    weddingDate: inv.weddingDate,
    aboutCouple: inv.aboutCouple,
    youtubeUrl: inv.youtubeUrl,
    loveStory: inv.loveStory,
    album: inv.album,
    events: inv.events,
    bankAccount: inv.bankAccount,
    guestRsvpCount: inv.guestRsvpCount,
    guestbookMessages: inv.guestbookMessages,
    slug: inv.slug,
  });

  const templateName = `template-${inv.templateId}`;
  return renderTemplateOrFallback(res, templateName, weddingData, getBaseUrl(req));
});

module.exports = app;

