/** Main pager: 0 = hub, 1 = discover (reels + feed). */
export type MainPanelIndex = 0 | 1;

/** Inner discover track: 0 = reels, 1 = feed, 2 = profile. */
export type DiscoverModeIndex = 0 | 1 | 2;

export const DISCOVER_MODE_COUNT = 3;

export type ViewParam = "reels" | "feed" | "profile";

export function normalizeViewParam(view: string | null): ViewParam | null {
  if (view === "feed" || view === "reels" || view === "profile") return view;
  return null;
}

export function mainPanelFromViewParam(view: string | null): MainPanelIndex {
  if (view === "feed" || view === "reels") return 1;
  return 0;
}

export function discoverModeFromViewParam(view: string | null): DiscoverModeIndex {
  if (view === "feed") return 1;
  if (view === "profile") return 2;
  return 0;
}

export function viewParamFromDiscoverMode(mode: DiscoverModeIndex): ViewParam {
  if (mode === 1) return "feed";
  if (mode === 2) return "profile";
  return "reels";
}

export function readViewParamFromLocation(): "reels" | "feed" | null {
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
