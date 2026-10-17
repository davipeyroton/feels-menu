import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const LOCK_THRESHOLD_PX = 8;
const HORIZONTAL_LOCK_RATIO = 1.48;
const VERTICAL_SCROLL_LOCK_RATIO = 0.88;
const MIN_FLING_VELOCITY = 0.35;
const COMMIT_FRACTION = 0.22;
const HALF_PANEL_FRACTION = 0.48;

type Gesture = {
  x: number;
  y: number;
  t: number;
  locked: "x" | "y" | null;
  lastX: number;
  lastT: number;
  velocityX: number;
  preferVertical: boolean;
};

function isVerticalScrollSurface(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      ".discover__reels-scroller, .discover__feed, .discover__v-scroller",
    ),
  );
}

export type PagerCommitDirection = "next" | "prev";
export type PagerCommitResult = number | "handled" | undefined;

export type PagerCommitHandler = (
  at: number,
  direction: PagerCommitDirection,
) => PagerCommitResult;

export type PagerDragHandler = (dx: number, at: number) => number | undefined;

export function useHorizontalPager(
  panelCount: number,
  initialIndex = 0,
  enabled = true,
  onCommitRef?: RefObject<PagerCommitHandler | undefined>,
  onDragRef?: RefObject<PagerDragHandler | undefined>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);
  const indexRef = useRef(index);
  const gestureRef = useRef<Gesture | null>(null);
  const draggingRef = useRef(false);

  indexRef.current = index;
  draggingRef.current = dragging;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(panelCount - 1, next));
      if (indexRef.current === clamped) {
        setDragPx(0);
        return;
      }
      setAnimating(true);
      setDragging(false);
      draggingRef.current = false;
      setIndex(clamped);
      setDragPx(0);
      const root = containerRef.current;
      if (root) {
        root.style.setProperty("--motion-duration-pager", "0.46s");
      }
    },
    [panelCount],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const panelWidth = () => el.clientWidth || window.innerWidth;

    const setSnapDuration = (velocityX = 0) => {
      const speed = Math.min(1.5, Math.abs(velocityX));
      const seconds = Math.max(0.34, Math.min(0.52, 0.5 - speed * 0.11));
      el.style.setProperty("--motion-duration-pager", `${seconds.toFixed(3)}s`);
    };

    const rubberBand = (dx: number, atIndex: number) => {
      const custom = onDragRef?.current?.(dx, atIndex);
      if (custom !== undefined) return custom;
      let next = dx;
      if (atIndex === 0 && next > 0) next *= 0.32;
      if (atIndex === panelCount - 1 && next < 0) next *= 0.32;
      return next;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      gestureRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        t: event.timeStamp,
        locked: null,
        lastX: touch.clientX,
        lastT: event.timeStamp,
        velocityX: 0,
        preferVertical: isVerticalScrollSurface(event.target),
      };
      setAnimating(false);
    };

    const onTouchMove = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || event.touches.length !== 1) return;

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
        if (
          gesture.preferVertical &&
          absDy > LOCK_THRESHOLD_PX &&
          absDy >= absDx * VERTICAL_SCROLL_LOCK_RATIO
        ) {
          gesture.locked = "y";
        } else if (absDx > absDy * HORIZONTAL_LOCK_RATIO) {
          gesture.locked = "x";
        } else {
          gesture.locked = "y";
        }
        if (gesture.locked === "x") {
          setDragging(true);
          draggingRef.current = true;
        }
      }

      if (gesture.locked !== "x") return;

      const dt = Math.max(event.timeStamp - gesture.lastT, 1);
      gesture.velocityX = (touch.clientX - gesture.lastX) / dt;
      gesture.lastX = touch.clientX;
      gesture.lastT = event.timeStamp;

      event.preventDefault();
      setDragPx(rubberBand(dx, indexRef.current));
    };

    const applyCommit = (at: number, direction: PagerCommitDirection) => {
      const custom = onCommitRef?.current?.(at, direction);
      if (custom === "handled") return;
      const fallback =
        direction === "next"
          ? at < panelCount - 1
            ? at + 1
            : null
          : at > 0
            ? at - 1
            : null;
      const target = typeof custom === "number" ? custom : fallback;
      if (target !== null && target !== at) {
        setIndex(target);
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      setDragging(false);
      draggingRef.current = false;

      if (!gesture || gesture.locked !== "x") {
        setDragPx(0);
        return;
      }

      const touch = event.changedTouches[0];
      const dx = touch.clientX - gesture.x;
      const width = panelWidth();
      const commitPx = Math.max(52, width * COMMIT_FRACTION);
      const progress = -dx / width;

      setAnimating(true);
      setDragPx(0);

      const at = indexRef.current;
      const velocity = gesture.velocityX;
      setSnapDuration(velocity);
      const flingLeft = velocity < -MIN_FLING_VELOCITY;
      const flingRight = velocity > MIN_FLING_VELOCITY;

      const wantsNext =
        progress >= HALF_PANEL_FRACTION ||
        dx < -commitPx ||
        (flingLeft && dx < 0);
      const wantsPrev =
        progress <= -HALF_PANEL_FRACTION ||
        dx > commitPx ||
        (flingRight && dx > 0);

      if (wantsNext && !wantsPrev) {
        applyCommit(at, "next");
        return;
      }
      if (wantsPrev && !wantsNext) {
        applyCommit(at, "prev");
        return;
      }
      if (wantsNext && wantsPrev) {
        applyCommit(at, Math.abs(dx) >= commitPx ? (dx < 0 ? "next" : "prev") : "prev");
      }
    };

    const onTouchCancel = () => {
      gestureRef.current = null;
      setDragging(false);
      draggingRef.current = false;
      setAnimating(true);
      setDragPx(0);
    };

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
  }, [enabled, panelCount, onCommitRef, onDragRef]);

  return {
    containerRef,
    index,
    dragPx,
    dragging,
    animating,
    goTo,
    draggingRef,
  };
}
