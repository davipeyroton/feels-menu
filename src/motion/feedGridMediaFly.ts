import { DISMISS_EASE } from "./instagramMotion";

export const FEED_GRID_FLY_MS = 380;

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

export function flyRectTransition(
  el: HTMLElement,
  from: ViewRect,
  to: ViewRect,
): Promise<void> {
  applyViewRect(el, from);
  el.style.transition = "none";

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = [
          `left ${FEED_GRID_FLY_MS}ms ${DISMISS_EASE}`,
          `top ${FEED_GRID_FLY_MS}ms ${DISMISS_EASE}`,
          `width ${FEED_GRID_FLY_MS}ms ${DISMISS_EASE}`,
          `height ${FEED_GRID_FLY_MS}ms ${DISMISS_EASE}`,
        ].join(", ");
        applyViewRect(el, to);

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          el.removeEventListener("transitionend", onEnd);
          resolve();
        };
        const onEnd = (event: TransitionEvent) => {
          if (event.target !== el || event.propertyName !== "width") return;
          finish();
        };
        el.addEventListener("transitionend", onEnd);
        window.setTimeout(finish, FEED_GRID_FLY_MS + 80);
      });
    });
  });
}
