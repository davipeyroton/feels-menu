type VideoDiagRecord = {
  seq: number;
  at: string;
  t: number;
  kind: string;
  data?: Record<string, unknown>;
};

type VideoDiagStore = {
  seq: number;
  records: VideoDiagRecord[];
};

declare global {
  interface Window {
    __feelsVideoDiagStore__?: VideoDiagStore;
  }
}

const DIAG_QUERY_KEY = "videoDiag";
const DIAG_STORAGE_KEY = "feels-menu:video-diag";
const LEGACY_QUERY_KEY = "legacyReelsPlayback";
const LEGACY_STORAGE_KEY = "feels-menu:legacy-reels-playback";
const MAX_RECORDS = 4000;

function readQueryFlag(name: string): boolean | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(name);
  if (raw == null) return null;
  const v = raw.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "on") return true;
  if (v === "0" || v === "false" || v === "off") return false;
  return null;
}

function readStorageFlag(name: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(name);
    return raw === "1" || raw === "true" || raw === "on";
  } catch {
    return false;
  }
}

export function isVideoDiagEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  const query = readQueryFlag(DIAG_QUERY_KEY);
  if (query != null) return query;
  return readStorageFlag(DIAG_STORAGE_KEY);
}

export function isLegacyReelsPlaybackEnabled(): boolean {
  const query = readQueryFlag(LEGACY_QUERY_KEY);
  if (query != null) return query;
  return readStorageFlag(LEGACY_STORAGE_KEY);
}

function getStore(): VideoDiagStore {
  if (typeof window === "undefined") {
    return { seq: 0, records: [] };
  }
  if (!window.__feelsVideoDiagStore__) {
    window.__feelsVideoDiagStore__ = { seq: 0, records: [] };
  }
  return window.__feelsVideoDiagStore__;
}

export function sanitizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.href);
    parsed.search = "";
    parsed.hash = "";
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

export function videoDiagEvent(
  kind: string,
  data?: Record<string, unknown>,
): void {
  if (!isVideoDiagEnabled()) return;
  const store = getStore();
  const next: VideoDiagRecord = {
    seq: ++store.seq,
    at: new Date().toISOString(),
    t:
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now(),
    kind,
    data,
  };
  store.records.push(next);
  if (store.records.length > MAX_RECORDS) {
    store.records.splice(0, store.records.length - MAX_RECORDS);
  }
  if (typeof console !== "undefined") {
    console.debug("[video-diag]", next.kind, next.data ?? {});
  }
}

export function readVideoDiagRecords(): VideoDiagRecord[] {
  return [...getStore().records];
}

export function clearVideoDiagRecords(): void {
  const store = getStore();
  store.records.length = 0;
}
