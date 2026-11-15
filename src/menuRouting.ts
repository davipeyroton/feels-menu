/** Main pager: 0 = hub, 1 = discover (reels + profile). */
export type MainPanelIndex = 0 | 1;

/** Inner discover track: 0 = reels, 1 = profile. */
export type DiscoverModeIndex = 0 | 1;

export const DISCOVER_MODE_COUNT = 2;

export type ViewParam = "reels" | "profile";

export function normalizeViewParam(view: string | null): ViewParam | null {
  if (view === "reels" || view === "profile") return view;
  if (view === "feed") return "reels";
  return null;
}

export function mainPanelFromViewParam(view: string | null): MainPanelIndex {
  const normalized = view === "feed" ? "reels" : view;
  if (normalized === "reels" || normalized === "profile") return 1;
  return 0;
}

export function discoverModeFromViewParam(view: string | null): DiscoverModeIndex {
  const normalized = view === "feed" ? "reels" : view;
  if (normalized === "profile") return 1;
  return 0;
}

export function viewParamFromDiscoverMode(mode: DiscoverModeIndex): ViewParam {
  if (mode === 1) return "profile";
  return "reels";
}

export function readViewParamFromLocation(): ViewParam | null {
  return normalizeViewParam(new URLSearchParams(window.location.search).get("view"));
}

/** Serialized query (no leading `?`). */
export function menuSearchForState(
  mainPanel: number,
  discoverMode: DiscoverModeIndex,
  base = new URLSearchParams(window.location.search),
): string {
  const next = new URLSearchParams(base);
  if (mainPanel === 0) {
    next.delete("view");
    next.delete("from");
  } else {
    next.set("view", viewParamFromDiscoverMode(discoverMode));
  }
  return next.toString();
}

/** @deprecated Use mainPanelFromViewParam — kept for popstate helpers. */
export function menuPanelFromViewParam(view: string | null): MainPanelIndex {
  return mainPanelFromViewParam(view);
}
