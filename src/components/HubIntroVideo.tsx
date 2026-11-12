import { useEffect, useRef, useState } from "react";
import { hub } from "../data/menu";
import { configureInlineVideo, INLINE_VIDEO_PROPS } from "../lib/inlineVideo";
import { markMediaWarm, teardownVideoElement } from "../media/mediaWarm";

/**
 * Hub hero — poster always visible; `<video>` mounts only while on the hub panel.
 */
export default function HubIntroVideo({
  className,
  play,
  mountVideo = true,
}: {
  className: string;
  /** Decode + play hub intro clip (only when `mountVideo`). */
  play: boolean;
  /** Unmount decoder when leaving home (Safari/iOS). */
  mountVideo?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasFrames, setHasFrames] = useState(false);

  useEffect(() => {
    markMediaWarm(hub.video);
    markMediaWarm(hub.poster);
  }, []);

  useEffect(() => {
    if (!mountVideo) {
      setHasFrames(false);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    const onFrames = () => setHasFrames(true);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      onFrames();
    } else {
      video.addEventListener("loadeddata", onFrames, { once: true });
    }

    return () => video.removeEventListener("loadeddata", onFrames);
  }, [mountVideo]);

  useEffect(() => {
    if (!mountVideo) return;
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
  }, [mountVideo, play]);

  useEffect(() => {
    if (mountVideo) return;
    const video = videoRef.current;
    if (video) teardownVideoElement(video);
  }, [mountVideo]);

  const showVideoLayer = mountVideo && (play || hasFrames);

  return (
    <span className="hub__media-stack" aria-hidden>
      <img
        className={[className, "hub__media-stack__poster"].join(" ")}
        src={hub.poster}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      {mountVideo ? (
        <video
          ref={videoRef}
          className={[className, "hub__video-layer"].join(" ")}
          src={hub.video}
          poster={hub.poster}
          loop
          preload={play ? "metadata" : "none"}
          data-active={showVideoLayer ? "true" : "false"}
          {...INLINE_VIDEO_PROPS}
        />
      ) : null}
    </span>
  );
}
