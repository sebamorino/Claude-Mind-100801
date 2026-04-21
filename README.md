# Claude-Mind
# Threads Reply Tool

Monitor tracked Threads accounts, get Claude-drafted replies in your voice, post with one click.

---

## Stack

- Node.js + Express (backend)
- Threads Graph API (reading posts, posting replies)
- Anthropic API (drafting replies via Claude)
- Vanilla HTML/JS dashboard (no framework needed)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```
THREADS_USER_ID=          # Your Threads user ID
THREADS_ACCESS_TOKEN=     # Your long-lived Threads access token
ANTHROPIC_API_KEY=        # Your Anthropic API key
PORT=3000
POLL_INTERVAL_MINUTES=15
```

### 3. Get your Threads API credentials

1. Go to https://developers.facebook.com and create a new app
2. Add the Threads product to your app
3. Request the following permissions:
   - `threads_basic`
   - `threads_manage_replies`
4. Complete Meta's app review for `threads_manage_replies`
5. Generate a long-lived access token for your account
6. Find your Threads User ID via:
   ```
   GET https://graph.threads.net/v1.0/me?access_token=YOUR_TOKEN
   ```

### 4. Customize your voice

Open `src/voiceContext.js` and update it with your writing style,
intellectual blueprint, and example replies. The closer it is to how
you actually think and write, the sharper the drafts will be.

### 5. Run

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

Open http://localhost:3000 in your browser.

---

## How It Works

1. Add accounts to track via the sidebar — enter a Threads username and click Track Account
2. The poller runs every N minutes (set via POLL_INTERVAL_MINUTES) and checks each tracked account for new posts
3. For each new post, Claude drafts a reply in your voice and queues it in the dashboard
4. Review drafts, edit any that need adjusting, click Post Reply to publish
5. Use Redraft to regenerate a draft from scratch if needed
6. Use Run Manual Poll in the sidebar to force an immediate check

---

## File Structure

```
threads-reply-tool/
  src/
    server.js         — Express API + routes
    pollService.js    — Cron-based account monitor
    threadsService.js — Threads Graph API client
    draftService.js   — Claude drafting via Anthropic API
    store.js          — File-based data store
    voiceContext.js   — Your writing style and intellectual blueprint
  public/
    index.html        — Dashboard UI
  data/               — Auto-created on first run
    accounts.json     — Tracked accounts
    drafts.json       — Queued reply drafts
    seen.json         — Already-processed post IDs
  .env.example
  package.json
  README.md
```

---

## Notes

- All data is stored locally in `/data` — no external database needed
- The tool only posts when YOU click Post Reply — nothing is ever automatic
- Replies post individually through the Threads API, which keeps behavior looking human
- Long-lived Threads access tokens expire after 60 days — you will need to refresh them
