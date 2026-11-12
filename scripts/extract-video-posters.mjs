#!/usr/bin/env node
/**
 * Extract static JPEG posters from menu/brand MP4s (build-time; not in the browser).
 * Requires ffmpeg. Reads data/menu-snapshot.json and writes to public/.
 *
 * Usage:
 *   node scripts/extract-video-posters.mjs
 *   VITE_MEDIA_ORIGIN=https://your.r2.dev node scripts/extract-video-posters.mjs
 *
 * Override per-asset seek (seconds) with POSTER_SEEKS env JSON, e.g.
 *   POSTER_SEEKS='{"menu/espresso-duplo.mp4":0.8}'
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = JSON.parse(
  readFileSync(join(root, "data/menu-snapshot.json"), "utf8"),
);

const origin = (process.env.VITE_MEDIA_ORIGIN || "").replace(/\/$/, "");
const defaultSeek = Number(process.env.POSTER_SEEK_SECONDS ?? "0.75");
let seekMap = {};
try {
  if (process.env.POSTER_SEEKS) {
    seekMap = JSON.parse(process.env.POSTER_SEEKS);
  }
} catch {
  console.warn("POSTER_SEEKS ignored: invalid JSON");
}

function localPath(relative) {
  return join(root, "public", relative.replace(/^\//, ""));
}

function inputUrl(relativePath) {
  const rel = relativePath.replace(/^\//, "");
  if (origin) return `${origin}/${rel}`;
  return localPath(relativePath);
}

function posterOutPath(relativeVideo) {
  if (relativeVideo.startsWith("/brand/")) {
    const base = relativeVideo.replace(/\.mp4$/i, "");
    if (base.endsWith("-poster")) return `${base}.jpg`;
    return `${base}-poster.jpg`;
  }
  return relativeVideo.replace(/\.mp4$/i, "-video-poster.jpg");
}

function collectVideos() {
  const items = [];
  if (snapshot.hub?.video) {
    items.push({
      video: snapshot.hub.video,
      poster: snapshot.hub.poster ?? posterOutPath(snapshot.hub.video),
      seek: seekMap[snapshot.hub.video] ?? defaultSeek,
    });
  }
  for (const slide of snapshot.slides ?? []) {
    if (slide.kind !== "product" || !slide.video) continue;
    const poster =
      slide.videoPoster?.trim() || posterOutPath(slide.video);
    items.push({
      video: slide.video,
      poster,
      seek: seekMap[slide.video] ?? defaultSeek,
    });
  }
  return items;
}

function runFfmpeg(input, output, seek) {
  mkdirSync(dirname(output), { recursive: true });
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(seek),
    "-i",
    input,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    "-vf",
    "scale=1080:-2",
    output,
  ];
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed for ${input}`);
  }
}

function main() {
  const ffmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (ffmpeg.status !== 0) {
    console.error("ffmpeg not found — install ffmpeg to extract posters.");
    process.exit(1);
  }

  const manifest = [];
  for (const { video, poster, seek } of collectVideos()) {
    const input = inputUrl(video);
    const output = localPath(poster);
    console.log(`→ ${poster}  (from ${video} @ ${seek}s)`);
    runFfmpeg(input, output, seek);
    manifest.push({ video, poster, seek });
  }

  writeFileSync(
    join(root, "data/video-posters-manifest.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), items: manifest }, null, 2)}\n`,
  );
  console.log(`Done. Upload public/** and R2 mirror.`);
}

main();
