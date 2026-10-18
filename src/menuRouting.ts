/** Main pager: 0 = hub, 1 = discover (reels + feed). */
export type MainPanelIndex = 0 | 1;

/** Inner discover track: 0 = reels, 1 = feed. */
export type DiscoverModeIndex = 0 | 1;

export function normalizeViewParam(view: string | null): "reels" | "feed" | null {
  if (view === "feed" || view === "reels") return view;
  return null;
}

export function mainPanelFromViewParam(view: string | null): MainPanelIndex {
  if (view === "feed" || view === "reels") return 1;
  return 0;
}

export function discoverModeFromViewParam(view: string | null): DiscoverModeIndex {
  return view === "feed" ? 1 : 0;
}

export function viewParamFromDiscoverMode(mode: DiscoverModeIndex): "reels" | "feed" {
  return mode === 1 ? "feed" : "reels";
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
