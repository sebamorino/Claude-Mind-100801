// src/draftService.js
// Uses the Anthropic API to draft a reply in your voice for a given post.

const axios = require("axios");
const VOICE_CONTEXT = require("./voiceContext");

async function draftReply(postText, postAuthor) {
  const prompt = `
${VOICE_CONTEXT}

---

You are drafting a reply on Threads on behalf of the person described above.

The post you are replying to was written by @${postAuthor} and reads:

"${postText}"

Draft a reply that:
- Sounds exactly like the person described — direct, stripped down, no filler
- Adds genuine value: a reframe, a sharp insight, a pushback, or a question that opens conversation
- Is 1–3 sentences unless more depth genuinely serves the moment
- Never opens with agreement, flattery, or "great post"
- Contains no emojis, ever
- Feels like it came from a peer, not a fan

Return only the reply text. No preamble, no explanation, no quotation marks.
`;

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    const draft = response.data?.content?.[0]?.text?.trim();
    return draft || null;
  } catch (err) {
    console.error("[Draft] Failed to generate reply:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { draftReply };
