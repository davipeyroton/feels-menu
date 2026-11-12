import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { categoryLabel, type ProductSlide } from "../data/menu";
import { useFavorites } from "../favorites/FavoritesContext";
import { useFeedPostSwipeDismiss } from "../hooks/useFeedPostSwipeDismiss";
import { configureInlineVideo, INLINE_VIDEO_PROPS } from "../lib/inlineVideo";
import {
  imageLoadingForUrl,
  markMediaWarm,
  videoPreloadForUrl,
  warmProductMedia,
} from "../media/mediaWarm";
import type { ViewRect } from "../motion/feedGridMediaFly";
import { ptBR } from "../i18n/pt-BR";
import { CategoryEmoji } from "../openmoji/categoryEmoji";
import MenuPrice from "./MenuPrice";
import ProductMediaPlaceholder from "./ProductMediaPlaceholder";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="heart-icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? "0" : "1.5"}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function FeedPost({
  slide,
  mediaActive = false,
  mediaFlyHidden = false,
  closableFromGrid = false,
  onCloseFromGrid,
}: {
  slide: ProductSlide;
  mediaActive?: boolean;
  mediaFlyHidden?: boolean;
  closableFromGrid?: boolean;
  onCloseFromGrid?: (fromRect?: ViewRect) => void;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const interested = isFavorite(slide.id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<HTMLButtonElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const { motion: swipeMotion, shouldSuppressClick } = useFeedPostSwipeDismiss(
    mediaRef,
    closableFromGrid,
    (fromRect) => onCloseFromGrid?.(fromRect),
  );

  useEffect(() => {
    const node = articleRef.current;
    if (!node || !mediaActive) {
      setInView(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.45),
      { threshold: [0, 0.45, 0.7] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mediaActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !slide.video) return;
    configureInlineVideo(video);
    if (mediaActive && inView) {
      markMediaWarm(slide.video);
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [mediaActive, inView, slide.video]);

  useEffect(() => {
    if (!mediaActive || !inView) return;
    warmProductMedia(slide);
  }, [mediaActive, inView, slide]);

  const feedMediaContent = slide.video ? (
    <video
      ref={videoRef}
      className="discover__media--video"
      src={slide.video}
      poster={slide.image ?? undefined}
      loop
      preload={videoPreloadForUrl(slide.video, mediaActive && inView)}
      {...INLINE_VIDEO_PROPS}
    />
  ) : slide.image ? (
    <img
      src={slide.image}
      alt=""
      loading={imageLoadingForUrl(slide.image, mediaActive && inView)}
      decoding="async"
    />
  ) : (
    <ProductMediaPlaceholder />
  );

  const feedMediaClass = [
    "feed-post__media",
    !slide.image && !slide.video ? "feed-post__media--placeholder" : "",
  ];

  return (
    <article
      ref={articleRef}
      className={[
        "feed-post",
        closableFromGrid && swipeMotion.dragging ? "feed-post--grid-pull" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-product-id={slide.id}
      data-category={slide.category}
      style={
        closableFromGrid && swipeMotion.dragging
          ? ({
              "--feed-dismiss": Math.min(1, swipeMotion.translateX / 280),
            } as CSSProperties)
          : undefined
      }
    >
      <header className="feed-post__head">
        <span className="feed-post__cat">
          <CategoryEmoji
            categoryId={slide.category}
            size={18}
            className="discover__cat-emoji"
          />
          {categoryLabel(slide.category)}
        </span>
      </header>
      {closableFromGrid ? (
        <button
          ref={mediaRef}
          type="button"
          className={[
            ...feedMediaClass,
            "feed-post__media--closable",
            swipeMotion.dragging ? "feed-post__media--dragging" : "",
            mediaFlyHidden ? "feed-post__media--fly-hidden" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            transform: `translate3d(${swipeMotion.translateX}px, 0, 0) scale(${swipeMotion.scale})`,
          }}
          onClick={() => {
            if (shouldSuppressClick()) return;
            onCloseFromGrid?.();
          }}
          aria-label={ptBR.discover.closeFeedPostToGrid}
        >
          {feedMediaContent}
        </button>
      ) : (
        <div
          className={[
            ...feedMediaClass,
            mediaFlyHidden ? "feed-post__media--fly-hidden" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden
        >
          {feedMediaContent}
        </div>
      )}
      <div className="feed-post__body">
        <div className="feed-post__actions">
          <button
            type="button"
            className={`feed-post__heart ${interested ? "feed-post__heart--on" : ""}`}
            aria-pressed={interested}
            aria-label={ptBR.discover.markInterested}
            onClick={() => toggleFavorite(slide.id)}
          >
            <HeartIcon filled={interested} />
          </button>
          <MenuPrice label={slide.price} variant="feed" />
        </div>
        <div className="feed-post__details">
          <h3 className="feed-post__title">{slide.name}</h3>
          <p className="feed-post__caption">{slide.description}</p>
        </div>
      </div>
    </article>
  );
}
