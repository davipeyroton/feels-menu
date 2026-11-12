import {
  PAGER_SNAP_EASE_OUT,
  pagerSnapDurationSeconds,
} from "../motion/instagramMotion";
import {
  markMediaWarm,
  pauseVideosWithin,
  prefetchImage,
  prefetchVideoThumb,
  releaseVideoPrimersExcept,
  suspendVideoDecoders,
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
  pauseVideosWithin(shell, "video", { rewind: true });
}

/** Run before animating back to the welcome hub (Safari/iOS). */
export function prepareReturnToHub(
  menuPagerRoot: HTMLElement | null | undefined,
): void {
  pauseDiscoverMedia(menuPagerRoot);
  suspendVideoDecoders(menuPagerRoot?.querySelector(".hub"));
}

/** Image decode before navigation — no hidden video until hub releases the decoder. */
export function primeDiscoverReelsEntry(slide: {
  image: string | null;
  video: string | null;
}): void {
  if (slide.image) {
    prefetchImage(slide.image);
    const img = new Image();
    img.decoding = "async";
    if ("fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority =
        "high";
    }
    img.src = slide.image;
  }
  markMediaWarm(slide.image);
  if (slide.video) {
    markMediaWarm(slide.video);
    prefetchVideoThumb(slide.video);
  }
}

/** Free hub decoder budget and warm first reel before hub → cardápio (Safari/iOS). */
export function prepareOpenDiscoverReels(
  menuPagerRoot: HTMLElement | null | undefined,
  firstSlide?: { image: string | null; video: string | null },
): void {
  pauseVideosWithin(menuPagerRoot?.querySelector(".hub"), "video", {
    rewind: false,
  });
  releaseVideoPrimersExcept(null);
  if (firstSlide) {
    primeDiscoverReelsEntry(firstSlide);
  }
}
