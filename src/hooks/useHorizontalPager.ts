import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  PAGER_SNAP_EASE_OUT,
  pagerRubberBandFactor,
  pagerSnapDurationSeconds,
} from "../motion/instagramMotion";

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

export type PagerCommitDirection = "next" | "prev";
export type PagerCommitResult = number | "handled" | undefined;

export type PagerCommitHandler = (
  at: number,
  direction: PagerCommitDirection,
) => PagerCommitResult;

export type PagerDragHandler = (dx: number, at: number) => number | undefined;

export type PagerPreferVerticalHandler = (info: {
  target: EventTarget | null;
  dx: number;
  dy: number;
  panelIndex: number;
}) => boolean;

/** Return true to prevent programmatic panel changes (e.g. reels ↔ feed). */
export type PagerTransitionBlock = (from: number, to: number) => boolean;

function defaultPreferVertical(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      ".discover__reels-scroller, .discover__feed, .discover__v-scroller",
    ),
  );
}

export function useHorizontalPager(
  panelCount: number,
  initialIndex = 0,
  enabledRef?: RefObject<boolean>,
  onCommitRef?: RefObject<PagerCommitHandler | undefined>,
  onDragRef?: RefObject<PagerDragHandler | undefined>,
  preferVerticalRef?: RefObject<PagerPreferVerticalHandler | undefined>,
  blockTransitionRef?: RefObject<PagerTransitionBlock | undefined>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);
  const indexRef = useRef(index);
  const draggingRef = useRef(false);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  indexRef.current = index;
  draggingRef.current = dragging;

  const scheduleAnimatingEnd = useCallback(() => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    const root = containerRef.current;
    const raw = root?.style.getPropertyValue("--motion-duration-pager");
    const seconds = raw ? Number.parseFloat(raw) : pagerSnapDurationSeconds(0);
    const ms = Math.max(280, Math.min(560, seconds * 1000 + 120));
    snapTimerRef.current = setTimeout(() => {
      snapTimerRef.current = null;
      setAnimating(false);
    }, ms);
  }, []);

  const clearAnimatingEnd = useCallback(() => {
    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
  }, []);

  const isEnabled = () => enabledRef?.current !== false;

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
        root.style.setProperty(
          "--motion-duration-pager",
          `${pagerSnapDurationSeconds(0).toFixed(3)}s`,
        );
        root.style.setProperty("--motion-ease-pager", PAGER_SNAP_EASE_OUT);
      }
      scheduleAnimatingEnd();
    },
    [panelCount, scheduleAnimatingEnd],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const panelWidth = () => el.clientWidth || window.innerWidth;

    const setSnapDuration = (velocityX = 0) => {
      const seconds = pagerSnapDurationSeconds(velocityX);
      el.style.setProperty("--motion-duration-pager", `${seconds.toFixed(3)}s`);
      el.style.setProperty("--motion-ease-pager", PAGER_SNAP_EASE_OUT);
    };

    const rubberBand = (dx: number, atIndex: number) => {
      const custom = onDragRef?.current?.(dx, atIndex);
      if (custom !== undefined) return custom;
      const factor = pagerRubberBandFactor(dx, atIndex, panelCount);
      return dx * factor;
    };

    const clearDrag = () => {
      setDragging(false);
      draggingRef.current = false;
      setDragPx(0);
    };

    let activeGesture: Gesture | null = null;

    const onTouchStartFixed = (event: TouchEvent) => {
      if (!isEnabled() || event.touches.length !== 1) return;
      if (
        event.target instanceof Element &&
        event.target.closest(".discover__immersive")
      ) {
        return;
      }
      const touch = event.touches[0];
      const preferVertical =
        preferVerticalRef?.current?.({
          target: event.target,
          dx: 0,
          dy: 0,
          panelIndex: indexRef.current,
        }) ?? defaultPreferVertical(event.target);

      activeGesture = {
        x: touch.clientX,
        y: touch.clientY,
        t: event.timeStamp,
        locked: null,
        lastX: touch.clientX,
        lastT: event.timeStamp,
        velocityX: 0,
        preferVertical,
      };
      setAnimating(false);
    };

    const onTouchMove = (event: TouchEvent) => {
      const gesture = activeGesture;
      if (!gesture || !isEnabled() || event.touches.length !== 1) return;

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
        const at = indexRef.current;
        if (at === 1 && dx < -LOCK_THRESHOLD_PX && absDx > absDy * 0.85) {
          gesture.locked = "y";
          return;
        }
        const preferVerticalNow =
          preferVerticalRef?.current?.({
            target: event.target,
            dx,
            dy,
            panelIndex: indexRef.current,
          }) ?? gesture.preferVertical;

        if (
          preferVerticalNow &&
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
      const banded = rubberBand(dx, indexRef.current);
      setDragPx(banded);
      const width = panelWidth();
      if (width > 0) {
        el.style.setProperty(
          "--pager-drag-fraction",
          String(Math.max(-1, Math.min(1, banded / width))),
        );
      }
    };

    const applyCommit = (at: number, direction: PagerCommitDirection): boolean => {
      const custom = onCommitRef?.current?.(at, direction);
      if (custom === "handled") {
        setDragPx(0);
        return false;
      }
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
        if (blockTransitionRef?.current?.(at, target)) {
          setDragPx(0);
          return false;
        }
        goTo(target);
        return true;
      }
      setDragPx(0);
      return false;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const gesture = activeGesture;
      activeGesture = null;
      setDragging(false);
      draggingRef.current = false;

      if (!gesture || gesture.locked !== "x") {
        el.style.setProperty("--pager-drag-fraction", "0");
        setDragPx(0);
        return;
      }

      const touch = event.changedTouches[0];
      const dx = touch.clientX - gesture.x;
      const width = panelWidth();
      const commitPx = Math.max(52, width * COMMIT_FRACTION);
      const progress = -dx / width;

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

      const finishCommit = (direction: PagerCommitDirection) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const moved = applyCommit(at, direction);
            el.style.setProperty("--pager-drag-fraction", "0");
            if (!moved) {
              clearAnimatingEnd();
              setAnimating(false);
            }
          });
        });
      };

      if (wantsNext && !wantsPrev) {
        finishCommit("next");
        return;
      }
      if (wantsPrev && !wantsNext) {
        finishCommit("prev");
        return;
      }
      if (wantsNext && wantsPrev) {
        finishCommit(dx < 0 ? "next" : "prev");
        return;
      }

      el.style.setProperty("--pager-drag-fraction", "0");
      setDragPx(0);
    };

    const onTouchCancel = () => {
      activeGesture = null;
      setAnimating(true);
      el.style.setProperty("--pager-drag-fraction", "0");
      clearDrag();
    };

    el.addEventListener("touchstart", onTouchStartFixed, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });

    const track =
      el.querySelector<HTMLElement>(".menu-pager__track") ??
      el.querySelector<HTMLElement>(".discover-mode-track");
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== track || event.propertyName !== "transform") return;
      clearAnimatingEnd();
      setAnimating(false);
    };
    track?.addEventListener("transitionend", onTransitionEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStartFixed);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
      track?.removeEventListener("transitionend", onTransitionEnd);
      clearAnimatingEnd();
      activeGesture = null;
      clearDrag();
    };
  }, [
    panelCount,
    onCommitRef,
    onDragRef,
    preferVerticalRef,
    blockTransitionRef,
    enabledRef,
    goTo,
    scheduleAnimatingEnd,
    clearAnimatingEnd,
  ]);

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
