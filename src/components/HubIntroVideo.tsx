import { useEffect, useRef, useState } from "react";
import { hub } from "../data/menu";
import { configureInlineVideo, INLINE_VIDEO_PROPS } from "../lib/inlineVideo";
import { markMediaWarm } from "../media/mediaWarm";

/**
 * Poster stays mounted; video layers on top while playing.
 * `showLayer` keeps the last frame visible during hub → discover (no poster flash).
 */
export default function HubIntroVideo({
  className,
  play,
  showLayer = true,
}: {
  className: string;
  /** Decode + play hub intro clip. */
  play: boolean;
  /** Keep the video layer visible (paused) while the menu pager leaves the hub. */
  showLayer?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasFrames, setHasFrames] = useState(false);

  useEffect(() => {
    markMediaWarm(hub.video);
    markMediaWarm(hub.poster);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onFrames = () => setHasFrames(true);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      onFrames();
    } else {
      video.addEventListener("loadeddata", onFrames, { once: true });
    }

    return () => video.removeEventListener("loadeddata", onFrames);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!play) {
      video.pause();
      return;
    }

    configureInlineVideo(video);

    const playWhenReady = () => {
      void video.play().catch(() => {});
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      playWhenReady();
      return;
    }

    video.addEventListener("canplay", playWhenReady, { once: true });
    return () => video.removeEventListener("canplay", playWhenReady);
  }, [play]);

  const layerVisible = showLayer && (play || hasFrames);

  return (
    <span className="hub__media-stack" aria-hidden>
      <img
        className={[className, "hub__media-stack__poster"].join(" ")}
        src={hub.poster}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      <video
        ref={videoRef}
        className={[className, "hub__video-layer"].join(" ")}
        src={hub.video}
        poster={hub.poster}
        loop
        preload={play ? "auto" : "none"}
        data-active={layerVisible ? "true" : "false"}
        data-hold={showLayer && !play && hasFrames ? "true" : "false"}
        {...INLINE_VIDEO_PROPS}
      />
    </span>
  );
}
