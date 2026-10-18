import { DISMISS_EASE } from "./instagramMotion";

export const FEED_GRID_FLY_MS = 300;

export type ViewRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function domRectToViewRect(rect: DOMRectReadOnly): ViewRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function applyViewRect(el: HTMLElement, rect: ViewRect): void {
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

function flipTransform(from: ViewRect, to: ViewRect): string {
  const scaleX = from.width / Math.max(to.width, 1);
  const scaleY = from.height / Math.max(to.height, 1);
  const tx = from.left + from.width / 2 - (to.left + to.width / 2);
  const ty = from.top + from.height / 2 - (to.top + to.height / 2);
  return `translate3d(${tx}px, ${ty}px, 0) scale(${scaleX}, ${scaleY})`;
}

export function flyRectTransition(
  el: HTMLElement,
  from: ViewRect,
  to: ViewRect,
): Promise<void> {
  applyViewRect(el, to);
  el.style.transformOrigin = "center center";
  el.style.transition = "none";
  el.style.transform = flipTransform(from, to);

  const dist =
    Math.hypot(to.left - from.left, to.top - from.top) +
    Math.abs(to.width - from.width);
  if (dist < 0.5) {
    el.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `transform ${FEED_GRID_FLY_MS}ms ${DISMISS_EASE}`;
        el.style.transform = "translate3d(0, 0, 0) scale(1, 1)";

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          el.removeEventListener("transitionend", onEnd);
          resolve();
        };
        const onEnd = (event: TransitionEvent) => {
          if (event.target !== el || event.propertyName !== "transform") return;
          finish();
        };
        el.addEventListener("transitionend", onEnd);
        window.setTimeout(finish, FEED_GRID_FLY_MS + 100);
      });
    });
  });
}
