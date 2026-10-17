/** Panel index for the horizontal hub → reels → feed pager. */
export type MenuPanelIndex = 0 | 1 | 2;

export function menuPanelFromViewParam(view: string | null): MenuPanelIndex {
  if (view === "feed") return 2;
  if (view === "reels") return 1;
  return 0;
}

export function viewParamFromMenuPanel(panel: number): "reels" | "feed" | null {
  if (panel === 2) return "feed";
  if (panel === 1) return "reels";
  return null;
}

export function normalizeViewParam(view: string | null): "reels" | "feed" | null {
  if (view === "feed" || view === "reels") return view;
  return null;
}

export function readViewParamFromLocation(): "reels" | "feed" | null {
  return normalizeViewParam(new URLSearchParams(window.location.search).get("view"));
}

/** Serialized query (no leading `?`), preserving unrelated keys. */
export function menuSearchForPanel(
  panel: number,
  base = new URLSearchParams(window.location.search),
): string {
  const next = new URLSearchParams(base);
  const view = viewParamFromMenuPanel(panel);
  if (view) next.set("view", view);
  else next.delete("view");
  return next.toString();
}