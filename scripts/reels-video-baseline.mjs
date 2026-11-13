/**
 * Reels video baseline — reproducible metrics for before/after comparison.
 *
 * Usage:
 *   AUDIT_URL="https://feels-menu.vercel.app/?view=reels" node scripts/reels-video-baseline.mjs
 *   BASELINE_LABEL=pre OUT_PATH=docs/performance/baselines/pre.json node scripts/reels-video-baseline.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright";

const BASE = process.env.AUDIT_URL ?? "https://feels-menu.vercel.app/?view=reels";
const LABEL = process.env.BASELINE_LABEL ?? "run";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_PATH =
  process.env.OUT_PATH ??
  join(ROOT, "docs", "performance", "baselines", `${LABEL}-${isoDate()}.json`);

const profiles = [
  { id: "iphone-webkit", browser: "webkit", device: devices["iPhone 14 Pro"] },
  { id: "android-chromium", browser: "chromium", device: devices["Pixel 7"] },
];

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function mp4Stats(requests) {
  const mp4 = requests.filter((r) => /\.mp4(\?|#|$)/i.test(r.url));
  const byUrl = new Map();
  for (const r of mp4) {
    const key = r.url.split("#")[0];
    const bucket = byUrl.get(key) ?? { url: key, count: 0, statuses: [] };
    bucket.count += 1;
    if (r.status != null) bucket.statuses.push(r.status);
    byUrl.set(key, bucket);
  }
  return {
    requestCount: mp4.length,
    uniqueUrls: [...byUrl.values()],
  };
}

async function runProfile({ id, browser, device }) {
  const launcher = browser === "webkit" ? webkit : chromium;
  const browserInstance = await launcher.launch({ headless: true });
  const context = await browserInstance.newContext({
    ...device,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const requests = [];
  const videoErrors = [];

  page.on("response", (res) => {
    requests.push({
      url: res.url(),
      status: res.status(),
      resourceType: res.request().resourceType(),
    });
  });

  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(1200);

  const maxVideosDuringRun = { value: 0 };
  const sampleVideoCount = async () => {
    const n = await page.evaluate(
      () => document.querySelectorAll("video").length,
    );
    if (n > maxVideosDuringRun.value) maxVideosDuringRun.value = n;
    return n;
  };

  await sampleVideoCount();

  await page.locator(".discover__reels-scroller").waitFor({ timeout: 30_000 }).catch(() => {});

  const reelEvents = [];

  const scrollToProduct = async (productId) => {
    await page.evaluate((pid) => {
      const scroller = document.querySelector(".discover__reels-scroller");
      const el = document.querySelector(
        `.discover__slide[data-product-id="${pid}"]`,
      );
      if (!scroller || !el) return;
      scroller.scrollTo({ top: el.offsetTop, behavior: "auto" });
    }, productId);
    await page.waitForTimeout(900);
    await sampleVideoCount();

    const metrics = await page.evaluate((pid) => {
      const slide = document.querySelector(
        `.discover__slide[data-product-id="${pid}"]`,
      );
      const video = slide?.querySelector("video");
      return {
        productId: pid,
        videoCount: document.querySelectorAll("video").length,
        hasVideoEl: Boolean(video),
        videoPaused: video ? video.paused : null,
        videoReadyState: video ? video.readyState : null,
        videoError: video?.error
          ? { code: video.error.code, message: video.error.message }
          : null,
      };
    }, productId);

    return metrics;
  };

  for (const pid of ["espresso-duplo", "cappuccino", "espresso"]) {
    const metrics = await scrollToProduct(pid);
    const playing = await page.evaluate((productId) => {
      const slide = document.querySelector(
        `.discover__slide[data-product-id="${productId}"]`,
      );
      const video = slide?.querySelector("video");
      if (!video) {
        return { played: false, reason: "no-video-element", ms: null };
      }
      const start = performance.now();
      return new Promise((resolve) => {
        if (!video.paused && video.readyState >= 2) {
          resolve({
            played: true,
            ms: 0,
            readyState: video.readyState,
          });
          return;
        }
        const onPlaying = () => {
          resolve({
            played: true,
            ms: Math.round(performance.now() - start),
            readyState: video.readyState,
          });
        };
        video.addEventListener("playing", onPlaying, { once: true });
        setTimeout(() => {
          resolve({
            played: !video.paused,
            ms: Math.round(performance.now() - start),
            readyState: video.readyState,
            timedOut: !video.paused ? false : true,
          });
        }, 8000);
      });
    }, pid);

    reelEvents.push({
      ...metrics,
      focusToPlayingMs: playing.ms,
      playing: playing.played,
      playingDetail: playing,
    });

    if (metrics.videoError) {
      videoErrors.push({ productId: pid, ...metrics.videoError });
    }
  }

  const perfResources = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((e) => /\.mp4/i.test(e.name))
      .map((e) => ({
        name: e.name.split("#")[0],
        transferSize: e.transferSize,
        encodedBodySize: e.encodedBodySize,
        duration: Math.round(e.duration),
      })),
  );

  const totalMp4Transfer = perfResources.reduce(
    (s, e) => s + (e.transferSize || 0),
    0,
  );

  await browserInstance.close();

  return {
    profile: id,
    baseUrl: BASE,
    mp4: mp4Stats(requests),
    maxVideoElements: maxVideosDuringRun.value,
    reelEvents,
    videoErrors,
    performanceResourcesMp4: perfResources,
    totalMp4TransferSize: totalMp4Transfer,
    note: "transferSize may be 0 cross-origin; confirm on Safari device HAR",
  };
}

const report = {
  label: LABEL,
  auditedAt: new Date().toISOString(),
  baseUrl: BASE,
  profiles: [],
};

for (const p of profiles) {
  console.log(`Baseline ${LABEL}: ${p.id}...`);
  try {
    report.profiles.push(await runProfile(p));
  } catch (err) {
    report.profiles.push({ profile: p.id, fatal: String(err?.message ?? err) });
  }
}

await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${OUT_PATH}`);

const fatals = report.profiles.filter((x) => x.fatal).length;
process.exit(fatals > 0 ? 2 : 0);
