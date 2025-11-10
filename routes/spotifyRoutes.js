import { Router } from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

async function getAccessToken() {
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
    console.error("Token refresh failed", r.status, text); // <-- see real cause
    throw new Error(`Refresh failed ${r.status}`);
  }
  return r.json();
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

export default router;
