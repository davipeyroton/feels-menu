/** Motion tokens tuned toward Instagram native feel (springy snap, short flings). */

export const PAGER_SNAP_EASE = "cubic-bezier(0.32, 1.12, 0.58, 1)";
export const PAGER_SNAP_EASE_OUT = "cubic-bezier(0.22, 1.18, 0.42, 1)";
export const DISMISS_EASE = "cubic-bezier(0.33, 1.02, 0.52, 1)";

export function pagerSnapDurationSeconds(velocityX = 0): number {
  const speed = Math.min(1.8, Math.abs(velocityX));
  return Math.max(0.26, Math.min(0.44, 0.42 - speed * 0.09));
}

/** Rubber-band resistance at hard edges (0 = full lock, 1 = no drag). */
export function pagerRubberBandFactor(
  dx: number,
  atIndex: number,
  panelCount: number,
): number {
  if (atIndex === 0 && dx > 0) return 0.28;
  if (atIndex === panelCount - 1 && dx < 0) return 0.28;
  return 1;
}

export function panelDepthStyle(
  panelIndex: number,
  fractionalIndex: number,
): { transform: string } {
  const dist = Math.min(1, Math.abs(panelIndex - fractionalIndex));
  const scale = 1 - dist * 0.038;
  return {
    transform: `scale(${scale.toFixed(4)})`,
  };
}

/** Horizontal discover track: N panes × 100% viewport each. */
export function discoverModeTrackTransform(
  modeIndex: number,
  dragPx: number,
  panelCount = 3,
): string {
  const step = 100 / panelCount;
  return `translate3d(calc(${-modeIndex * step}% + ${dragPx}px), 0, 0)`;
}

export function discoverModeFractionalIndex(
  modeIndex: number,
  dragPx: number,
  trackWidth: number,
  dragging: boolean,
  panelCount = 3,
): number {
  if (trackWidth > 0 && dragging) {
    const max = panelCount - 1;
    return Math.max(0, Math.min(max, modeIndex - dragPx / trackWidth));
  }
  return modeIndex;
}

