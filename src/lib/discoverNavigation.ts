import { hub } from "../data/menu";
import {
  PAGER_SNAP_EASE_OUT,
  pagerSnapDurationSeconds,
} from "../motion/instagramMotion";
import {
  pauseVideosWithin,
  releaseVideoPrimersExcept,
  warmProductMedia,
} from "../media/mediaWarm";

/** Snap the discover mode track; use instant when entering discover from the hub. */
export function applyModePagerSnap(
  modeViewport: HTMLElement | null | undefined,
  instant = false,
): void {
  if (!modeViewport) return;
  modeViewport.style.setProperty(
    "--motion-duration-pager",
    instant ? "0.001s" : `${pagerSnapDurationSeconds(0).toFixed(3)}s`,
  );
  modeViewport.style.setProperty("--motion-ease-pager", PAGER_SNAP_EASE_OUT);
}

/** Pause decoders under discover (reels + feed), not the hub panel. */
export function pauseDiscoverMedia(
  menuPagerRoot: HTMLElement | null | undefined,
): void {
  if (!menuPagerRoot) return;
  const shell = menuPagerRoot.querySelector(".discover-shell");
  pauseVideosWithin(shell);
}

/** Run before animating back to the welcome hub (Safari/iOS). */
export function prepareReturnToHub(
  menuPagerRoot: HTMLElement | null | undefined,
): void {
  pauseDiscoverMedia(menuPagerRoot);
  releaseVideoPrimersExcept(hub.video);
}

/** Decode-first poster + video primer before hub → reels (reduces black flash). */
export function primeDiscoverReelsEntry(slide: {
  image: string | null;
  video: string | null;
}): void {
  warmProductMedia(slide);
  if (slide.image) {
    const img = new Image();
    img.decoding = "async";
    if ("fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority =
        "high";
    }
    img.src = slide.image;
  }
  releaseVideoPrimersExcept(slide.video);
}

/** Free hub decoders and warm first reel before hub → cardápio navigation. */
export function prepareOpenDiscoverReels(
  menuPagerRoot: HTMLElement | null | undefined,
  firstSlide?: { image: string | null; video: string | null },
): void {
  if (menuPagerRoot) {
    pauseVideosWithin(menuPagerRoot.querySelector(".hub"));
  }
  if (firstSlide) {
    primeDiscoverReelsEntry(firstSlide);
    return;
  }
  releaseVideoPrimersExcept(null);
}
