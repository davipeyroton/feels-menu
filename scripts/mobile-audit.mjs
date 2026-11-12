/**
 * Mobile Safari (WebKit) + Chrome (Chromium) audit: console, failed HTTP, timings.
 * Writes scripts/mobile-audit-report.json (HAR-like).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright";

const BASE = process.env.AUDIT_URL ?? "http://127.0.0.1:5173/";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "mobile-audit-report.json");
const HAR_DIR = join(ROOT, "mobile-audit-har");

const profiles = [
  { id: "iphone-safari", browser: "webkit", device: devices["iPhone 14 Pro"] },
  { id: "iphone-chrome", browser: "chromium", device: devices["iPhone 14 Pro"] },
  { id: "android-chrome", browser: "chromium", device: devices["Pixel 7"] },
];

async function runProfile({ id, browser, device }) {
  const launcher = browser === "webkit" ? webkit : chromium;
  const browserInstance = await launcher.launch({ headless: true });
  const context = await browserInstance.newContext({
    ...device,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const consoleEntries = [];
  const requests = [];
  const failed = [];

  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      consoleEntries.push({
        type,
        text: msg.text(),
        location: msg.location(),
      });
    }
  });

  page.on("pageerror", (err) => {
    consoleEntries.push({
      type: "pageerror",
      text: String(err?.message ?? err),
      stack: err?.stack,
    });
  });

  page.on("request", (req) => {
    requests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      started: Date.now(),
    });
  });

  const isBenignAbort = (url, err) => {
    if (err !== "net::ERR_ABORTED") return false;
    return /\.(mp4|webm|m4v)(\?|#|$)/i.test(url);
  };

  page.on("requestfailed", (req) => {
    const err = req.failure()?.errorText ?? "unknown";
    if (isBenignAbort(req.url(), err)) return;
    failed.push({
      url: req.url(),
      method: req.method(),
      failure: err,
    });
  });

  page.on("response", async (res) => {
    const url = res.url();
    const status = res.status();
    if (status >= 400) {
      failed.push({
        url,
        method: res.request().method(),
        status,
        statusText: res.statusText(),
      });
    }
    const entry = requests.find((r) => r.url === url && !r.status);
    if (entry) {
      entry.status = status;
      entry.durationMs = Date.now() - entry.started;
    }
  });

  const started = Date.now();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Hub → explore (if button exists)
  const explore = page.getByRole("button", { name: /explorar|cardápio|menu/i }).first();
  if (await explore.isVisible().catch(() => false)) {
    await explore.click();
    await page.waitForTimeout(800);
  }

  // Tab bar: feed
  const feedTab = page.locator(".discover-tab-bar button").nth(2);
  if (await feedTab.isVisible().catch(() => false)) {
    await feedTab.click();
    await page.waitForTimeout(700);
  }

  // Tab bar: reels
  const reelsTab = page.locator(".discover-tab-bar button").nth(1);
  if (await reelsTab.isVisible().catch(() => false)) {
    await reelsTab.click();
    await page.waitForTimeout(700);
  }

  // Tab bar: profile
  const profileTab = page.locator(".discover-tab-bar button").nth(3);
  if (await profileTab.isVisible().catch(() => false)) {
    await profileTab.click();
    await page.waitForTimeout(700);
  }

  // Tab bar: home
  const homeTab = page.locator(".discover-tab-bar button").nth(0);
  if (await homeTab.isVisible().catch(() => false)) {
    await homeTab.click();
    await page.waitForTimeout(700);
  }

  await page.evaluate(() => {
    const scroller = document.querySelector(".discover__reels-scroller");
  if (scroller) scroller.scrollBy({ top: window.innerHeight * 0.9, behavior: "auto" });
  }).catch(() => {});
  await page.waitForTimeout(900);

  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    return nav
      ? {
          domContentLoaded: nav.domContentLoadedEventEnd,
          load: nav.loadEventEnd,
          transferSize: nav.transferSize,
          decodedBodySize: nav.decodedBodySize,
        }
      : null;
  });

  await browserInstance.close();

  const slow = requests
    .filter((r) => r.durationMs && r.durationMs > 1500 && r.resourceType !== "websocket")
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 15);

  const harLike = {
    log: {
      version: "1.2",
      creator: { name: "feels-menu-mobile-audit", version: "1" },
      pages: [{ startedDateTime: new Date(started).toISOString(), id, title: id }],
      entries: requests.map((r) => ({
        startedDateTime: new Date(r.started).toISOString(),
        request: { method: r.method, url: r.url },
        response: { status: r.status ?? 0 },
        time: r.durationMs ?? 0,
        _resourceType: r.resourceType,
      })),
    },
  };

  return {
    profile: id,
    elapsedMs: Date.now() - started,
    performance: perf,
    consoleErrors: consoleEntries.filter((e) => e.type === "error" || e.type === "pageerror"),
    consoleWarnings: consoleEntries.filter((e) => e.type === "warning"),
    failedRequests: failed,
    slowRequests: slow,
    requestCount: requests.length,
    harLike,
  };
}

const report = { baseUrl: BASE, auditedAt: new Date().toISOString(), profiles: [] };
for (const p of profiles) {
  console.log(`Auditing ${p.id}...`);
  try {
    report.profiles.push(await runProfile(p));
  } catch (err) {
    report.profiles.push({
      profile: p.id,
      fatal: String(err?.message ?? err),
    });
  }
}

await mkdir(HAR_DIR, { recursive: true });
await writeFile(OUT, JSON.stringify(report, null, 2));
for (const p of report.profiles) {
  if (p.harLike) {
    await writeFile(join(HAR_DIR, `${p.profile}.har.json`), JSON.stringify(p.harLike, null, 2));
  }
}
console.log(`Wrote ${OUT} and HAR snapshots in ${HAR_DIR}`);
const errors = report.profiles.flatMap((p) => p.consoleErrors ?? []);
const failed = report.profiles.flatMap((p) => p.failedRequests ?? []);
const fatals = report.profiles.filter((p) => p.fatal).length;
console.log(
  `Fatals: ${fatals}, console errors: ${errors.length}, failed HTTP: ${failed.length}`,
);
process.exit(fatals + errors.length + failed.length > 0 ? 2 : 0);
