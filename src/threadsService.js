// src/threadsService.js
// Handles all communication with the Threads Graph API.

const axios = require("axios");

const BASE_URL = "https://graph.threads.net/v1.0";

// ─── Fetch recent posts from a single public account ───────────────────────
// Threads API requires the target account's user ID.
// You can resolve a username to an ID via the /users endpoint.
async function getPostsByUserId(userId, accessToken, limit = 10) {
  try {
    const response = await axios.get(`${BASE_URL}/${userId}/threads`, {
      params: {
        fields: "id,text,timestamp,username,permalink",
        limit,
        access_token: accessToken,
      },
    });
    return response.data.data || [];
  } catch (err) {
    console.error(`[Threads] Failed to fetch posts for user ${userId}:`, err.response?.data || err.message);
    return [];
  }
}

// ─── Resolve a Threads username to a user ID ───────────────────────────────
async function resolveUsername(username, accessToken) {
  try {
    const response = await axios.get(`${BASE_URL}/users`, {
      params: {
        username,
        fields: "id,username",
        access_token: accessToken,
      },
    });
    return response.data?.id || null;
  } catch (err) {
    console.error(`[Threads] Failed to resolve username @${username}:`, err.response?.data || err.message);
    return null;
  }
}

// ─── Post a reply to a specific thread ────────────────────────────────────
// Step 1: Create a reply container
// Step 2: Publish it
async function postReply(myUserId, replyToPostId, replyText, accessToken) {
  try {
    // Step 1 — Create container
    const containerRes = await axios.post(
      `${BASE_URL}/${myUserId}/threads`,
      null,
      {
        params: {
          media_type: "TEXT",
          text: replyText,
          reply_to_id: replyToPostId,
          access_token: accessToken,
        },
      }
    );

    const containerId = containerRes.data?.id;
    if (!containerId) throw new Error("No container ID returned.");

    // Step 2 — Publish
    const publishRes = await axios.post(
      `${BASE_URL}/${myUserId}/threads_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: accessToken,
        },
      }
    );

    return { success: true, publishedId: publishRes.data?.id };
  } catch (err) {
    console.error(`[Threads] Failed to post reply:`, err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
}

module.exports = { getPostsByUserId, resolveUsername, postReply };
