let coarsePointer: boolean | null = null;
let iosLike: boolean | null = null;

function isCoarsePointer(): boolean {
  if (coarsePointer === null) {
    coarsePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
  }
  return coarsePointer;
}

function isIosLike(): boolean {
  if (iosLike === null && typeof navigator !== "undefined") {
    const ua = navigator.userAgent;
    iosLike =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  return iosLike === true;
}

/** Avoid `smooth` scroll on touch browsers (Safari snap / jank). */
export function scrollBehaviorForDevice(): ScrollBehavior {
  return isCoarsePointer() || isIosLike() ? "auto" : "smooth";
}
