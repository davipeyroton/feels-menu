const STORAGE_KEY = "feels-menu:warm-media";
const MAX_STORED_URLS = 64;
const MAX_VIDEO_PRIMERS = 4;

const warmUrls = new Set<string>(readStoredUrls());
const prefetchedImages = new Set<string>();
const videoPrimers = new Map<string, HTMLVideoElement>();

function readStoredUrls(): string[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function persistWarmUrls(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const list = [...warmUrls].slice(-MAX_STORED_URLS);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or private mode */
  }
}

export function markMediaWarm(url: string | null | undefined): void {
  if (!url) return;
  const key = stripMediaFragment(url);
  if (warmUrls.has(key)) return;
  warmUrls.add(key);
  persistWarmUrls();
}

export function isMediaWarm(url: string | null | undefined): boolean {
  if (!url) return false;
  return warmUrls.has(stripMediaFragment(url));
}

export function videoPreloadForUrl(
  url: string | null | undefined,
  wantFull: boolean,
): "auto" | "metadata" | "none" {
  if (!url) return "none";
  if (wantFull) return "auto";
  if (isMediaWarm(url)) return "metadata";
  return "none";
}

export function imageLoadingForUrl(
  url: string | null | undefined,
  inView: boolean,
): "eager" | "lazy" {
  if (!url) return "lazy";
  if (inView || isMediaWarm(url)) return "eager";
  return "lazy";
}

export function prefetchImage(url: string | null | undefined): void {
  if (!url || prefetchedImages.has(url)) return;
  prefetchedImages.add(url);
  markMediaWarm(url);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

export function prefetchVideoThumb(url: string | null | undefined): void {
  if (!url || typeof document === "undefined") return;
  const key = stripMediaFragment(url);
  if (videoPrimers.has(key)) return;
  markMediaWarm(key);

  while (videoPrimers.size >= MAX_VIDEO_PRIMERS) {
    const oldest = videoPrimers.keys().next().value as string | undefined;
    if (!oldest) break;
    const el = videoPrimers.get(oldest);
    el?.remove();
    videoPrimers.delete(oldest);
  }

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");
  video.style.cssText =
    "position:fixed;width:0;height:0;opacity:0;pointer-events:none";
  video.src = url.includes("#") ? url : `${url}#t=0.05`;
  document.body.appendChild(video);
  videoPrimers.set(key, video);
}

export function warmProductMedia(slide: {
  image: string | null;
  video: string | null;
}): void {
  if (slide.image) prefetchImage(slide.image);
  if (slide.video) prefetchVideoThumb(slide.video);
}

function stripMediaFragment(url: string): string {
  const hash = url.indexOf("#");
  return hash === -1 ? url : url.slice(0, hash);
}
