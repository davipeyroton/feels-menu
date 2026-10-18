import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

function decode(s) {
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

const discoverUrl = "https://francisco.sipfloweb.com/discover?from=hub";
const hubUrl = "https://francisco.sipfloweb.com/";

const [discoverHtml, hubHtml] = await Promise.all([
  fetch(discoverUrl).then((r) => r.text()),
  fetch(hubUrl).then((r) => r.text()),
]);

const routesScript = hubHtml.match(
  /href="(\/assets\/routes-[^"]+\.js)"/,
)?.[1];
let hubWifi = null;
if (routesScript) {
  const routesJs = await fetch(`${hubUrl.replace(/\/$/, "")}${routesScript}`).then(
    (r) => r.text(),
  );
  const wifiBlock = routesJs.match(/wifi:\{ssid:`([^`]+)`,password:`([^`]+)`\}/);
  if (wifiBlock) {
    hubWifi = { ssid: wifiBlock[1], password: wifiBlock[2] };
  }
}

const categoryTabs = [];
for (const m of discoverHtml.matchAll(
  /<button data-cat="([^"]+)"[^>]*>([^<]+)<\/button>/g,
)) {
  categoryTabs.push({ id: m[1], label: decode(m[2].trim()) });
}

const slides = [];
const parts = discoverHtml.split('<div data-slide="true"');
for (const part of parts.slice(1)) {
  const block = `<div data-slide="true"${part}`;
  const index = Number(block.match(/data-slide-index="(\d+)"/)?.[1]);
  if (block.includes('data-welcome="true"')) {
    slides.push({ kind: "welcome", index });
    continue;
  }
  const productId = block.match(/data-product-id="([^"]+)"/)?.[1];
  if (!productId) continue;
  const category = block.match(/data-category="([^"]+)"/)?.[1] ?? null;
  const name = decode(
    block.match(/<h2[^>]*>([^<]+)<\/h2>/)?.[1]?.trim() ?? productId,
  );
  const description = decode(
    block.match(/<p class="mt-3[^"]*">([^<]+)<\/p>/)?.[1]?.trim() ?? "",
  );
  const price = block.match(/>([0-9]+,[0-9]+ €)<\/span>/)?.[1] ?? null;
  const imagePath = block.match(/<img src="([^"]+)" alt="/)?.[1] ?? null;
  const videoPath =
    block.match(/<video[^>]+src="([^"]+)"/)?.[1] ?? null;
  slides.push({
    kind: "product",
    index,
    id: productId,
    category,
    name,
    description,
    price,
    image: imagePath ? asset(imagePath) : null,
    video: videoPath ? asset(videoPath) : null,
  });
}

function asset(path) {
  return path?.startsWith("http")
    ? path
    : `https://francisco.sipfloweb.com${path}`;
}

const out = {
  source: hubUrl,
  discover_source: discoverUrl,
  observed_at: new Date().toISOString(),
  stack_notes: {
    router: "TanStack Router",
    hosting: "sipfloweb.com / Lovable __l5e assets",
    fonts: "Instrument Serif + Inter (Google Fonts)",
  },
  hub: {
    location: "São Paulo",
    tagline: "Aqui tem café especial",
    video: asset(hubHtml.match(/<video[^>]+src="([^"]+)"/)?.[1]),
    poster: asset(hubHtml.match(/poster="([^"]+)"/)?.[1]),
    wordmark: asset(
      hubHtml.match(
        /src="(\/__l5e\/assets-v1\/[^"]+francisco-wordmark\.png)"/,
      )?.[1],
    ),
    google_review_url: hubHtml.match(
      /href="(https:\/\/search\.google\.com\/local\/writereview[^"]+)"/,
    )?.[1],
    wifi: hubWifi,
  },
  categories: categoryTabs,
  slides,
};

mkdirSync(join(root, "../data"), { recursive: true });
writeFileSync(
  join(root, "../data/menu-snapshot.json"),
  `${JSON.stringify(out, null, 2)}\n`,
);

const productCount = slides.filter((s) => s.kind === "product").length;
console.log(`Saved ${categoryTabs.length} tabs, ${productCount} products`);
