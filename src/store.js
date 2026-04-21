// src/store.js
// Lightweight file-based store. No database needed.
// Persists across restarts via JSON files in the /data directory.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const DRAFTS_FILE = path.join(DATA_DIR, "drafts.json");
const SEEN_FILE = path.join(DATA_DIR, "seen.json");

// Ensure data directory and files exist
function init() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(ACCOUNTS_FILE)) fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([]));
  if (!fs.existsSync(DRAFTS_FILE)) fs.writeFileSync(DRAFTS_FILE, JSON.stringify([]));
  if (!fs.existsSync(SEEN_FILE)) fs.writeFileSync(SEEN_FILE, JSON.stringify([]));
}

function read(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── Accounts ─────────────────────────────────────────────────────────────
function getAccounts() { return read(ACCOUNTS_FILE); }

function addAccount(account) {
  // account: { username, userId }
  const accounts = getAccounts();
  if (accounts.find((a) => a.userId === account.userId)) return false;
  accounts.push(account);
  write(ACCOUNTS_FILE, accounts);
  return true;
}

function removeAccount(userId) {
  const accounts = getAccounts().filter((a) => a.userId !== userId);
  write(ACCOUNTS_FILE, accounts);
}

// ─── Seen Post IDs ────────────────────────────────────────────────────────
function getSeenIds() { return read(SEEN_FILE); }

function markSeen(postId) {
  const seen = getSeenIds();
  if (!seen.includes(postId)) {
    seen.push(postId);
    // Keep the list from growing unbounded — retain last 2000 IDs
    if (seen.length > 2000) seen.splice(0, seen.length - 2000);
    write(SEEN_FILE, seen);
  }
}

function isSeen(postId) { return getSeenIds().includes(postId); }

// ─── Drafts ───────────────────────────────────────────────────────────────
function getDrafts() { return read(DRAFTS_FILE); }

function addDraft(draft) {
  // draft: { id, postId, postText, postAuthor, postPermalink, draftText, createdAt }
  const drafts = getDrafts();
  drafts.unshift(draft); // newest first
  write(DRAFTS_FILE, drafts);
}

function updateDraft(draftId, updates) {
  const drafts = getDrafts().map((d) =>
    d.id === draftId ? { ...d, ...updates } : d
  );
  write(DRAFTS_FILE, drafts);
}

function removeDraft(draftId) {
  const drafts = getDrafts().filter((d) => d.id !== draftId);
  write(DRAFTS_FILE, drafts);
}

module.exports = {
  init,
  getAccounts, addAccount, removeAccount,
  getSeenIds, markSeen, isSeen,
  getDrafts, addDraft, updateDraft, removeDraft,
};
