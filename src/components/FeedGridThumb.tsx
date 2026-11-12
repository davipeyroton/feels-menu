import { Video } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { ProductSlide } from "../data/menu";
import { useNearViewport } from "../hooks/useNearViewport";
import { feedGridThumbUrl } from "../lib/productReelPoster";
import {
  imageLoadingForUrl,
  isMediaWarm,
  warmProductMedia,
} from "../media/mediaWarm";
import ProductMediaPlaceholder from "./ProductMediaPlaceholder";

function FeedGridVideoBadge() {
  return (
    <span className="feed-grid__video-badge" aria-hidden>
      <Video size={12} strokeWidth={2.1} />
    </span>
  );
}

export default function FeedGridThumb({ slide }: { slide: ProductSlide }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const nearView = useNearViewport(hostRef);
  const thumbUrl = feedGridThumbUrl(slide);
  const mediaReady =
    nearView || isMediaWarm(thumbUrl) || isMediaWarm(slide.image);

  useEffect(() => {
    if (!nearView) return;
    warmProductMedia(slide);
  }, [nearView, slide]);

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

  if (thumbUrl) {
    return wrap(
      <img
        className="feed-grid__thumb"
        src={thumbUrl}
        alt=""
        loading={imageLoadingForUrl(thumbUrl, nearView)}
        decoding="async"
      />,
    );
  }

  return wrap(<ProductMediaPlaceholder />);
}
