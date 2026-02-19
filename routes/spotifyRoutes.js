import { Router } from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

// In-memory cache for the Spotify access token
let tokenCache = {
  accessToken: null,
  expiresAt: 0,
};

async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60000) {
    return { access_token: tokenCache.accessToken };
  }

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    console.error("Token refresh failed", r.status, text);
    throw new Error(`Refresh failed ${r.status}`);
  }

  const data = await r.json();

  // Update cache
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data;
}


router.get("/now-playing", async (_req, res) => {
  try {
    const { access_token } = await getAccessToken();
    const r = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (r.status === 204 || r.status > 400) return res.json({ isPlaying: false });
    const d = await r.json();
    res.json({
      isPlaying: d.is_playing,
      title: d.item?.name,
      artist: d.item?.artists?.map(a => a.name).join(", "),
      url: d.item?.external_urls?.spotify,
      album: d.item?.album?.name,
      albumArt: d.item?.album?.images?.[0]?.url,
    });
  } catch (e) { res.status(500).json({ error: "now-playing failed" }); }
});

router.get("/recently-played", async (_req, res) => {
  try {
    const { access_token } = await getAccessToken();
    const r = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const d = await r.json();
    const t = d.items?.[0]?.track;
    res.json(t ? {
      title: t.name,
      artist: t.artists?.map(a => a.name).join(", "),
      url: t.external_urls?.spotify,
      album: t.album?.name,
      albumArt: t.album?.images?.[0]?.url,
    } : {});
  } catch (e) { res.status(500).json({ error: "recently-played failed" }); }
});

router.get("/combined", async (_req, res) => {
  try {
    const { access_token } = await getAccessToken();

    // Fetch both in parallel to reduce total latency
    const [nowPlayingRes, recentlyPlayedRes] = await Promise.all([
      fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
        headers: { Authorization: `Bearer ${access_token}` },
      })
    ]);

    let nowPlayingData = { isPlaying: false };
    if (nowPlayingRes.status === 200) {
      const d = await nowPlayingRes.json();
      nowPlayingData = {
        isPlaying: d.is_playing,
        title: d.item?.name,
        artist: d.item?.artists?.map(a => a.name).join(", "),
        url: d.item?.external_urls?.spotify,
        album: d.item?.album?.name,
        albumArt: d.item?.album?.images?.[0]?.url,
      };
    }

    let recentlyPlayedData = {};
    if (recentlyPlayedRes.status === 200) {
      const d = await recentlyPlayedRes.json();
      const t = d.items?.[0]?.track;
      if (t) {
        recentlyPlayedData = {
          title: t.name,
          artist: t.artists?.map(a => a.name).join(", "),
          url: t.external_urls?.spotify,
          album: t.album?.name,
          albumArt: t.album?.images?.[0]?.url,
        };
      }
    }

    res.json({
      nowPlaying: nowPlayingData,
      recentlyPlayed: recentlyPlayedData
    });

  } catch (e) {
    console.error("Combined Spotify fetch failed", e);
    res.status(500).json({ error: "combined fetch failed" });
  }
});

export default router;
