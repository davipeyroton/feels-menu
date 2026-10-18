const STORAGE_KEY_SESSION = "feels-menu:warm-media";
const STORAGE_KEY_LOCAL = "feels-menu:warm-media:v1";
const MAX_STORED_URLS = 96;
const MAX_VIDEO_PRIMERS = 3;

const warmUrls = new Set<string>(readStoredUrls());
const prefetchedImages = new Set<string>();
const videoPrimers = new Map<string, HTMLVideoElement>();

function readJsonUrls(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function readStoredUrls(): string[] {
  const merged: string[] = [];
  if (typeof sessionStorage !== "undefined") {
    merged.push(...readJsonUrls(sessionStorage.getItem(STORAGE_KEY_SESSION)));
  }
  if (typeof localStorage !== "undefined") {
    merged.push(...readJsonUrls(localStorage.getItem(STORAGE_KEY_LOCAL)));
  }
  return [...new Set(merged)].slice(-MAX_STORED_URLS);
}

function persistWarmUrls(): void {
  const list = [...warmUrls].slice(-MAX_STORED_URLS);
  const payload = JSON.stringify(list);
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY_SESSION, payload);
    }
  } catch {
    /* quota or private mode */
  }
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_LOCAL, payload);
    }
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

export function warmHubIntroMedia(videoUrl: string, posterUrl: string): void {
  prefetchImage(posterUrl);
  markMediaWarm(videoUrl);
  markMediaWarm(posterUrl);
  prefetchVideoThumb(videoUrl);
}

/** Pause decoders before hub transition (Safari/iOS). */
export function pauseVideosWithin(
  root: ParentNode | null | undefined,
  selector = "video",
): void {
  if (!root) return;
  root.querySelectorAll<HTMLVideoElement>(selector).forEach((video) => {
    video.pause();
    try {
      if (video.currentTime > 0) video.currentTime = 0;
    } catch {
      /* ignore */
    }
  });
}

export function releaseVideoPrimersExcept(keepUrl?: string | null): void {
  const keep = keepUrl ? stripMediaFragment(keepUrl) : null;
  for (const [key, el] of [...videoPrimers.entries()]) {
    if (keep && key === keep) continue;
    el.pause();
    el.removeAttribute("src");
    el.load();
    el.remove();
    videoPrimers.delete(key);
  }
}

function stripMediaFragment(url: string): string {
  const hash = url.indexOf("#");
  return hash === -1 ? url : url.slice(0, hash);
}
