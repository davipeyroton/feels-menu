/**
 * Read-only check of R2 public media headers (CORS, Range, cache).
 * Does not change bucket configuration.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = (
  process.env.VITE_MEDIA_ORIGIN ??
  "https://pub-be112af91ac14243a02460c769b4037c.r2.dev"
).replace(/\/$/, "");
const ORIGINS = (
  process.env.CORS_TEST_ORIGINS ??
  "https://feels-menu.vercel.app,http://localhost:5173"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ASSETS = [
  "brand/intro-menu.mp4",
  "menu/espresso-duplo.mp4",
  "menu/cappuccino.mp4",
  "menu/espresso-duplo-video-poster.jpg",
];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "performance", "r2-headers-check.json");

async function head(url, headers = {}) {
  const res = await fetch(url, { method: "HEAD", headers });
  const out = {};
  res.headers.forEach((v, k) => {
    out[k.toLowerCase()] = v;
  });
  return { status: res.status, headers: out };
}

async function rangeGet(url, headers = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Range: "bytes=0-1", ...headers },
  });
  const out = {};
  res.headers.forEach((v, k) => {
    out[k.toLowerCase()] = v;
  });
  const body = await res.arrayBuffer();
  return { status: res.status, headers: out, bodyBytes: body.byteLength };
}

const report = {
  checkedAt: new Date().toISOString(),
  origin: ORIGIN,
  testOrigins: ORIGINS,
  assets: [],
};

for (const path of ASSETS) {
  const url = `${ORIGIN}/${path}`;
  const entry = { path, url, head: await head(url), range: await rangeGet(url) };
  entry.corsByOrigin = {};
  for (const o of ORIGINS) {
    entry.corsByOrigin[o] = {
      head: await head(url, { Origin: o }),
      range: await rangeGet(url, { Origin: o }),
    };
  }
  report.assets.push(entry);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${OUT}`);
