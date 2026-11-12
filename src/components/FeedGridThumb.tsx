import { useEffect, useRef } from "react";
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
    if (!mediaReady || slide.image || !slide.video) return;
    const video = videoRef.current;
    if (!video) return;
    configureInlineVideo(video);
    primeVideoThumb(video);
  }, [mediaReady, slide.image, slide.video]);

  if (!mediaReady) {
    return (
      <div ref={hostRef} className="feed-grid__thumb-host">
        <ProductMediaPlaceholder />
      </div>
    );
  }

  if (slide.image) {
    return (
      <div ref={hostRef} className="feed-grid__thumb-host">
        <img
          src={slide.image}
          alt=""
          loading={imageLoadingForUrl(slide.image, nearView)}
          decoding="async"
        />
      </div>
    );
  }

  if (!slide.video) {
    return (
      <div ref={hostRef} className="feed-grid__thumb-host">
        <ProductMediaPlaceholder />
      </div>
    );
  }

  const thumbSrc = slide.video.includes("#")
    ? slide.video
    : `${slide.video}#t=0.05`;
  return (
    <div ref={hostRef} className="feed-grid__thumb-host">
      <video
        ref={videoRef}
        className="feed-grid__video-thumb"
        src={thumbSrc}
        preload={videoPreloadForUrl(slide.video, nearView)}
        {...INLINE_VIDEO_PROPS}
        aria-hidden
        onLoadedData={(event) => primeVideoThumb(event.currentTarget)}
      />
    </div>
  );
}
