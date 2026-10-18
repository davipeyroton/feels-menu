import { useEffect, useRef } from "react";
import { hub } from "../data/menu";
import { markMediaWarm } from "../media/mediaWarm";

/** Single intro clip — mount `<video>` only while `active` (Safari/iOS memory). */
export default function HubIntroVideo({
  className,
  active,
}: {
  className: string;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!active) return;
    markMediaWarm(hub.video);
    markMediaWarm(hub.poster);
  }, [active]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active) return;

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

  if (!active) {
    return (
      <img
        className={className}
        src={hub.poster}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      src={hub.video}
      poster={hub.poster}
      muted
      loop
      playsInline
      preload="auto"
    />
  );
}
