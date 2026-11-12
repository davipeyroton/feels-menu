import type { ProductSlide } from "../data/menu";

/** Snapshot path for a frame poster derived from `/menu/foo.mp4`. */
export function defaultVideoPosterPath(
  videoPath: string | null | undefined,
): string | null {
  if (videoPath == null) return null;
  const trimmed = videoPath.trim();
  if (!trimmed || !/\.mp4$/i.test(trimmed)) return null;
  return trimmed.replace(/\.mp4$/i, "-video-poster.jpg");
}

/** Reel / timeline cover when a product has video (not the illustrative grid image). */
export function productReelPoster(
  slide: Pick<ProductSlide, "video" | "videoPoster" | "image">,
): string | null {
  if (slide.video) {
    return (
      slide.videoPoster ??
      defaultVideoPosterPath(slide.video) ??
      slide.image
    );
  }
  return slide.image;
}

/** Feed / profile grid thumb — video frame for MP4 items, product photo otherwise. */
export function feedGridThumbUrl(
  slide: Pick<ProductSlide, "video" | "videoPoster" | "image">,
): string | null {
  if (slide.video) return productReelPoster(slide);
  return slide.image;
}
