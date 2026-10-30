import { useNavigate, useSearchParams } from "react-router-dom";
import HubPanel from "../panels/HubPanel";
import {
  type PagerCommitHandler,
  type PagerDragHandler,
  type PagerPreferVerticalHandler,
  useHorizontalPager,
} from "../hooks/useHorizontalPager";
import {
  discoverModeFractionalIndex,
  discoverModeTrackTransform,
  panelDepthStyle,
} from "../motion/instagramMotion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { useFeedPostSwipeDismiss } from "../hooks/useFeedPostSwipeDismiss";
import { useNearViewport } from "../hooks/useNearViewport";
import {
  pauseDiscoverMedia,
  prepareReturnToHub,
} from "../lib/discoverNavigation";
import {
  imageLoadingForUrl,
  isMediaWarm,
  markMediaWarm,
  pauseVideosWithin,
  videoPreloadForUrl,
  warmHubIntroMedia,
  warmProductMedia,
} from "../media/mediaWarm";
import {
  allProducts,
  categories,
  categoryLabel,
  hub,
  type ProductSlide,
} from "../data/menu";
import { ptBR } from "../i18n/pt-BR";
import { CategoryEmoji } from "../openmoji/categoryEmoji";
import HubIntroVideo from "../components/HubIntroVideo";
import ProductMediaPlaceholder from "../components/ProductMediaPlaceholder";
import ThemeToggle from "../components/ThemeToggle";
import FeedMediaFlyOverlay, {
  readPostMediaRect,
  readThumbRect,
} from "../components/FeedMediaFlyOverlay";
import type { ViewRect } from "../motion/feedGridMediaFly";
import {
  discoverModeFromViewParam,
  mainPanelFromViewParam,
  menuSearchForState,
  normalizeViewParam,
  readViewParamFromLocation,
  type DiscoverModeIndex,
  type MainPanelIndex,
} from "../menuRouting";

type DiscoverToolbarView = "reels" | "grid";

function ReelsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CategoryDropdown({
  categories: items,
  value,
  label,
  onChange,
}: {
  categories: { id: string; label: string }[];
  value: string;
  label: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = items.find((item) => item.id === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`discover__cat-dropdown${open ? " discover__cat-dropdown--open" : ""}`}
    >
      <button
        type="button"
        className="discover__cat-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="discover__cat-dropdown-value">
          {current && (
            <CategoryEmoji
              categoryId={current.id}
              size={20}
              className="discover__cat-emoji"
            />
          )}
          <span className="discover__cat-dropdown-label">
            {current?.label ?? label}
          </span>
        </span>
        <span className="discover__cat-dropdown-chevron" aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <ul
        className="discover__cat-dropdown-menu"
        role="listbox"
        aria-label={label}
        hidden={!open}
      >
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <li key={item.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={`discover__cat-dropdown-option${selected ? " discover__cat-dropdown-option--on" : ""}`}
                onClick={() => pick(item.id)}
              >
                <CategoryEmoji
                  categoryId={item.id}
                  size={22}
                  className="discover__cat-emoji"
                />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProductMedia({
  slide,
  className,
  playVideo = false,
  warm = false,
}: {
  slide: ProductSlide;
  className: string;
  playVideo?: boolean;
  /** Keep decode buffer after first view (panel switch feed ↔ reels). */
  warm?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [buffered, setBuffered] = useState(false);

  useEffect(() => {
    if (warm || playVideo) {
      setBuffered(true);
      markMediaWarm(slide.video);
      markMediaWarm(slide.image);
    }
  }, [warm, playVideo, slide.video, slide.image]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !slide.video) return;
    if (playVideo) {
      void video.play().catch(() => {});
      return;
    }
    video.pause();
    try {
      if (video.currentTime > 0) video.currentTime = 0;
    } catch {
      /* ignore */
    }
  }, [playVideo, slide.video]);

  if (slide.video) {
    const preload = videoPreloadForUrl(
      slide.video,
      playVideo || (buffered && warm),
    );
    return (
      <video
        ref={videoRef}
        className={className}
        src={slide.video}
        muted
        loop
        playsInline
        preload={preload}
        aria-hidden
      />
    );
  }
  if (slide.image) {
    return (
      <img
        className={className}
        src={slide.image}
        alt=""
        loading={imageLoadingForUrl(slide.image, playVideo || warm)}
        decoding="async"
      />
    );
  }
  return <ProductMediaPlaceholder className={className} />;
}

function ProductReel({
  slide,
  reelIndex,
  allSlides,
  playbackActive = false,
  cacheMedia = false,
}: {
  slide: ProductSlide;
  reelIndex: number;
  allSlides: ProductSlide[];
  /** Play when slide is in view and reels panel is focused. */
  playbackActive?: boolean;
  /** Keep slide buffers after leaving reels (feed ↔ reels swipe). */
  cacheMedia?: boolean;
}) {
  const [interested, setInterested] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [everInView, setEverInView] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.55),
      { threshold: [0, 0.55, 0.85] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) setEverInView(true);
  }, [inView]);

  useEffect(() => {
    if (!inView) return;
    warmProductMedia(slide);
    const prev = allSlides[reelIndex - 1];
    const next = allSlides[reelIndex + 1];
    if (prev) warmProductMedia(prev);
    if (next) warmProductMedia(next);
  }, [allSlides, inView, reelIndex, slide]);

  const shouldPlay = playbackActive && inView;
  const shouldWarm = cacheMedia && (everInView || shouldPlay);

  return (
    <section
      ref={sectionRef}
      className="discover__slide"
      data-product-id={slide.id}
      data-category={slide.category}
    >
      <div className="discover__media-wrap" aria-hidden>
        <ProductMedia
          slide={slide}
          className="discover__media discover__media--product"
          playVideo={shouldPlay}
          warm={shouldWarm}
        />
      </div>
      <div className="discover__top-fade" />
      <div className="discover__bottom-fade" />
      <div className="discover__slide-inner">
        <div className="discover__copy">
          <h2 className="discover__title">{slide.name}</h2>
          <p className="discover__desc">{slide.description}</p>
          <div className="discover__row">
            {slide.price && (
              <span className="discover__price">{slide.price}</span>
            )}
            <button
              type="button"
              className={`discover__heart ${interested ? "discover__heart--on" : ""}`}
              aria-pressed={interested}
              aria-label={ptBR.discover.markInterested}
              onClick={() => setInterested((v) => !v)}
            >
              <HeartIcon filled={interested} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const DiscoverToolbar = forwardRef<
  HTMLDivElement,
  {
    toolbarView: DiscoverToolbarView;
    activeCat: string;
    onReels: () => void;
    onFeedGrid: () => void;
    onCategory: (catId: string) => void;
    onClose?: () => void;
    className?: string;
  }
>(function DiscoverToolbar(
  {
    toolbarView,
    activeCat,
    onReels,
    onFeedGrid,
    onCategory,
    onClose,
    className,
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={["discover__toolbar", className].filter(Boolean).join(" ")}
    >
      <div
        className="discover__view-switch"
        role="group"
        aria-label={ptBR.discover.viewMode}
      >
        <button
          type="button"
          className={`discover__view-btn ${toolbarView === "reels" ? "discover__view-btn--on" : ""}`}
          aria-pressed={toolbarView === "reels"}
          aria-label={ptBR.discover.viewReels}
          onClick={onReels}
        >
          <ReelsIcon />
        </button>
        <button
          type="button"
          id="feed-layout-grid"
          className={`discover__view-btn ${toolbarView === "grid" ? "discover__view-btn--on" : ""}`}
          aria-pressed={toolbarView === "grid"}
          aria-label={ptBR.discover.feedLayoutGrid}
          aria-controls="feed-surface-grid feed-surface-timeline"
          onClick={onFeedGrid}
        >
          <FeedIcon />
        </button>
      </div>
      <CategoryDropdown
        categories={categories}
        value={activeCat}
        label={ptBR.discover.categories}
        onChange={onCategory}
      />
      {onClose && (
        <button
          type="button"
          className="discover__toolbar-close"
          aria-label={ptBR.discover.closeImmersiveFromFeed}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
});

function ReelsChrome({
  chromeRef,
  toolbarRef,
  feedChrome,
  modeFraction,
  showDiscoverToolbar,
  toolbarView,
  activeCat,
  onHub,
  onReels,
  onFeedGrid,
  onCategory,
  onCloseImmersive,
  extraClassName,
}: {
  chromeRef?: RefObject<HTMLDivElement | null>;
  toolbarRef?: RefObject<HTMLDivElement | null>;
  feedChrome: boolean;
  modeFraction: number;
  showDiscoverToolbar: boolean;
  toolbarView: DiscoverToolbarView;
  activeCat: string;
  onHub: () => void;
  onReels: () => void;
  onFeedGrid: () => void;
  onCategory: (catId: string) => void;
  onCloseImmersive?: () => void;
  extraClassName?: string;
}) {
  return (
    <div
      ref={chromeRef}
      className={[
        "discover--pager-chrome",
        "discover--pager-chrome--discover",
        feedChrome
          ? "discover--pager-chrome--feed"
          : "discover--pager-chrome--reels",
        extraClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--mode-fraction": modeFraction } as CSSProperties}
    >
      <div className="discover-chrome-fade discover-chrome-fade--reels" aria-hidden />
      <div className="discover-chrome-fade discover-chrome-fade--feed" aria-hidden />
      <header className="discover__header discover__header--pager">
        <div className="discover__header-row">
          <div className="discover__header-brand">
            <button type="button" className="discover__brand-link" onClick={onHub}>
              {ptBR.discover.brandName}
            </button>
          </div>
          {feedChrome && <ThemeToggle />}
        </div>
        {showDiscoverToolbar && (
          <DiscoverToolbar
            ref={toolbarRef}
            className="discover__toolbar--chrome"
            toolbarView={toolbarView}
            activeCat={activeCat}
            onReels={onReels}
            onFeedGrid={onFeedGrid}
            onCategory={onCategory}
            onClose={onCloseImmersive}
          />
        )}
      </header>
    </div>
  );
}

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

function FeedGridThumb({ slide }: { slide: ProductSlide }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nearView = useNearViewport(hostRef);
  const mediaReady =
    nearView ||
    isMediaWarm(slide.video ?? slide.image);

  useEffect(() => {
    if (!nearView) return;
    warmProductMedia(slide);
  }, [nearView, slide]);

  useEffect(() => {
    if (!mediaReady || slide.image || !slide.video) return;
    const video = videoRef.current;
    if (!video) return;
    primeVideoThumb(video);
  }, [mediaReady, slide.image, slide.video]);

  if (!mediaReady) {
    return (
      <div ref={hostRef} className="feed-grid__thumb-host">
        <ProductMediaPlaceholder className="feed-grid__placeholder" />
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

  if (slide.video) {
    const thumbSrc = slide.video.includes("#")
      ? slide.video
      : `${slide.video}#t=0.05`;
    return (
      <div ref={hostRef} className="feed-grid__thumb-host">
        <video
          ref={videoRef}
          className="feed-grid__video-thumb"
          src={thumbSrc}
          muted
          playsInline
          preload={videoPreloadForUrl(slide.video, nearView)}
          aria-hidden
          onLoadedData={(event) => primeVideoThumb(event.currentTarget)}
        />
      </div>
    );
  }

  return (
    <div ref={hostRef} className="feed-grid__thumb-host">
      <ProductMediaPlaceholder className="feed-grid__placeholder" />
    </div>
  );
}

function FeedProfileGrid({
  slides,
  onSelect,
  flyTargetProductId,
}: {
  slides: ProductSlide[];
  onSelect: (slide: ProductSlide, cell: HTMLElement) => void;
  flyTargetProductId: string | null;
}) {
  return (
    <section className="feed-grid" aria-label={ptBR.discover.profileGrid}>
      {slides.map((slide) => (
        <button
          key={slide.id}
          type="button"
          className={[
            "feed-grid__cell",
            flyTargetProductId === slide.id ? "feed-grid__cell--fly-target" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-product-id={slide.id}
          data-category={slide.category}
          onClick={(event) => onSelect(slide, event.currentTarget)}
          aria-label={ptBR.discover.viewProduct(slide.name)}
        >
          <FeedGridThumb slide={slide} />
          <div className="feed-grid__caption">
            <span className="feed-grid__title">{slide.name}</span>
            {slide.price && (
              <span className="feed-grid__price">{slide.price}</span>
            )}
          </div>
        </button>
      ))}
    </section>
  );
}

function FeedPost({
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
  const [interested, setInterested] = useState(false);
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
      src={slide.video}
      muted
      loop
      playsInline
      preload={videoPreloadForUrl(slide.video, mediaActive && inView)}
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
            onClick={() => setInterested((v) => !v)}
          >
            <HeartIcon filled={interested} />
          </button>
          {slide.price && (
            <span className="feed-post__metric">{slide.price}</span>
          )}
        </div>
        <div className="feed-post__details">
          <h3 className="feed-post__title">{slide.name}</h3>
          <p className="feed-post__caption">{slide.description}</p>
        </div>
      </div>
    </article>
  );
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewParam = normalizeViewParam(searchParams.get("view"));

  useEffect(() => {
    document.title = ptBR.meta.title;
  }, []);

  useEffect(() => {
    warmHubIntroMedia(hub.video, hub.poster);
  }, []);

  const reelsRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const feedToolbarRef = useRef<HTMLDivElement>(null);
  const pagerChromeRef = useRef<HTMLDivElement>(null);
  const [pagerChromeHeight, setPagerChromeHeight] = useState(0);
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "quente");
  const [progress, setProgress] = useState(0);
  const [feedSurface, setFeedSurface] = useState<"grid" | "timeline">("grid");
  const [feedTimelineEver, setFeedTimelineEver] = useState(false);
  const [feedScrollToId, setFeedScrollToId] = useState<string | null>(null);
  const [feedGridDismissActive, setFeedGridDismissActive] = useState(false);
  const [flyHiddenProductId, setFlyHiddenProductId] = useState<string | null>(
    null,
  );
  const [flyTargetProductId, setFlyTargetProductId] = useState<string | null>(
    null,
  );
  const [mediaFly, setMediaFly] = useState<{
    slide: ProductSlide;
    from: ViewRect;
    to: ViewRect;
  } | null>(null);
  const initialChromePanel =
    mainPanelFromViewParam(viewParam) === 0
      ? 0
      : discoverModeFromViewParam(viewParam) === 1
        ? 2
        : 1;
  const [chromePanel, setChromePanel] = useState(initialChromePanel);
  const initialDiscoverMode = discoverModeFromViewParam(viewParam);
  const [modeChromeVisual, setModeChromeVisual] =
    useState<DiscoverModeIndex>(initialDiscoverMode);
  const [pagerWidth, setPagerWidth] = useState(0);
  const [modePagerWidth, setModePagerWidth] = useState(0);
  const pendingGridOpenRef = useRef<{
    product: ProductSlide;
    fromRect: ViewRect;
  } | null>(null);
  const flyBusyRef = useRef(false);
  const prevMenuIndexRef = useRef(0);
  const menuIndexRef = useRef(0);
  const feedSurfaceRef = useRef(feedSurface);
  feedSurfaceRef.current = feedSurface;
  const reelsFromHubScrollDoneRef = useRef(false);
  const menuTransitionFromRef = useRef<number | null>(null);
  const hasVisitedReelsRef = useRef(mainPanelFromViewParam(viewParam) === 1);
  const onMenuPagerCommitRef = useRef<PagerCommitHandler | undefined>(undefined);
  const onMenuPagerDragRef = useRef<PagerDragHandler | undefined>(undefined);
  const onPagerPreferVerticalRef = useRef<PagerPreferVerticalHandler | undefined>(
    undefined,
  );
  const onModePagerCommitRef = useRef<PagerCommitHandler | undefined>(undefined);
  const onModePagerDragRef = useRef<PagerDragHandler | undefined>(undefined);
  const onModePagerPreferVerticalRef = useRef<PagerPreferVerticalHandler | undefined>(
    undefined,
  );
  const mainGoToRef = useRef<(index: number) => void>(() => {});
  const menuPagerEnabledRef = useRef(true);
  const modePagerEnabledRef = useRef(false);
  const productSlides = useMemo(() => allProducts, []);

  const clearFeedGridFly = useCallback(() => {
    pendingGridOpenRef.current = null;
    flyBusyRef.current = false;
    setMediaFly(null);
    setFlyHiddenProductId(null);
    setFlyTargetProductId(null);
  }, []);

  const openFeedTimeline = useCallback(
    (product: ProductSlide, originCell?: HTMLElement) => {
      setFeedTimelineEver(true);
      setActiveCat(product.category);
      setFeedScrollToId(product.id);
      if (originCell) {
        setFeedGridDismissActive(true);
        pendingGridOpenRef.current = {
          product,
          fromRect: readThumbRect(originCell),
        };
      } else {
        setFeedGridDismissActive(false);
        pendingGridOpenRef.current = null;
      }
      setFeedSurface("timeline");
    },
    [],
  );

  const completeMediaFly = useCallback(() => {
    flyBusyRef.current = false;
    setMediaFly(null);
    setFlyHiddenProductId(null);
    setFlyTargetProductId(null);
  }, []);

  const closeExpandedFeedPost = useCallback(
    (productId: string, fromRectOverride?: ViewRect) => {
      if (flyBusyRef.current || mediaFly || !feedGridDismissActive) return;
      const slide = productSlides.find((p) => p.id === productId);
      const scroller = feedRef.current;
      if (!slide || !scroller) return;

      const fromRect =
        fromRectOverride ?? readPostMediaRect(scroller, productId);
      if (!fromRect) {
        setFeedGridDismissActive(false);
        setFeedSurface("grid");
        feedRef.current?.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      flyBusyRef.current = true;
      setFlyHiddenProductId(productId);
      setFlyTargetProductId(productId);
      setFeedGridDismissActive(false);

      flushSync(() => {
        setFeedSurface("grid");
      });

      const cell = scroller.querySelector<HTMLElement>(
        `.feed-grid__cell[data-product-id="${productId}"]`,
      );
      cell?.scrollIntoView({ block: "center", behavior: "auto" });
      void cell?.offsetHeight;

      const toRect = cell ? readThumbRect(cell) : fromRect;

      flushSync(() => {
        setMediaFly({ slide, from: fromRect, to: toRect });
      });
    },
    [completeMediaFly, feedGridDismissActive, mediaFly, productSlides],
  );

  onMenuPagerCommitRef.current = (at, direction) => {
    if (at === 1) return "handled";
    return undefined;
  };

  onMenuPagerDragRef.current = () => undefined;

  onPagerPreferVerticalRef.current = ({ target }) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(".discover-shell__viewport"));
  };

  const menuPager = useHorizontalPager(
    2,
    mainPanelFromViewParam(viewParam),
    menuPagerEnabledRef,
    onMenuPagerCommitRef,
    onMenuPagerDragRef,
    onPagerPreferVerticalRef,
  );
  const menuIndex = menuPager.index;
  menuIndexRef.current = menuIndex;
  mainGoToRef.current = menuPager.goTo;
  menuPagerEnabledRef.current = menuIndex !== 1;

  // Reels ↔ feed only via discover__view-switch (no horizontal swipe).
  modePagerEnabledRef.current = false;

  const modePager = useHorizontalPager(
    2,
    discoverModeFromViewParam(viewParam),
    modePagerEnabledRef,
    onModePagerCommitRef,
    onModePagerDragRef,
    onModePagerPreferVerticalRef,
  );
  const discoverModeIndex = modePager.index as DiscoverModeIndex;

  useLayoutEffect(() => {
    if (menuPager.animating) {
      if (menuTransitionFromRef.current === null) {
        menuTransitionFromRef.current = prevMenuIndexRef.current;
      }
      return;
    }
    menuTransitionFromRef.current = null;
  }, [menuPager.animating, menuIndex]);

  const hubIntroLeaving =
    menuPager.animating && menuTransitionFromRef.current === 0;
  const hubIntroVideoActive = menuIndex === 0 || hubIntroLeaving;

  const discoverReelsReady =
    menuIndex === 1 &&
    (!menuPager.animating || menuTransitionFromRef.current !== 0);
  const reelsModeReady =
    discoverModeIndex === 0 &&
    !modePager.animating &&
    !modePager.dragging;
  const reelsPlaybackActive = discoverReelsReady && reelsModeReady;

  onModePagerCommitRef.current = (at, direction) => {
    const surface = feedSurfaceRef.current;

    if (at === 0 && direction === "next") return "handled";
    if (at === 1 && direction === "prev" && surface === "grid") return "handled";

    if (at === 1 && direction === "next") {
      if (surface === "grid") {
        const first = productSlides[0];
        if (first) openFeedTimeline(first);
        else setFeedSurface("timeline");
        return "handled";
      }
      return "handled";
    }

    if (at === 1 && direction === "prev") {
      if (surface === "timeline") {
        setFeedSurface("grid");
        feedRef.current?.scrollTo({ top: 0, behavior: "auto" });
        return "handled";
      }
      return undefined;
    }

    return undefined;
  };

  onModePagerDragRef.current = (dx, at) => {
    if (at === 1) {
      const surface = feedSurfaceRef.current;
      if (surface === "timeline" && dx > 0) return dx * 0.35;
      return 0;
    }
    return undefined;
  };

  onModePagerPreferVerticalRef.current = ({ target, panelIndex }) => {
    if (!(target instanceof Element)) return false;

    const reels = reelsRef.current;
    if (reels?.contains(target) && panelIndex === 0) return true;

    const feed = feedRef.current;
    if (feed?.contains(target) && panelIndex === 1) return true;

    return Boolean(
      target.closest(
        ".discover__reels-scroller, .discover__feed, .discover__v-scroller",
      ),
    );
  };

  useEffect(() => {
    if (menuPager.dragging || menuPager.animating) return;
    if (modePager.dragging || modePager.animating) return;
    if (menuIndex === 0) setChromePanel(0);
    else setChromePanel(discoverModeIndex === 1 ? 2 : 1);
  }, [
    menuIndex,
    discoverModeIndex,
    menuPager.dragging,
    menuPager.animating,
    modePager.dragging,
    modePager.animating,
  ]);

  useEffect(() => {
    if (menuIndex !== 1) {
      setModeChromeVisual(0);
      return;
    }
    if (modePager.dragging && modePagerWidth > 0) {
      const frac = discoverModeFractionalIndex(
        discoverModeIndex,
        modePager.dragPx,
        modePagerWidth,
        true,
      );
      setModeChromeVisual(frac >= 0.5 ? 1 : 0);
      return;
    }
    if (modePager.animating) return;
    setModeChromeVisual(discoverModeIndex);
  }, [
    menuIndex,
    discoverModeIndex,
    modePager.dragging,
    modePager.animating,
    modePager.dragPx,
    modePagerWidth,
  ]);

  useEffect(() => {
    const el = menuPager.containerRef.current;
    if (!el) return;
    const update = () => setPagerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [menuPager.containerRef]);

  useEffect(() => {
    const el = modePager.containerRef.current;
    if (!el) return;
    const update = () => setModePagerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [modePager.containerRef, menuIndex]);

  useLayoutEffect(() => {
    const showDiscoverChrome =
      menuIndex >= 1 ||
      (menuIndex === 0 && menuPager.dragging && menuPager.dragPx < -8);
    const chrome = showDiscoverChrome ? pagerChromeRef.current : null;
    if (!chrome) {
      setPagerChromeHeight(0);
      return;
    }
    const measure = () => setPagerChromeHeight(chrome.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(chrome);
    return () => ro.disconnect();
  }, [
    menuIndex,
    menuPager.dragPx,
    menuPager.dragging,
    menuPager.animating,
    pagerWidth,
  ]);

  const syncReelsFromVertical = useCallback(() => {
    const el = reelsRef.current;
    if (!el) return;

    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 0);

    const mid = el.scrollTop + el.clientHeight * 0.45;
    const slides = el.querySelectorAll<HTMLElement>(
      ".discover__slide[data-category]",
    );
    for (const node of slides) {
      const top = node.offsetTop;
      const bottom = top + node.offsetHeight;
      if (mid >= top && mid < bottom) {
        const found = node.dataset.category;
        if (found) setActiveCat(found);
        break;
      }
    }
  }, []);

  const syncCategoryFromFeedScroll = useCallback((scroller: HTMLElement) => {
    const mid = scroller.scrollTop + scroller.clientHeight * 0.42;
    const sections = scroller.querySelectorAll<HTMLElement>("[data-category]");
    for (const node of sections) {
      const top = node.offsetTop;
      const bottom = top + node.offsetHeight;
      if (mid >= top && mid < bottom) {
        const found = node.dataset.category;
        if (found) setActiveCat(found);
        break;
      }
    }
  }, []);

  const scrollFeedToProduct = useCallback(
    (productId: string, behavior: ScrollBehavior = "smooth") => {
      const scroller = feedRef.current;
      if (!scroller) return;
      const target = scroller.querySelector<HTMLElement>(
        `.feed-surface__layer--timeline .feed-post[data-product-id="${productId}"]`,
      );
      if (!target) return;

      const scrollerTop = scroller.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top;
      const nextTop = scroller.scrollTop + (targetTop - scrollerTop);

      scroller.scrollTo({
        top: Math.max(0, nextTop),
        behavior,
      });
    },
    [],
  );

  useLayoutEffect(() => {
    if (feedSurface !== "timeline" || !feedScrollToId) return;
    const productId = feedScrollToId;
    const pendingOpen = pendingGridOpenRef.current;
    const scroll = () => scrollFeedToProduct(productId, "auto");
    scroll();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scroll();
        if (
          pendingOpen?.product.id === productId &&
          feedRef.current &&
          !flyBusyRef.current
        ) {
          pendingGridOpenRef.current = null;
          const toRect = readPostMediaRect(feedRef.current, productId);
          if (toRect) {
            flyBusyRef.current = true;
            setFlyHiddenProductId(productId);
            setMediaFly({
              slide: pendingOpen.product,
              from: pendingOpen.fromRect,
              to: toRect,
            });
          }
        }
      });
    });
    setFeedScrollToId(null);
  }, [feedSurface, feedScrollToId, scrollFeedToProduct]);

  const scrollToCategory = useCallback(
    (catId: string) => {
      setActiveCat(catId);
      if (menuIndex === 1 && discoverModeIndex === 0) {
        const scroller = reelsRef.current;
        const target = scroller?.querySelector(
          `.discover__slide[data-category="${catId}"]`,
        );
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const scroller = feedRef.current;
      if (!scroller) return;

      if (feedSurface === "grid") {
        const gridTarget = scroller.querySelector<HTMLElement>(
          `.feed-grid__cell[data-category="${catId}"]`,
        );
        gridTarget?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const target = scroller.querySelector<HTMLElement>(
        `.feed-post[data-category="${catId}"]`,
      );
      if (target?.dataset.productId) {
        scrollFeedToProduct(target.dataset.productId, "smooth");
      }
    },
    [menuIndex, discoverModeIndex, feedSurface, scrollFeedToProduct],
  );

  const replaceMenuSearch = useCallback(
    (mainPanel: MainPanelIndex, mode: DiscoverModeIndex) => {
      const q = menuSearchForState(mainPanel, mode);
      const current = window.location.search.replace(/^\?/, "");
      if (q === current) return;
      navigate({ pathname: "/", search: q ? `?${q}` : "" }, { replace: true });
    },
    [navigate],
  );

  const goToMenuPanel = useCallback(
    (panel: number) => {
      const fromMain = menuIndexRef.current;
      const mode: DiscoverModeIndex = panel === 2 ? 1 : 0;

      if (panel === 0) {
        clearFeedGridFly();
        setFeedGridDismissActive(false);
        setChromePanel(0);
        prepareReturnToHub(menuPager.containerRef.current);
        replaceMenuSearch(0, modePager.index as DiscoverModeIndex);
        menuPager.goTo(0);
        return;
      }

      clearFeedGridFly();
      setFeedGridDismissActive(false);
      hasVisitedReelsRef.current = true;
      setChromePanel(panel === 2 ? 2 : 1);

      if (panel === 1 && feedSurfaceRef.current === "timeline") {
        setFeedSurface("grid");
      }

      if (fromMain === 0 && mode === 0) {
        requestAnimationFrame(() =>
          reelsRef.current?.scrollTo({ top: 0, behavior: "auto" }),
        );
      }
      if (fromMain === 0 && mode === 1) {
        setFeedSurface("grid");
      }
      if (mode === 1 && feedSurfaceRef.current === "timeline") {
        setFeedSurface("grid");
      }

      if (fromMain !== 1) {
        menuPager.goTo(1);
      }

      if (mode === 1) {
        pauseVideosWithin(reelsRef.current);
      }

      const modeViewport = modePager.containerRef.current;
      if (modeViewport) {
        modeViewport.style.setProperty("--motion-duration-pager", "0.34s");
        modeViewport.style.setProperty(
          "--motion-ease-pager",
          "cubic-bezier(0.22, 1.18, 0.42, 1)",
        );
      }

      modePager.goTo(mode);
      replaceMenuSearch(1, mode);
    },
    [
      clearFeedGridFly,
      menuPager.containerRef,
      menuPager.goTo,
      modePager.containerRef,
      modePager.goTo,
      replaceMenuSearch,
    ],
  );

  useEffect(() => {
    if (menuIndex !== 0) return;
    pauseDiscoverMedia(menuPager.containerRef.current);
  }, [menuIndex, menuPager.containerRef]);

  useEffect(() => {
    if (menuIndex !== 1 || discoverModeIndex !== 1) return;
    pauseVideosWithin(reelsRef.current);
  }, [menuIndex, discoverModeIndex]);

  useEffect(() => {
    const el = reelsRef.current;
    if (!el || menuIndex !== 1 || discoverModeIndex !== 0) return;
    const onScroll = () => syncReelsFromVertical();
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [syncReelsFromVertical, menuIndex, discoverModeIndex]);

  useEffect(() => {
    if (
      menuIndex === 1 &&
      discoverModeIndex === 1 &&
      prevMenuIndexRef.current === 0
    ) {
      setFeedSurface("grid");
    }
    if (menuIndex === 1) {
      hasVisitedReelsRef.current = true;
    }
    prevMenuIndexRef.current = menuIndex;
  }, [menuIndex, discoverModeIndex]);

  useEffect(() => {
    const scroller = feedRef.current;
    if (
      !scroller ||
      menuIndex !== 1 ||
      discoverModeIndex !== 1 ||
      feedSurface !== "timeline"
    )
      return;
    const onScroll = () => syncCategoryFromFeedScroll(scroller);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [syncCategoryFromFeedScroll, menuIndex, discoverModeIndex, feedSurface]);

  const backToFeedGrid = useCallback(() => {
    clearFeedGridFly();
    setFeedGridDismissActive(false);
    setFeedSurface("grid");
    feedRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [clearFeedGridFly]);

  const onFeedSurfaceChange = useCallback(
    (surface: "grid" | "timeline") => {
      if (surface === "grid") {
        backToFeedGrid();
        return;
      }
      clearFeedGridFly();
      setFeedGridDismissActive(false);
      setFeedSurface("timeline");
      requestAnimationFrame(() =>
        feedRef.current?.scrollTo({ top: 0, behavior: "auto" }),
      );
    },
    [backToFeedGrid, clearFeedGridFly],
  );

  const selectFeedGrid = useCallback(() => {
    goToMenuPanel(2);
    onFeedSurfaceChange("grid");
  }, [goToMenuPanel, onFeedSurfaceChange]);

  // Browser back/forward only — never push panel from ?view= while the pager is driving navigation.
  useEffect(() => {
    const onPopState = () => {
      if (menuPager.draggingRef.current || modePager.draggingRef.current) return;
      const view = readViewParamFromLocation();
      const main = mainPanelFromViewParam(view);
      menuPager.goTo(main);
      if (main === 0) {
        setChromePanel(0);
        clearFeedGridFly();
        setFeedGridDismissActive(false);
        prepareReturnToHub(menuPager.containerRef.current);
        return;
      }
      const mode = discoverModeFromViewParam(view);
      modePager.goTo(mode);
      setChromePanel(mode === 1 ? 2 : 1);
      setFeedSurface("grid");
      clearFeedGridFly();
      setFeedGridDismissActive(false);
      hasVisitedReelsRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [clearFeedGridFly, menuPager.containerRef, menuPager.goTo, modePager.goTo]);

  useEffect(() => {
    if (
      menuPager.draggingRef.current ||
      menuPager.animating ||
      modePager.draggingRef.current ||
      modePager.animating
    )
      return;
    const q = menuSearchForState(menuIndex, discoverModeIndex);
    const current = window.location.search.replace(/^\?/, "");
    if (q === current) return;
    navigate({ pathname: "/", search: q ? `?${q}` : "" }, { replace: true });
  }, [
    menuIndex,
    discoverModeIndex,
    navigate,
    menuPager.animating,
    modePager.animating,
  ]);

  const fromHub = searchParams.get("from") === "hub";
  useEffect(() => {
    if (menuIndex !== 1 || discoverModeIndex !== 0) {
      reelsFromHubScrollDoneRef.current = false;
      return;
    }
    if (!fromHub || reelsFromHubScrollDoneRef.current) return;
    reelsFromHubScrollDoneRef.current = true;
    requestAnimationFrame(() => reelsRef.current?.scrollTo({ top: 0, behavior: "auto" }));
  }, [fromHub, menuIndex, discoverModeIndex]);

  const pagerTrackWidth =
    pagerWidth > 0 ? pagerWidth : menuPager.containerRef.current?.clientWidth ?? 0;
  const slideOffset =
    pagerTrackWidth > 0
      ? -menuIndex * pagerTrackWidth + menuPager.dragPx
      : menuPager.dragPx;
  const trackTransform = `translate3d(${slideOffset}px, 0, 0)`;
  const fractionalIndex =
    pagerTrackWidth > 0 ? -slideOffset / pagerTrackWidth : menuIndex;

  const modeTrackWidth =
    modePagerWidth > 0
      ? modePagerWidth
      : modePager.containerRef.current?.clientWidth ?? 0;
  const modeTrackTransform = discoverModeTrackTransform(
    discoverModeIndex,
    modePager.dragPx,
  );
  const modeFractionalIndex = discoverModeFractionalIndex(
    discoverModeIndex,
    modePager.dragPx,
    modeTrackWidth,
    modePager.dragging,
  );

  const pagerInteracting = menuPager.dragging || menuPager.animating;
  const modePagerInteracting = modePager.dragging || modePager.animating;
  const panelDepth = (idx: number): CSSProperties =>
    pagerInteracting ? panelDepthStyle(idx, fractionalIndex) : {};
  const chromeModeFraction =
    modePager.dragging && modeTrackWidth > 0
      ? modeFractionalIndex
      : discoverModeIndex;
  const chromeFeedTone = modeChromeVisual === 1;
  const reelsProgressOpacity = Math.max(0, 1 - modeFractionalIndex * 1.35);
  const reelsCacheMedia = hasVisitedReelsRef.current;
  const feedTimelineActive =
    menuIndex === 1 && discoverModeIndex === 1 && feedSurface === "timeline";
  const panelIsNear = (idx: number) =>
    Math.abs(fractionalIndex - idx) < (pagerInteracting ? 0.58 : 0.01);
  const toolbarView: DiscoverToolbarView =
    menuIndex !== 1 ? "reels" : modeChromeVisual === 1 ? "grid" : "reels";
  const showDiscoverChrome =
    menuIndex >= 1 ||
    (menuIndex === 0 && menuPager.dragging && menuPager.dragPx < -8);

  const trackClass = [
    "menu-pager__track",
    menuPager.dragging ? "menu-pager__track--dragging" : "menu-pager__track--snap",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={menuPager.containerRef}
      className={[
        "menu-pager",
        menuIndex === 1 ? "menu-pager--discover-open" : "",
        menuIndex === 1 && discoverModeIndex === 1 ? "menu-pager--feed-mode" : "",
        menuIndex === 1 && discoverModeIndex === 0 ? "menu-pager--reels-mode" : "",
        modePagerInteracting ? "menu-pager--mode-interacting" : "",
        pagerInteracting ? "menu-pager--interacting" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          ...(pagerChromeHeight > 0
            ? { "--discover-chrome-h": `${pagerChromeHeight}px` }
            : {}),
          "--mode-fraction": String(modeFractionalIndex),
          "--mode-drag-fraction":
            modeTrackWidth > 0
              ? String(modePager.dragPx / modeTrackWidth)
              : "0",
        } as React.CSSProperties
      }
    >
      {showDiscoverChrome && (
        <ReelsChrome
          chromeRef={pagerChromeRef}
          toolbarRef={feedToolbarRef}
          feedChrome={chromeFeedTone}
          modeFraction={chromeModeFraction}
          showDiscoverToolbar={menuIndex === 1}
          toolbarView={toolbarView}
          activeCat={activeCat}
          onHub={() => goToMenuPanel(0)}
          onReels={() => goToMenuPanel(1)}
          onFeedGrid={selectFeedGrid}
          onCategory={scrollToCategory}
        />
      )}

      {menuIndex === 1 && (
        <div
          className="discover__progress discover__progress--pager"
          aria-hidden
          style={{ opacity: reelsProgressOpacity }}
        >
          <span style={{ width: `${Math.max(4, progress * 100)}%` }} />
        </div>
      )}

      <div className={trackClass} style={{ transform: trackTransform }}>
        <div
          className={[
            "menu-pager__panel",
            menuIndex === 0 ? "menu-pager__panel--current" : "",
            panelIsNear(0) ? "menu-pager__panel--near" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={panelDepth(0)}
        >
          <HubPanel
            mediaActive={hubIntroVideoActive}
            onExploreMenu={() => goToMenuPanel(1)}
          />
        </div>

        <div
          className={[
            "menu-pager__panel",
            "discover-shell",
            menuIndex === 1 ? "menu-pager__panel--current" : "",
            panelIsNear(1) ? "menu-pager__panel--near" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={panelDepth(1)}
          inert={menuIndex === 0}
        >
          <div
            ref={modePager.containerRef}
            className="discover-shell__viewport"
          >
            <div
              className={[
                "discover-mode-track",
                modePager.dragging
                  ? "discover-mode-track--dragging"
                  : "discover-mode-track--snap",
              ].join(" ")}
              style={{ transform: modeTrackTransform }}
            >
              <div
                className="discover-mode-pane discover-mode-pane--reels"
                aria-hidden={modeChromeVisual !== 0}
              >
          <div className="discover discover--reels">
            <div ref={reelsRef} className="discover__reels-scroller">
              <section
                className="discover__slide discover__pane discover__pane--welcome"
                data-welcome="true"
              >
                <div className="discover__media-wrap" aria-hidden>
                  <HubIntroVideo
                    className="discover__media"
                    active={reelsPlaybackActive}
                  />
                </div>
                <div className="discover__shade" />
                <div className="discover__welcome">
                  <span className="hub__location">{hub.location}</span>
                  <h1 className="hub__title">
                    <img src={hub.wordmark} alt={ptBR.hub.logoAlt} className="hub__wordmark" />
                  </h1>
                  <p className="hub__tagline">{hub.tagline}</p>
                  <button
                    type="button"
                    className="btn btn--primary btn--inline"
                    onClick={() => scrollToCategory(categories[0]?.id ?? "quente")}
                  >
                    {ptBR.discover.exploreMenu}
                    <span className="btn__arrow-down" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 5v14M6 13l6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </section>

              {productSlides.map((slide, index) => (
                <ProductReel
                  key={slide.id}
                  slide={slide}
                  reelIndex={index}
                  allSlides={productSlides}
                  playbackActive={reelsPlaybackActive}
                  cacheMedia={reelsCacheMedia}
                />
              ))}

              <section className="discover__slide discover__pane discover__pane--outro">
                <div className="discover__slide-inner discover__slide-inner--center">
                  <h2 className="discover__title">{ptBR.discover.outroTitle}</h2>
                  <p className="discover__desc discover__desc--plain">
                    {ptBR.discover.outroSubtitle}
                  </p>
                </div>
              </section>
            </div>
          </div>
              </div>
              <div
                className="discover-mode-pane discover-mode-pane--feed"
                aria-hidden={modeChromeVisual !== 1}
              >
          <div className="discover discover--feed">
            <div
              ref={feedRef}
              className="discover__feed discover__feed--timeline"
            >
              <div className="feed-surface">
                <div
                  id="feed-surface-grid"
                  role="tabpanel"
                  aria-labelledby="feed-layout-grid"
                  className={`feed-surface__layer feed-surface__layer--grid${feedSurface === "grid" ? " feed-surface__layer--on" : ""}`}
                  aria-hidden={feedSurface !== "grid"}
                >
                  <FeedProfileGrid
                    slides={productSlides}
                    flyTargetProductId={flyTargetProductId}
                    onSelect={openFeedTimeline}
                  />
                </div>
                <div
                  id="feed-surface-timeline"
                  role="tabpanel"
                  aria-labelledby="feed-layout-grid"
                  className={`feed-surface__layer feed-surface__layer--timeline${feedSurface === "timeline" ? " feed-surface__layer--on" : ""}`}
                  aria-hidden={feedSurface !== "timeline"}
                >
                  {feedTimelineEver &&
                    productSlides.map((slide) => (
                      <FeedPost
                        key={slide.id}
                        slide={slide}
                        mediaActive={feedTimelineActive}
                        mediaFlyHidden={flyHiddenProductId === slide.id}
                        closableFromGrid={feedGridDismissActive}
                        onCloseFromGrid={(fromRect) =>
                          closeExpandedFeedPost(slide.id, fromRect)
                        }
                      />
                    ))}
                  <footer className="feed-post feed-post--outro">
                    <h3>{ptBR.discover.outroTitle}</h3>
                    <p>{ptBR.discover.outroSubtitle}</p>
                  </footer>
                </div>
              </div>
            </div>
          </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mediaFly && (
        <FeedMediaFlyOverlay
          slide={mediaFly.slide}
          from={mediaFly.from}
          to={mediaFly.to}
          onComplete={completeMediaFly}
        />
      )}
    </div>
  );
}
