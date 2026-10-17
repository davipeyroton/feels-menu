import { useEffect, useRef, useState, type RefObject } from "react";

const LOCK_THRESHOLD_PX = 10;
const DISMISS_MIN_PX = 56;
const DISMISS_FRACTION = 0.18;
const MIN_FLING = 0.28;

type Axis = "x" | "y" | null;

type Gesture = {
  x: number;
  y: number;
  locked: Axis;
  lastX: number;
  lastY: number;
  lastT: number;
  velocityX: number;
  velocityY: number;
};

export type ImmersiveDismissOffsets = {
  x: number;
  y: number;
  dragging: boolean;
  dismissing: boolean;
};

export function useImmersiveDismiss(
  rootRef: RefObject<HTMLElement | null>,
  open: boolean,
  canDismissDown: () => boolean,
  onDismiss: () => void,
) {
  const [offsets, setOffsets] = useState<ImmersiveDismissOffsets>({
    x: 0,
    y: 0,
    dragging: false,
    dismissing: false,
  });
  const onDismissRef = useRef(onDismiss);
  const canDismissDownRef = useRef(canDismissDown);
  onDismissRef.current = onDismiss;
  canDismissDownRef.current = canDismissDown;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !open) {
      setOffsets({ x: 0, y: 0, dragging: false, dismissing: false });
      return;
    }

    let gesture: Gesture | null = null;

    const reset = () => {
      gesture = null;
      setOffsets({ x: 0, y: 0, dragging: false, dismissing: false });
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      event.stopPropagation();
      const touch = event.touches[0];
      gesture = {
        x: touch.clientX,
        y: touch.clientY,
        locked: null,
        lastX: touch.clientX,
        lastY: touch.clientY,
        lastT: event.timeStamp,
        velocityX: 0,
        velocityY: 0,
      };
      setOffsets((prev) => ({ ...prev, dragging: false, dismissing: false }));
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!gesture || event.touches.length !== 1) return;
      event.stopPropagation();

      const touch = event.touches[0];
      const dx = touch.clientX - gesture.x;
      const dy = touch.clientY - gesture.y;

      if (gesture.locked === null) {
        if (
          Math.abs(dx) < LOCK_THRESHOLD_PX &&
          Math.abs(dy) < LOCK_THRESHOLD_PX
        ) {
          return;
        }
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (dx > 0 && absDx > absDy * 1.05) {
          gesture.locked = "x";
        } else if (dy > 0 && canDismissDownRef.current() && absDy > absDx * 1.05) {
          gesture.locked = "y";
        } else {
          gesture.locked = null;
          return;
        }
      }

      const dt = Math.max(event.timeStamp - gesture.lastT, 1);
      gesture.velocityX = (touch.clientX - gesture.lastX) / dt;
      gesture.velocityY = (touch.clientY - gesture.lastY) / dt;
      gesture.lastX = touch.clientX;
      gesture.lastY = touch.clientY;
      gesture.lastT = event.timeStamp;

      if (gesture.locked === "x") {
        if (dx < 0) {
          gesture.locked = null;
          setOffsets({ x: 0, y: 0, dragging: false, dismissing: false });
          return;
        }
        event.preventDefault();
        const x = dx * 0.92;
        setOffsets({
          x,
          y: 0,
          dragging: true,
          dismissing: false,
        });
        return;
      }

      if (gesture.locked === "y") {
        if (dy < 0 || !canDismissDownRef.current()) {
          gesture.locked = null;
          setOffsets({ x: 0, y: 0, dragging: false, dismissing: false });
          return;
        }
        event.preventDefault();
        const y = dy * 0.94;
        setOffsets({
          x: 0,
          y,
          dragging: true,
          dismissing: false,
        });
      }
    };

    const shouldDismiss = (
      axis: "x" | "y",
      delta: number,
      velocity: number,
      limit: number,
    ) => {
      const commitPx = Math.max(DISMISS_MIN_PX, limit * DISMISS_FRACTION);
      const fling =
        axis === "x"
          ? velocity > MIN_FLING
          : velocity > MIN_FLING;
      return delta >= commitPx || (fling && delta > LOCK_THRESHOLD_PX * 2);
    };

    const onTouchEnd = (event: TouchEvent) => {
      event.stopPropagation();
      const active = gesture;
      gesture = null;
      if (!active || !active.locked) {
        reset();
        return;
      }

      const touch = event.changedTouches[0];
      const dx = touch.clientX - active.x;
      const dy = touch.clientY - active.y;
      const width = el.clientWidth || window.innerWidth;
      const height = el.clientHeight || window.innerHeight;

      if (
        active.locked === "x" &&
        shouldDismiss("x", dx, active.velocityX, width)
      ) {
        setOffsets({ x: width, y: 0, dragging: false, dismissing: true });
        window.setTimeout(() => onDismissRef.current(), 220);
        return;
      }

      if (
        active.locked === "y" &&
        canDismissDownRef.current() &&
        shouldDismiss("y", dy, active.velocityY, height)
      ) {
        setOffsets({ x: 0, y: height, dragging: false, dismissing: true });
        window.setTimeout(() => onDismissRef.current(), 220);
        return;
      }

      reset();
    };

    const onTouchCancel = () => reset();

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [open, rootRef]);

  return offsets;
}
