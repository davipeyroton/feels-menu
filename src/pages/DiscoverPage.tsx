import { Leaf } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HubPanel from "../panels/HubPanel";
import {
  type PagerCommitHandler,
  type PagerDragHandler,
  type PagerPreferVerticalHandler,
  useHorizontalPager,
} from "../hooks/useHorizontalPager";
import DiscoverTabBar, {
  type TabBarDestination,
} from "../components/DiscoverTabBar";
import CustomerProfilePane from "../panels/CustomerProfilePane";
import { useFavorites } from "../favorites/FavoritesContext";
import {
  discoverModeFractionalIndex,
  discoverModeTrackTransform,
  panelDepthStyle,
} from "../motion/instagramMotion";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { useNearViewport } from "../hooks/useNearViewport";
import {
  applyModePagerSnap,
  pauseDiscoverMedia,
  prepareOpenDiscoverReels,
  prepareReturnToHub,
  primeDiscoverReelsEntry,
} from "../lib/discoverNavigation";
import { configureInlineVideo, INLINE_VIDEO_PROPS } from "../lib/inlineVideo";
import { scrollBehaviorForDevice } from "../lib/scrollBehavior";
import { createScrollRafHandler } from "../lib/scrollRaf";
import {
  imageLoadingForUrl,
  isMediaWarm,
  markMediaWarm,
  pauseVideosWithin,
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
import FeedGridCell from "../components/FeedGridCell";
import FeedPost from "../components/FeedPost";
import MenuPrice from "../components/MenuPrice";
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
  DISCOVER_MODE_COUNT,
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
  onOpenChange,
}: {
  categories: { id: string; label: string }[];
  value: string;
  label: string;
  onChange: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = items.find((item) => item.id === value);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
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
        onClick={(event) => {
          setOpen((v) => !v);
          event.currentTarget.blur();
        }}
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

const ProductMedia = memo(function ProductMedia({
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
  const [videoFrames, setVideoFrames] = useState(false);
  /** Keep decoder mounted while warm — avoid poster flash on brief playIntent gaps. */
  const mountVideo = Boolean(slide.video && (playVideo || warm));
  const showPoster = Boolean(slide.image);
  const imageEager = playVideo || warm || isMediaWarm(slide.image);

  useEffect(() => {
    if (!warm && !playVideo) return;
    markMediaWarm(slide.video);
    markMediaWarm(slide.image);
  }, [warm, playVideo, slide.video, slide.image]);

  useEffect(() => {
    if (!mountVideo) {
      setVideoFrames(false);
      return;
    }
    const video = videoRef.current;
    if (!video || !slide.video) return;

    configureInlineVideo(video);

    const onReady = () => setVideoFrames(true);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      onReady();
    } else {
      setVideoFrames(false);
      video.addEventListener("loadeddata", onReady, { once: true });
    }

    if (playVideo) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }

    return () => {
      video.removeEventListener("loadeddata", onReady);
    };
  }, [mountVideo, playVideo, slide.video]);

  if (!showPoster && !slide.video) {
    return <ProductMediaPlaceholder className={className} />;
  }

  return (
    <span className="product-media-layered" aria-hidden>
      {showPoster ? (
        <img
          className={`${className} product-media-layered__poster`.trim()}
          src={slide.image!}
          alt=""
          loading={imageLoadingForUrl(slide.image, imageEager)}
          decoding="async"
        />
      ) : null}
      {mountVideo ? (
        <video
          ref={videoRef}
          className={[
            className,
            "discover__media--video",
            "product-media-layered__video",
            videoFrames ? "product-media-layered__video--ready" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          src={slide.video!}
          poster={slide.image ?? undefined}
          loop
          preload="auto"
          aria-hidden
          {...INLINE_VIDEO_PROPS}
        />
      ) : null}
      {!showPoster && !mountVideo && slide.video ? (
        <ProductMediaPlaceholder className={className} />
      ) : null}
    </span>
  );
});

const REEL_DESC_ZOOM_IN_MAX = 32;

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
  const { isFavorite, toggleFavorite } = useFavorites();
  const interested = isFavorite(slide.id);
  const [copyZoomedOut, setCopyZoomedOut] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inViewRef = useRef(false);
  const [inView, setInView] = useState(false);
  const [everInView, setEverInView] = useState(false);
  const [playIntent, setPlayIntent] = useState(false);

  useLayoutEffect(() => {
    if (reelIndex !== 0 || !cacheMedia) return;
    const root = sectionRef.current?.closest<HTMLElement>(
      ".discover__reels-scroller",
    );
    if (!root || root.scrollTop > 12) return;
    inViewRef.current = true;
    setInView(true);
    setEverInView(true);
  }, [cacheMedia, reelIndex]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const root = node.closest<HTMLElement>(".discover__reels-scroller");
    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        let next = inViewRef.current;
        if (!next && entry.isIntersecting && ratio >= 0.52) {
          next = true;
        } else if (next && (!entry.isIntersecting || ratio < 0.38)) {
          next = false;
        }
        if (next === inViewRef.current) return;
        inViewRef.current = next;
        setInView(next);
      },
      {
        root,
        threshold: [0, 0.38, 0.52, 0.72],
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const wantPlay = playbackActive && inView;
    if (wantPlay) {
      setPlayIntent(true);
      return;
    }
    const timer = window.setTimeout(() => setPlayIntent(false), 200);
    return () => window.clearTimeout(timer);
  }, [playbackActive, inView]);

  useEffect(() => {
    if (inView) setEverInView(true);
  }, [inView]);

  useEffect(() => {
    if (!inView) {
      setCopyZoomedOut(false);
    }
  }, [inView]);

  const onMediaTap = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    if (copyZoomedOut) {
      event.preventDefault();
      setCopyZoomedOut(false);
    }
  }, [copyZoomedOut]);

  const onSeeMore = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setCopyZoomedOut(true);
  }, []);


  useEffect(() => {
    if (!inView) return;
    warmProductMedia(slide);
    const prev = allSlides[reelIndex - 1];
    const next = allSlides[reelIndex + 1];
    if (prev) warmProductMedia(prev);
    if (next) warmProductMedia(next);
  }, [allSlides, inView, reelIndex, slide]);

  const shouldPlay = playIntent;
  const shouldWarm =
    cacheMedia && (reelIndex === 0 || everInView || playIntent || inView);
  const description = slide.description?.trim() ?? "";
  const descTruncatedInZoom =
    !copyZoomedOut && description.length > REEL_DESC_ZOOM_IN_MAX;
  const zoomInDescription = descTruncatedInZoom
    ? description.slice(0, REEL_DESC_ZOOM_IN_MAX).trimEnd()
    : description;

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
      <button
        type="button"
        className="discover__media-tap"
        aria-label={ptBR.discover.reelMediaTap}
        onClick={onMediaTap}
      />
      <div className="discover__top-fade" aria-hidden />
      <div className="discover__bottom-fade" aria-hidden />
      <div className="discover__slide-inner">
        <div className="discover__reel-rail">
          <button
            type="button"
            className={[
              "discover__heart",
              "discover__heart--reel-float",
              interested ? "discover__heart--on" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={interested}
            aria-label={ptBR.discover.markInterested}
            onClick={() => toggleFavorite(slide.id)}
          >
            <HeartIcon filled={interested} />
          </button>
        </div>
        <div
          className={[
            "discover__copy",
            copyZoomedOut ? "discover__copy--zoomed-out" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <p className="discover__cat-label">{categoryLabel(slide.category)}</p>
          <h2 className="discover__title">
            <span className="discover__title-text">{slide.name}</span>
            {slide.vegan ? (
              <span
                className="discover__vegan-inline"
                aria-label={ptBR.discover.veganProduct}
                title={ptBR.discover.veganProduct}
              >
                <Leaf
                  className="discover__vegan-leaf"
                  strokeWidth={1.85}
                  aria-hidden
                />
              </span>
            ) : null}
          </h2>
          {description ? (
            <div className="discover__desc-block">
              <p
                className={[
                  "discover__desc",
                  copyZoomedOut ? "discover__desc--open" : "",
                  descTruncatedInZoom ? "discover__desc--clamp-chars" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {copyZoomedOut ? description : zoomInDescription}
                {descTruncatedInZoom ? (
                  <>
                    <span className="discover__desc-ellipsis" aria-hidden>
                      ...
                    </span>
                    <button
                      type="button"
                      className="discover__desc-more"
                      onClick={onSeeMore}
                    >
                      {ptBR.discover.seeMore}
                    </button>
                  </>
                ) : null}
              </p>
            </div>
          ) : null}
          <div className="discover__row discover__row--price">
            <MenuPrice label={slide.price} variant="reel" />
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
    onCategoryDropdownOpen?: (open: boolean) => void;
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
    onCategoryDropdownOpen,
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
        className="discover__view-switch discover__view-switch--legacy"
        role="group"
        aria-hidden
        hidden
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
        onOpenChange={onCategoryDropdownOpen}
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
  onCategoryDropdownOpen,
  chromeHeaderLit,
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
  onCategoryDropdownOpen?: (open: boolean) => void;
  chromeHeaderLit?: boolean;
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
      <header
        className={[
          "discover__header",
          "discover__header--pager",
          chromeHeaderLit ? "discover__header--chrome-lit" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
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
            onCategoryDropdownOpen={onCategoryDropdownOpen}
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

function FeedProfileGrid({
  slides,
  onSelect,
  flyTargetProductId,
  contextCategory,
}: {
  slides: ProductSlide[];
  onSelect: (slide: ProductSlide, cell: HTMLElement) => void;
  flyTargetProductId: string | null;
  contextCategory: string;
}) {
  return (
    <section className="feed-grid" aria-label={ptBR.discover.profileGrid}>
      {slides.map((slide) => (
        <FeedGridCell
          key={slide.id}
          slide={slide}
          contextCategory={contextCategory}
          flyTarget={flyTargetProductId === slide.id}
          onSelect={onSelect}
        />
      ))}
    </section>
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
  const [reelsChromeDimmed, setReelsChromeDimmed] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const reelsChromeDimmedRef = useRef(false);
  const reelsPrevScrollTopRef = useRef(0);
  const [reelsPlaybackSettled, setReelsPlaybackSettled] = useState(false);
  const [reelsMediaCache, setReelsMediaCache] = useState(
    () => mainPanelFromViewParam(viewParam) === 1,
  );
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
        : discoverModeFromViewParam(viewParam) === 2
          ? 3
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
  const hubToReelsInstantRef = useRef(false);
  const pendingReelsHomeScrollRef = useRef(false);
  const menuTransitionFromRef = useRef<number | null>(null);
  const modeTransitionFromRef = useRef<DiscoverModeIndex | null>(null);
  const discoverModeIndexRef = useRef<DiscoverModeIndex>(initialDiscoverMode);
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

  const feedSlidesRef = useRef(productSlides);
  feedSlidesRef.current = productSlides;
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
      const slide = feedSlidesRef.current.find((p) => p.id === productId);
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
        `.feed-surface__layer--grid .feed-grid__cell[data-product-id="${productId}"]`,
      );
      cell?.scrollIntoView({ block: "center", behavior: "auto" });
      void cell?.offsetHeight;

      const toRect = cell ? readThumbRect(cell) : fromRect;

      flushSync(() => {
        setMediaFly({ slide, from: fromRect, to: toRect });
      });
    },
    [feedGridDismissActive, mediaFly],
  );

  onMenuPagerCommitRef.current = (at, direction) => {
    if (at === 0 && direction === "next") return "handled";
    if (at === 1) return "handled";
    return undefined;
  };

  onMenuPagerDragRef.current = (dx, at) => {
    if (at === 0 && dx < 0) return 0;
    return undefined;
  };

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
    DISCOVER_MODE_COUNT,
    discoverModeFromViewParam(viewParam),
    modePagerEnabledRef,
    onModePagerCommitRef,
    onModePagerDragRef,
    onModePagerPreferVerticalRef,
  );
  const discoverModeIndex = modePager.index as DiscoverModeIndex;
  discoverModeIndexRef.current = discoverModeIndex;

  const commitModePagerGoTo = useCallback(
    (mode: DiscoverModeIndex, opts?: { instant?: boolean }) => {
      modeTransitionFromRef.current = discoverModeIndexRef.current;
      modePager.goTo(mode, opts);
    },
    [modePager.goTo],
  );

  useEffect(() => {
    if (modePager.animating) return;
    modeTransitionFromRef.current = null;
  }, [modePager.animating, discoverModeIndex]);

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
  const hubToDiscoverTransition =
    menuPager.animating &&
    (menuTransitionFromRef.current === 0 ||
      (menuTransitionFromRef.current === null && prevMenuIndexRef.current === 0));

  const discoverReelsReady =
    menuIndex === 1 &&
    (!menuPager.animating || hubToDiscoverTransition);
  const leavingReelsMode =
    modePager.animating &&
    modeTransitionFromRef.current === 0 &&
    discoverModeIndex !== 0;
  const reelsModeReady =
    !modePager.dragging &&
    ((discoverModeIndex === 0 && !modePager.animating) || leavingReelsMode);
  const reelsPagerReady = discoverReelsReady && reelsModeReady;
  const reelsPlaybackActive = reelsPagerReady && reelsPlaybackSettled;

  useLayoutEffect(() => {
    if (!reelsPagerReady || menuPager.animating) {
      setReelsPlaybackSettled(false);
      return;
    }
    const startReelPlayback = () => {
      requestAnimationFrame(() => setReelsPlaybackSettled(true));
    };
    if (hubToReelsInstantRef.current) {
      hubToReelsInstantRef.current = false;
      startReelPlayback();
      return;
    }
    const timer = window.setTimeout(startReelPlayback, 48);
    return () => window.clearTimeout(timer);
  }, [
    reelsPagerReady,
    menuIndex,
    discoverModeIndex,
    menuPager.animating,
    productSlides,
  ]);

  useEffect(() => {
    if (menuIndex !== 0 || productSlides.length === 0) return;
    const first = productSlides[0];
    const run = () => primeDiscoverReelsEntry(first);
    const id =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(run, { timeout: 1800 })
        : window.setTimeout(run, 600);
    return () => {
      if (typeof requestIdleCallback !== "undefined" && typeof id === "number") {
        cancelIdleCallback(id);
      } else {
        clearTimeout(id as number);
      }
    };
  }, [menuIndex, productSlides]);

  useLayoutEffect(() => {
    if (!pendingReelsHomeScrollRef.current) return;
    if (menuIndex !== 1 || discoverModeIndex !== 0) return;
    pendingReelsHomeScrollRef.current = false;
    reelsRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [menuIndex, discoverModeIndex]);

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

    if (
      panelIndex === 2 &&
      target instanceof Element &&
      target.closest(".customer-profile__scroll")
    ) {
      return true;
    }

    return Boolean(
      target.closest(
        ".discover__reels-scroller, .discover__feed, .discover__v-scroller, .customer-profile__scroll",
      ),
    );
  };

  useEffect(() => {
    if (menuPager.dragging || menuPager.animating) return;
    if (modePager.dragging || modePager.animating) return;
    if (menuIndex === 0) setChromePanel(0);
    else {
      setChromePanel(
        discoverModeIndex === 1 ? 2 : discoverModeIndex === 2 ? 3 : 1,
      );
    }
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
    if (modePager.dragging || modePager.animating) return;
    setModeChromeVisual(discoverModeIndex);
  }, [
    menuIndex,
    discoverModeIndex,
    modePager.dragging,
    modePager.animating,
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
      hubToDiscoverTransition ||
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

    const scrollTop = el.scrollTop;
    const delta = scrollTop - reelsPrevScrollTopRef.current;
    let dimmed = reelsChromeDimmedRef.current;

    if (scrollTop <= 4) {
      dimmed = false;
    } else if (delta > 1) {
      dimmed = true;
    } else if (delta < -1) {
      dimmed = false;
    }

    reelsPrevScrollTopRef.current = scrollTop;

    if (dimmed !== reelsChromeDimmedRef.current) {
      reelsChromeDimmedRef.current = dimmed;
      setReelsChromeDimmed(dimmed);
    }

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

  const onCategoryDropdownOpen = useCallback(
    (open: boolean) => {
      setCatDropdownOpen(open);
      if (open) {
        reelsChromeDimmedRef.current = false;
        setReelsChromeDimmed(false);
        return;
      }
      syncReelsFromVertical();
    },
    [syncReelsFromVertical],
  );

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
    (productId: string, behavior: ScrollBehavior = scrollBehaviorForDevice()) => {
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
        target?.scrollIntoView({
          behavior: scrollBehaviorForDevice(),
          block: "start",
        });
        return;
      }

      const scroller = feedRef.current;
      if (!scroller) return;

      if (feedSurface === "grid") {
        const gridTarget = scroller.querySelector<HTMLElement>(
          `.feed-grid__cell[data-category="${catId}"]`,
        );
        gridTarget?.scrollIntoView({
          behavior: scrollBehaviorForDevice(),
          block: "center",
        });
        return;
      }

      const target = scroller.querySelector<HTMLElement>(
        `.feed-post[data-category="${catId}"]`,
      );
      if (target?.dataset.productId) {
        scrollFeedToProduct(target.dataset.productId);
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
      setReelsMediaCache(true);
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

      applyModePagerSnap(modePager.containerRef.current, false);
      commitModePagerGoTo(mode);
      replaceMenuSearch(1, mode);
    },
    [
      clearFeedGridFly,
      commitModePagerGoTo,
      menuPager.containerRef,
      menuPager.goTo,
      modePager.containerRef,
      replaceMenuSearch,
    ],
  );

  const goToDiscoverMode = useCallback(
    (mode: DiscoverModeIndex, opts?: { instant?: boolean }) => {
      if (
        opts?.instant &&
        menuIndexRef.current === 1 &&
        modePager.index === mode
      ) {
        if (mode === 1 && feedSurfaceRef.current !== "grid") {
          setFeedSurface("grid");
          setFeedGridDismissActive(false);
          clearFeedGridFly();
        }
        return;
      }

      clearFeedGridFly();
      setFeedGridDismissActive(false);
      hasVisitedReelsRef.current = true;
      setReelsMediaCache(true);
      setChromePanel(mode === 0 ? 1 : mode === 1 ? 2 : 3);

      if (mode === 1 || mode === 2) {
        if (feedSurfaceRef.current === "timeline") {
          setFeedSurface("grid");
        }
      }

      if (menuIndexRef.current !== 1) {
        menuPager.goTo(1);
      }

      if (mode === 0 && menuIndexRef.current !== 1) {
        hubToReelsInstantRef.current = true;
        requestAnimationFrame(() =>
          reelsRef.current?.scrollTo({ top: 0, behavior: "auto" }),
        );
      }

      if (mode === 1) {
        setFeedSurface("grid");
      }

      const modeInstant = opts?.instant === true;
      applyModePagerSnap(modePager.containerRef.current, modeInstant);
      commitModePagerGoTo(mode, modeInstant ? { instant: true } : undefined);
      replaceMenuSearch(1, mode);
    },
    [
      clearFeedGridFly,
      commitModePagerGoTo,
      menuPager.goTo,
      modePager.containerRef,
      modePager.index,
      replaceMenuSearch,
    ],
  );

  useEffect(() => {
    if (menuIndex !== 0) return;
    pauseDiscoverMedia(menuPager.containerRef.current);
  }, [menuIndex, menuPager.containerRef]);

  useEffect(() => {
    if (menuIndex !== 1 || discoverModeIndex === 0) return;
    pauseVideosWithin(reelsRef.current, "video", { rewind: false });
  }, [menuIndex, discoverModeIndex]);

  useEffect(() => {
    if (menuIndex !== 1 || discoverModeIndex !== 0) {
      reelsPrevScrollTopRef.current = 0;
      reelsChromeDimmedRef.current = false;
      setReelsChromeDimmed(false);
      return;
    }
    const el = reelsRef.current;
    if (!el) return;
    reelsPrevScrollTopRef.current = el.scrollTop;
    const onScroll = createScrollRafHandler(() => syncReelsFromVertical());
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      onScroll.cancel();
    };
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
      setReelsMediaCache(true);
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
    const onScroll = createScrollRafHandler(() =>
      syncCategoryFromFeedScroll(scroller),
    );
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      onScroll.cancel();
    };
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
    goToDiscoverMode(1);
    onFeedSurfaceChange("grid");
  }, [goToDiscoverMode, onFeedSurfaceChange]);

  const navigateTabDestination = useCallback(
    (dest: TabBarDestination) => {
      if (dest === "hub") {
        if (menuIndexRef.current === 0) return;
        clearFeedGridFly();
        setFeedGridDismissActive(false);
        setChromePanel(0);
        prepareReturnToHub(menuPager.containerRef.current);
        replaceMenuSearch(0, modePager.index as DiscoverModeIndex);
        menuPager.goTo(0);
        return;
      }

      if (
        menuIndexRef.current === 1 &&
        discoverModeIndex === dest &&
        (dest !== 1 || feedSurfaceRef.current === "grid")
      ) {
        return;
      }

      if (dest === 0 && menuIndexRef.current === 0) {
        prepareOpenDiscoverReels(
          menuPager.containerRef.current,
          productSlides[0],
        );
        hasVisitedReelsRef.current = true;
        setReelsMediaCache(true);
        hubToReelsInstantRef.current = true;
        pendingReelsHomeScrollRef.current = true;
      }

      clearFeedGridFly();
      setFeedGridDismissActive(false);
      hasVisitedReelsRef.current = true;
      setReelsMediaCache(true);
      setChromePanel(dest === 0 ? 1 : dest === 1 ? 2 : 3);

      if (dest === 1 || dest === 2) {
        if (feedSurfaceRef.current === "timeline") {
          setFeedSurface("grid");
        }
      }

      if (dest === 1) {
        setFeedSurface("grid");
      }

      const fromHub = menuIndexRef.current !== 1;
      if (fromHub) {
        menuPager.goTo(1);
      }

      if (dest === 0 && !fromHub) {
        requestAnimationFrame(() =>
          reelsRef.current?.scrollTo({ top: 0, behavior: "auto" }),
        );
      }

      applyModePagerSnap(modePager.containerRef.current, false);
      commitModePagerGoTo(dest);
      replaceMenuSearch(1, dest);
    },
    [
      clearFeedGridFly,
      commitModePagerGoTo,
      discoverModeIndex,
      menuPager.containerRef,
      menuPager.goTo,
      modePager.containerRef,
      modePager.index,
      productSlides,
      replaceMenuSearch,
    ],
  );

  const prepareExploreMenu = useCallback(() => {
    prepareOpenDiscoverReels(
      menuPager.containerRef.current,
      productSlides[0],
    );
  }, [menuPager.containerRef, productSlides]);

  const tabBarDestination: TabBarDestination =
    menuIndex === 0 ? "hub" : discoverModeIndex;

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
      commitModePagerGoTo(mode);
      setChromePanel(mode === 1 ? 2 : mode === 2 ? 3 : 1);
      setFeedSurface("grid");
      clearFeedGridFly();
      setFeedGridDismissActive(false);
      hasVisitedReelsRef.current = true;
      setReelsMediaCache(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [
    clearFeedGridFly,
    commitModePagerGoTo,
    menuPager.containerRef,
    menuPager.goTo,
  ]);

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
    DISCOVER_MODE_COUNT,
  );
  const modeFractionalIndex = discoverModeFractionalIndex(
    discoverModeIndex,
    modePager.dragPx,
    modeTrackWidth,
    modePager.dragging,
    DISCOVER_MODE_COUNT,
  );

  const pagerInteracting = menuPager.dragging || menuPager.animating;
  const modePagerInteracting = modePager.dragging || modePager.animating;
  const discoverLayoutMode: DiscoverModeIndex = modePagerInteracting
    ? modeChromeVisual
    : discoverModeIndex;
  const modePaneIsInactive = (pane: DiscoverModeIndex) =>
    !modePagerInteracting && discoverModeIndex !== pane;
  const panelDepth = (idx: number): CSSProperties =>
    pagerInteracting ? panelDepthStyle(idx, fractionalIndex) : {};
  const chromeModeFraction =
    modePager.dragging && modeTrackWidth > 0
      ? modeFractionalIndex
      : discoverModeIndex;
  const chromeFeedTone = modeChromeVisual === 1 || modeChromeVisual === 2;
  const reelsCacheMedia = reelsMediaCache || hasVisitedReelsRef.current;
  const feedTimelineActive =
    menuIndex === 1 && discoverModeIndex === 1 && feedSurface === "timeline";
  const panelIsNear = (idx: number) => {
    if (idx === 1 && hubToDiscoverTransition) return true;
    return (
      Math.abs(fractionalIndex - idx) < (pagerInteracting ? 0.58 : 0.01)
    );
  };
  const toolbarView: DiscoverToolbarView =
    menuIndex !== 1
      ? "reels"
      : modeChromeVisual === 1
        ? "grid"
        : "reels";
  const showDiscoverChrome =
    menuIndex >= 1 ||
    hubToDiscoverTransition ||
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
        menuIndex === 1 && discoverLayoutMode === 1 ? "menu-pager--feed-mode" : "",
        menuIndex === 1 && discoverLayoutMode === 0 ? "menu-pager--reels-mode" : "",
        menuIndex === 1 && discoverLayoutMode === 2
          ? "menu-pager--profile-mode"
          : "",
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
          "--reels-chrome-dim":
            menuIndex === 1 && discoverModeIndex === 0 && reelsChromeDimmed
              ? "1"
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
          showDiscoverToolbar={menuIndex === 1 && discoverModeIndex !== 2}
          toolbarView={toolbarView}
          activeCat={activeCat}
          onHub={() => goToMenuPanel(0)}
          onReels={() => goToDiscoverMode(0)}
          onFeedGrid={selectFeedGrid}
          onCategory={scrollToCategory}
          onCategoryDropdownOpen={onCategoryDropdownOpen}
          chromeHeaderLit={catDropdownOpen}
          extraClassName={
            menuIndex === 1 &&
            discoverModeIndex === 0 &&
            reelsChromeDimmed
              ? "discover--pager-chrome--reels-immersed"
              : ""
          }
        />
      )}

      <DiscoverTabBar
        activeDestination={tabBarDestination}
        onHome={() => navigateTabDestination("hub")}
        onSelect={(mode) => navigateTabDestination(mode)}
        lightChrome={
          menuIndex === 1 &&
          (modeChromeVisual === 1 || modeChromeVisual === 2)
        }
        reelsChrome={menuIndex === 1 && modeChromeVisual === 0}
        scrollImmersed={
          menuIndex === 1 && modeChromeVisual === 0 && reelsChromeDimmed
        }
      />

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
            onPrepareExploreMenu={prepareExploreMenu}
            onExploreMenu={() => navigateTabDestination(0)}
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
          inert={menuIndex === 0 && !hubToDiscoverTransition}
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
                aria-hidden={modePaneIsInactive(0)}
                inert={modePaneIsInactive(0)}
              >
          <div className="discover discover--reels">
            <div ref={reelsRef} className="discover__reels-scroller">
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
                <div className="discover__bottom-fade" aria-hidden />
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
                aria-hidden={modePaneIsInactive(1)}
                inert={modePaneIsInactive(1)}
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
                    contextCategory={activeCat}
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
              <div
                className="discover-mode-pane discover-mode-pane--profile"
                aria-hidden={modePaneIsInactive(2)}
                inert={modePaneIsInactive(2)}
              >
                <CustomerProfilePane products={productSlides} />
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
