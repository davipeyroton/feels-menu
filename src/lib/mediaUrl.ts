/**
 * Optional CDN/R2 origin (VITE_MEDIA_ORIGIN). Relative /menu/ and /brand/ paths
 * are prefixed in production; absolute https URLs in menu-snapshot are used as-is.
 */
const MEDIA_ORIGIN = (
  import.meta.env.VITE_MEDIA_ORIGIN as string | undefined
)?.replace(/\/$/, "");

export function mediaOriginConfigured(): boolean {
  return MEDIA_ORIGIN.length > 0;
}

/** Resolve snapshot path or absolute URL for img/video/src/href. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) {
    return MEDIA_ORIGIN ? `${MEDIA_ORIGIN}${trimmed}` : trimmed;
  }
  return null;
}

function acceptPath(
  raw: string | null | undefined,
  allowedPrefix: "/menu/" | "/brand/",
): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    return resolveMediaUrl(trimmed);
  }
  if (!trimmed.startsWith(allowedPrefix)) return null;
  return resolveMediaUrl(trimmed);
}

export function resolveProductImage(url: string | null | undefined): string | null {
  return acceptPath(url, "/menu/");
}

export function resolveProductVideo(url: string | null | undefined): string | null {
  return acceptPath(url, "/menu/");
}

export function resolveBrandAsset(url: string | null | undefined): string | null {
  return acceptPath(url, "/brand/");
}
