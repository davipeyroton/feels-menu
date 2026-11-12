import { Video } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { ProductSlide } from "../data/menu";
import { useNearViewport } from "../hooks/useNearViewport";
import {
  imageLoadingForUrl,
  isMediaWarm,
  videoPreloadForUrl,
  warmProductMedia,
} from "../media/mediaWarm";
import { configureInlineVideo, INLINE_VIDEO_PROPS } from "../lib/inlineVideo";
import ProductMediaPlaceholder from "./ProductMediaPlaceholder";

function primeVideoThumb(video: HTMLVideoElement) {
  const pause = () => {
    video.pause();
  };
  const seekToFirstFrame = () => {
    try {
      if (video.currentTime < 0.05) {
        video.currentTime = 0.05;
      }
    } catch {
      pause();
    }
  };
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    seekToFirstFrame();
    pause();
    return;
  }
  video.addEventListener("loadeddata", seekToFirstFrame, { once: true });
  video.addEventListener("seeked", pause, { once: true });
}

function FeedGridVideoBadge() {
  return (
    <span className="feed-grid__video-badge" aria-hidden>
      <Video size={12} strokeWidth={2.1} />
    </span>
  );
}

export default function FeedGridThumb({ slide }: { slide: ProductSlide }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nearView = useNearViewport(hostRef);
  const mediaReady =
    nearView || isMediaWarm(slide.video ?? slide.image);

  useEffect(() => {
    if (!nearView) return;
    warmProductMedia(slide);
  }, [nearView, slide]);

  useEffect(() => {
    if (!mediaReady || !slide.video) return;
    const video = videoRef.current;
    if (!video) return;
    configureInlineVideo(video);
    primeVideoThumb(video);
  }, [mediaReady, slide.video]);

  const showVideoBadge = Boolean(slide.video && mediaReady);

  const wrap = (content: ReactNode) => (
    <div ref={hostRef} className="feed-grid__thumb-host">
      {content}
      {showVideoBadge ? <FeedGridVideoBadge /> : null}
    </div>
  );

  if (!mediaReady) {
    return wrap(<ProductMediaPlaceholder />);
  }

  if (slide.video) {
    const thumbSrc = slide.video.includes("#")
      ? slide.video
      : `${slide.video}#t=0.05`;
    return wrap(
      <video
        ref={videoRef}
        className="feed-grid__video-thumb"
        src={thumbSrc}
        poster={slide.image ?? undefined}
        preload={videoPreloadForUrl(slide.video, nearView)}
        {...INLINE_VIDEO_PROPS}
        aria-hidden
        onLoadedData={(event) => primeVideoThumb(event.currentTarget)}
      />,
    );
  }

  if (slide.image) {
    return wrap(
      <img
        src={slide.image}
        alt=""
        loading={imageLoadingForUrl(slide.image, nearView)}
        decoding="async"
      />,
    );
  }

  return wrap(<ProductMediaPlaceholder />);
}
