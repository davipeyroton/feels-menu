import { useLayoutEffect, useRef, type CSSProperties } from "react";
import type { ProductSlide } from "../data/menu";
import {
  domRectToViewRect,
  flyRectTransition,
  type ViewRect,
} from "../motion/feedGridMediaFly";

function FlyMedia({ slide }: { slide: ProductSlide }) {
  if (slide.video) {
    return (
      <video
        src={slide.video}
        className="feed-media-fly__media"
        muted
        playsInline
        autoPlay
        loop
        aria-hidden
      />
    );
  }
  if (slide.image) {
    return (
      <img
        src={slide.image}
        className="feed-media-fly__media"
        alt=""
        aria-hidden
      />
    );
  }
  return <span className="feed-media-fly__placeholder" aria-hidden />;
}

export default function FeedMediaFlyOverlay({
  slide,
  from,
  to,
  onComplete,
}: {
  slide: ProductSlide;
  from: ViewRect;
  to: ViewRect;
  onComplete: () => void;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    doneRef.current = false;
    let cancelled = false;

    void flyRectTransition(el, from, to).then(() => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      onComplete();
    });

    return () => {
      cancelled = true;
    };
  }, [from, to, onComplete, slide.id]);

  return (
    <div
      ref={shellRef}
      className="feed-media-fly"
      style={viewRectStyle(from)}
      aria-hidden
    >
      <FlyMedia slide={slide} />
    </div>
  );
}

function viewRectStyle(rect: ViewRect): CSSProperties {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function readThumbRect(cell: HTMLElement): ViewRect {
  const thumb =
    cell.querySelector<HTMLElement>("img, video") ?? cell;
  return domRectToViewRect(thumb.getBoundingClientRect());
}

export function readPostMediaRect(scroller: HTMLElement, productId: string): ViewRect | null {
  const media = scroller.querySelector<HTMLElement>(
    `.feed-post[data-product-id="${productId}"] .feed-post__media`,
  );
  if (!media) return null;
  return domRectToViewRect(media.getBoundingClientRect());
}
