const path = require("path");
const fs = require("fs");

const hasKv =
  !!process.env.KV_REST_API_URL &&
  !!process.env.KV_REST_API_TOKEN;

const isVercel = !!process.env.VERCEL;

// Storage priority:
// - Vercel KV (persistent) if configured
// - File JSON when running locally
// - In-memory when on Vercel without KV (NOT persistent)

let kind = "memory";

/** @type {Map<string, any>} */
const memByUser = new Map();
/** @type {Map<string, any>} */
const memBySlug = new Map();

const DATA_PATH = path.join(__dirname, "data", "invitations.json");

function readFileDb() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.byUserKeyHash) parsed.byUserKeyHash = {};
    if (!parsed.bySlug) parsed.bySlug = {};
    return parsed;
  } catch {
    return { byUserKeyHash: {}, bySlug: {} };
  }
}

function writeFileDb(db) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), "utf8");
}

async function getKv() {
  // Lazy require so local users don't need kv
  // eslint-disable-next-line global-require
  const { kv } = require("@vercel/kv");
  return kv;
}

function kvKeyUser(userKeyHash) {
  return `invitation:byUser:${userKeyHash}`;
}
function kvKeySlug(slug) {
  return `invitation:bySlug:${slug}`;
}

async function getByUserKeyHash(userKeyHash) {
  if (kind === "kv") {
    const kv = await getKv();
    return await kv.get(kvKeyUser(userKeyHash));
  }
  if (kind === "file") {
    const db = readFileDb();
    return db.byUserKeyHash[userKeyHash] || null;
  }
  return memByUser.get(userKeyHash) || null;
}

async function getBySlug(slug) {
  if (kind === "kv") {
    const kv = await getKv();
    return await kv.get(kvKeySlug(slug));
  }
  if (kind === "file") {
    const db = readFileDb();
    return db.bySlug[slug] || null;
  }
  return memBySlug.get(slug) || null;
}

async function putInvitation(invitation) {
  if (!invitation || !invitation.userKeyHash || !invitation.slug) return;
  if (kind === "kv") {
    const kv = await getKv();
    await kv.set(kvKeyUser(invitation.userKeyHash), invitation);
    await kv.set(kvKeySlug(invitation.slug), invitation);
    return;
  }
  if (kind === "file") {
    const db = readFileDb();
    db.byUserKeyHash[invitation.userKeyHash] = invitation;
    db.bySlug[invitation.slug] = invitation;
    writeFileDb(db);
    return;
  }
  memByUser.set(invitation.userKeyHash, invitation);
  memBySlug.set(invitation.slug, invitation);
}

async function deleteByUserKeyHash(userKeyHash, slug) {
  if (kind === "kv") {
    const kv = await getKv();
    await kv.del(kvKeyUser(userKeyHash));
    if (slug) await kv.del(kvKeySlug(slug));
    return;
  }
  if (kind === "file") {
    const db = readFileDb();
    const current = db.byUserKeyHash[userKeyHash];
    delete db.byUserKeyHash[userKeyHash];
    if (slug) delete db.bySlug[slug];
    else if (current && current.slug) delete db.bySlug[current.slug];
    writeFileDb(db);
    return;
  }
  memByUser.delete(userKeyHash);
  if (slug) memBySlug.delete(slug);
}

// init kind
if (hasKv) {
  kind = "kv";
} else if (!isVercel) {
  kind = "file";
} else {
  kind = "memory";
}

module.exports = {
  kind,
  getByUserKeyHash,
  getBySlug,
  putInvitation,
  deleteByUserKeyHash,
};

