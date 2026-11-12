/** Inline playback + PiP / AirPlay off (Safari, iOS, Android WebView). */
export function configureInlineVideo(video: HTMLVideoElement): void {
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("x-webkit-airplay", "deny");
  video.disablePictureInPicture = true;
  if ("disableRemotePlayback" in video) {
    video.disableRemotePlayback = true;
  }
}

export const INLINE_VIDEO_PROPS = {
  playsInline: true,
  muted: true,
  disablePictureInPicture: true,
} as const;
