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

/** Build `/?view=…` while preserving unrelated query keys (e.g. `from=hub`). */
export function menuLocationSearch(
  panel: number,
  current: URLSearchParams,
): string {
  const next = new URLSearchParams(current);
  const view = viewParamFromMenuPanel(panel);
  if (view) next.set("view", view);
  else next.delete("view");
  const serialized = next.toString();
  return serialized ? `?${serialized}` : "";
}
