// src/pollService.js
// Runs on a cron schedule. For each tracked account, fetches recent posts,
// filters out already-seen ones, drafts a reply for each new post, and
// queues the drafts for review in the dashboard.

const cron = require("node-cron");
const store = require("./store");
const { getPostsByUserId } = require("./threadsService");
const { draftReply } = require("./draftService");

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

async function runPoll() {
  const accounts = store.getAccounts();
  if (accounts.length === 0) return;

  console.log(`[Poll] Checking ${accounts.length} account(s) for new posts...`);

  for (const account of accounts) {
    const posts = await getPostsByUserId(
      account.userId,
      process.env.THREADS_ACCESS_TOKEN,
      10
    );

    for (const post of posts) {
      if (store.isSeen(post.id)) continue;

      store.markSeen(post.id);

      console.log(`[Poll] New post from @${account.username}: ${post.id}`);

      const draftText = await draftReply(post.text, account.username);
      if (!draftText) {
        console.warn(`[Poll] Draft failed for post ${post.id}`);
        continue;
      }

      store.addDraft({
        id: generateId(),
        postId: post.id,
        postText: post.text,
        postAuthor: account.username,
        postPermalink: post.permalink || null,
        draftText,
        status: "pending", // pending | posted | dismissed
        createdAt: new Date().toISOString(),
      });

      console.log(`[Poll] Draft queued for post ${post.id}`);
    }
  }
}

function startPoller() {
  const intervalMinutes = parseInt(process.env.POLL_INTERVAL_MINUTES || "15", 10);
  const cronExpression = `*/${intervalMinutes} * * * *`;

  console.log(`[Poll] Poller started. Checking every ${intervalMinutes} minutes.`);

  // Run immediately on startup
  runPoll();

  // Then on schedule
  cron.schedule(cronExpression, runPoll);
}

module.exports = { startPoller, runPoll };
