// src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const store = require("./store");
const { resolveUsername, postReply } = require("./threadsService");
const { draftReply } = require("./draftService");
const { startPoller } = require("./pollService");

store.init();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ─── Accounts ─────────────────────────────────────────────────────────────

// GET /api/accounts — list all tracked accounts
app.get("/api/accounts", (req, res) => {
  res.json(store.getAccounts());
});

// POST /api/accounts — add an account by username
app.post("/api/accounts", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "username required" });

  const userId = await resolveUsername(username, process.env.THREADS_ACCESS_TOKEN);
  if (!userId) return res.status(404).json({ error: `Could not resolve @${username}` });

  const added = store.addAccount({ username, userId });
  if (!added) return res.status(409).json({ error: "Account already tracked" });

  res.json({ success: true, username, userId });
});

// DELETE /api/accounts/:userId — remove a tracked account
app.delete("/api/accounts/:userId", (req, res) => {
  store.removeAccount(req.params.userId);
  res.json({ success: true });
});

// ─── Drafts ───────────────────────────────────────────────────────────────

// GET /api/drafts — list all pending drafts
app.get("/api/drafts", (req, res) => {
  const drafts = store.getDrafts().filter((d) => d.status === "pending");
  res.json(drafts);
});

// PATCH /api/drafts/:id — edit draft text
app.patch("/api/drafts/:id", (req, res) => {
  const { draftText } = req.body;
  if (!draftText) return res.status(400).json({ error: "draftText required" });
  store.updateDraft(req.params.id, { draftText });
  res.json({ success: true });
});

// POST /api/drafts/:id/post — post the reply to Threads
app.post("/api/drafts/:id/post", async (req, res) => {
  const draft = store.getDrafts().find((d) => d.id === req.params.id);
  if (!draft) return res.status(404).json({ error: "Draft not found" });

  const result = await postReply(
    process.env.THREADS_USER_ID,
    draft.postId,
    draft.draftText,
    process.env.THREADS_ACCESS_TOKEN
  );

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  store.updateDraft(draft.id, { status: "posted", postedAt: new Date().toISOString() });
  res.json({ success: true, publishedId: result.publishedId });
});

// POST /api/drafts/:id/redraft — regenerate the draft via Claude
app.post("/api/drafts/:id/redraft", async (req, res) => {
  const draft = store.getDrafts().find((d) => d.id === req.params.id);
  if (!draft) return res.status(404).json({ error: "Draft not found" });

  const newDraft = await draftReply(draft.postText, draft.postAuthor);
  if (!newDraft) return res.status(500).json({ error: "Draft generation failed" });

  store.updateDraft(draft.id, { draftText: newDraft });
  res.json({ success: true, draftText: newDraft });
});

// DELETE /api/drafts/:id — dismiss a draft
app.delete("/api/drafts/:id", (req, res) => {
  store.updateDraft(req.params.id, { status: "dismissed" });
  res.json({ success: true });
});

// ─── Manual poll trigger ───────────────────────────────────────────────────
app.post("/api/poll", async (req, res) => {
  const { runPoll } = require("./pollService");
  await runPoll();
  res.json({ success: true, message: "Poll complete" });
});

// ─── Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  Threads Reply Tool running at http://localhost:${PORT}\n`);
  startPoller();
});
