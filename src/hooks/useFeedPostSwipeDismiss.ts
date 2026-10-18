import { useEffect, useRef, useState, type RefObject } from "react";
import { domRectToViewRect, type ViewRect } from "../motion/feedGridMediaFly";

const LOCK_THRESHOLD_PX = 10;
const DISMISS_MIN_PX = 48;
const DISMISS_FRACTION = 0.14;
const MIN_FLING_VELOCITY = 0.35;

export type FeedPostSwipeMotion = {
  translateX: number;
  scale: number;
  dragging: boolean;
};

function scaleForDrag(dx: number): number {
  const w = window.innerWidth || 400;
  return Math.max(0.86, 1 - (dx / w) * 0.28);
}

export function useFeedPostSwipeDismiss(
  mediaRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onDismiss: (fromRect: ViewRect) => void,
) {
  const [motion, setMotion] = useState<FeedPostSwipeMotion>({
    translateX: 0,
    scale: 1,
    dragging: false,
  });
  const suppressClickRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !enabled) {
      setMotion({ translateX: 0, scale: 1, dragging: false });
      return;
    }

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let locked: "x" | null = null;
    let lastX = 0;
    let lastT = 0;
    let velocityX = 0;

    const reset = () => {
      setMotion({ translateX: 0, scale: 1, dragging: false });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (pointerId !== null || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      lastX = event.clientX;
      lastT = event.timeStamp;
      velocityX = 0;
      locked = null;
      el.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (locked === null) {
        if (
          Math.abs(dx) < LOCK_THRESHOLD_PX &&
          Math.abs(dy) < LOCK_THRESHOLD_PX
        ) {
          return;
        }
        if (dx > 0 && dx > Math.abs(dy) * 1.1) {
          locked = "x";
        } else {
          pointerId = null;
          locked = null;
          try {
            el.releasePointerCapture(event.pointerId);
          } catch {
            /* released */
          }
          return;
        }
      }

      if (locked !== "x" || dx <= 0) return;

      const dt = Math.max(event.timeStamp - lastT, 1);
      velocityX = (event.clientX - lastX) / dt;
      lastX = event.clientX;
      lastT = event.timeStamp;

      event.preventDefault();
      suppressClickRef.current = true;
      const x = dx * 0.96;
      setMotion({
        translateX: x,
        scale: scaleForDrag(x),
        dragging: true,
      });
    };

    const finishPointer = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* released */
      }

      const dx = event.clientX - startX;
      const limit = window.innerWidth || 400;
      const commitPx = Math.max(DISMISS_MIN_PX, limit * DISMISS_FRACTION);
      const fling = velocityX > MIN_FLING_VELOCITY;
      const shouldDismiss =
        dx >= commitPx || (fling && dx > LOCK_THRESHOLD_PX * 2);

      if (locked === "x" && shouldDismiss && mediaRef.current) {
        const rect = domRectToViewRect(mediaRef.current.getBoundingClientRect());
        onDismissRef.current(rect);
        setMotion({ translateX: 0, scale: 1, dragging: false });
      } else {
        if (locked === "x" && dx > LOCK_THRESHOLD_PX) {
          suppressClickRef.current = true;
        }
        reset();
      }

      pointerId = null;
      locked = null;
      velocityX = 0;
    };

    const onPointerUp = (event: PointerEvent) => finishPointer(event);
    const onPointerCancel = (event: PointerEvent) => finishPointer(event);

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [enabled, mediaRef]);

  const shouldSuppressClick = () => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  };

  return { motion, shouldSuppressClick };
}
