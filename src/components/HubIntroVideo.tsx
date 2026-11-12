import { useEffect, useRef } from "react";
import { hub } from "../data/menu";
import { configureInlineVideo, INLINE_VIDEO_PROPS } from "../lib/inlineVideo";
import { markMediaWarm } from "../media/mediaWarm";

/**
 * Poster stays mounted; video layers on top while active.
 * Avoids video ↔ img swap flashes when leaving the hub (Safari/iOS).
 */
export default function HubIntroVideo({
  className,
  active,
}: {
  className: string;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    markMediaWarm(hub.video);
    markMediaWarm(hub.poster);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!active) {
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
  }, [active]);

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
        preload={active ? "auto" : "none"}
        data-active={active ? "true" : "false"}
        {...INLINE_VIDEO_PROPS}
      />
    </span>
  );
}
