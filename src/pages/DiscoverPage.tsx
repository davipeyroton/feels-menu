import { useNavigate, useSearchParams } from "react-router-dom";
import HubPanel from "../panels/HubPanel";
import {
  type PagerCommitHandler,
  type PagerDragHandler,
  useHorizontalPager,
} from "../hooks/useHorizontalPager";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  allProducts,
  categories,
  categoryLabel,
  hub,
  type ProductSlide,
} from "../data/menu";
import { ptBR } from "../i18n/pt-BR";
import { CategoryEmoji } from "../openmoji/categoryEmoji";
import ThemeToggle from "../components/ThemeToggle";
import {
  menuPanelFromViewParam,
  menuSearchForPanel,
  normalizeViewParam,
  readViewParamFromLocation,
} from "../menuRouting";

type DiscoverView = "reels" | "feed";

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
}: {
  slide: ProductSlide;
  className: string;
  playVideo?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !slide.video) return;
    if (playVideo) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playVideo, slide.video]);

  if (slide.video) {
    return (
      <video
        ref={videoRef}
        className={className}
        src={slide.video}
        muted
        loop
        playsInline
        preload={playVideo ? "auto" : "metadata"}
        aria-hidden
      />
    );
  }
  if (slide.image) {
    return <img className={className} src={slide.image} alt="" />;
  }
  return null;
}

function ProductReel({ slide }: { slide: ProductSlide }) {
  const [interested, setInterested] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

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
          playVideo={inView}
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
    view: DiscoverView;
    activeCat: string;
    onReels: () => void;
    onFeed: () => void;
    onCategory: (catId: string) => void;
    onClose?: () => void;
    className?: string;
  }
>(function DiscoverToolbar(
  { view, activeCat, onReels, onFeed, onCategory, onClose, className },
  ref,
) {
  return (
    <div
      ref={ref}
      className={["discover__toolbar", className].filter(Boolean).join(" ")}
    >
      <div className="discover__view-switch" role="group" aria-label={ptBR.discover.viewMode}>
        <button
          type="button"
          className={`discover__view-btn ${view === "reels" ? "discover__view-btn--on" : ""}`}
          aria-pressed={view === "reels"}
          aria-label={ptBR.discover.viewReels}
          onClick={onReels}
        >
          <ReelsIcon />
        </button>
        <button
          type="button"
          className={`discover__view-btn ${view === "feed" ? "discover__view-btn--on" : ""}`}
          aria-pressed={view === "feed"}
          aria-label={ptBR.discover.viewFeed}
          onClick={onFeed}
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
  view,
  activeCat,
  onHub,
  onReels,
  onFeed,
  onCategory,
  onCloseImmersive,
  extraClassName,
}: {
  chromeRef?: RefObject<HTMLDivElement | null>;
  view: DiscoverView;
  activeCat: string;
  onHub: () => void;
  onReels: () => void;
  onFeed: () => void;
  onCategory: (catId: string) => void;
  onCloseImmersive?: () => void;
  extraClassName?: string;
}) {
  return (
    <div
      ref={chromeRef}
      className={[
        "discover--pager-chrome",
        "discover--pager-chrome--reels",
        extraClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="discover__header">
        <div className="discover__header-row">
          <button type="button" className="discover__brand-link" onClick={onHub}>
            Francisco
          </button>
        </div>
        <DiscoverToolbar
          view={view}
          activeCat={activeCat}
          onReels={onReels}
          onFeed={onFeed}
          onCategory={onCategory}
          onClose={onCloseImmersive}
        />
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (slide.image || !slide.video) return;
    const video = videoRef.current;
    if (!video) return;
    primeVideoThumb(video);
  }, [slide.image, slide.video]);

  if (slide.image) {
    return <img src={slide.image} alt="" loading="lazy" />;
  }

  if (slide.video) {
    const thumbSrc = slide.video.includes("#")
      ? slide.video
      : `${slide.video}#t=0.05`;
    return (
      <video
        ref={videoRef}
        className="feed-grid__video-thumb"
        src={thumbSrc}
        muted
        playsInline
        preload="auto"
        aria-hidden
        onLoadedData={(event) => primeVideoThumb(event.currentTarget)}
      />
    );
  }

  return <span className="feed-grid__placeholder" aria-hidden />;
}

function FeedProfileGrid({
  slides,
  onSelect,
}: {
  slides: ProductSlide[];
  onSelect: (slide: ProductSlide) => void;
}) {
  return (
    <section className="feed-grid" aria-label={ptBR.discover.profileGrid}>
      {slides.map((slide) => (
        <button
          key={slide.id}
          type="button"
          className="feed-grid__cell"
          data-product-id={slide.id}
          data-category={slide.category}
          onClick={() => onSelect(slide)}
          aria-label={ptBR.discover.viewProduct(slide.name)}
        >
          <FeedGridThumb slide={slide} />
          {slide.price && (
            <span className="feed-grid__price">{slide.price}</span>
          )}
        </button>
      ))}
    </section>
  );
}

function FeedPost({
  slide,
  onOpenReels,
}: {
  slide: ProductSlide;
  onOpenReels: (product: ProductSlide) => void;
}) {
  const [interested, setInterested] = useState(false);

  return (
    <article
      className="feed-post"
      data-product-id={slide.id}
      data-category={slide.category}
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
      {(slide.image || slide.video) && (
        <button
          type="button"
          className="feed-post__media"
          onClick={() => onOpenReels(slide)}
          aria-label={ptBR.discover.viewProduct(slide.name)}
        >
          {slide.video ? (
            <video
              src={slide.video}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-hidden
            />
          ) : (
            <img src={slide.image!} alt="" loading="lazy" />
          )}
        </button>
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

const SWIPE_MIN_PX = 52;

function visibleSlideIndex(scroller: HTMLElement): number {
  const mid = scroller.scrollTop + scroller.clientHeight * 0.45;
  const slides = scroller.querySelectorAll<HTMLElement>(".discover__slide");
  for (let i = 0; i < slides.length; i++) {
    const node = slides[i];
    const top = node.offsetTop;
    const bottom = top + node.offsetHeight;
    if (mid >= top && mid < bottom) return i;
  }
  return 0;
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewParam = normalizeViewParam(searchParams.get("view"));

  const reelsRef = useRef<HTMLDivElement>(null);
  const immersiveReelsRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const pagerChromeRef = useRef<HTMLDivElement>(null);
  const immersiveChromeRef = useRef<HTMLDivElement>(null);
  const feedToolbarRef = useRef<HTMLDivElement>(null);
  const feedBrandRef = useRef<HTMLDivElement>(null);
  const [feedToolbarPinned, setFeedToolbarPinned] = useState(false);
  const [pagerChromeHeight, setPagerChromeHeight] = useState(0);
  const discoverSwipeRef = useRef<{ x: number; y: number; t: number } | null>(
    null,
  );
  const feedSwipeRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [immersiveProduct, setImmersiveProduct] = useState<ProductSlide | null>(
    null,
  );
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "focaccias");
  const [progress, setProgress] = useState(0);
  const [feedSurface, setFeedSurface] = useState<"grid" | "timeline">("grid");
  const [feedScrollToId, setFeedScrollToId] = useState<string | null>(null);
  const prevMenuIndexRef = useRef(0);
  const feedSurfaceRef = useRef(feedSurface);
  feedSurfaceRef.current = feedSurface;
  const immersiveOpenRef = useRef(false);
  const feedImmersiveReturnRef = useRef<{
    surface: "grid" | "timeline";
    productId: string | null;
  }>({ surface: "grid", productId: null });
  const reelsFromHubScrollDoneRef = useRef(false);
  const reelsWelcomeVideoRef = useRef<HTMLVideoElement>(null);
  const onMenuPagerCommitRef = useRef<PagerCommitHandler | undefined>(undefined);
  const onMenuPagerDragRef = useRef<PagerDragHandler | undefined>(undefined);
  const productSlides = useMemo(() => allProducts, []);
  const feedImmersiveOpen = immersiveProduct !== null;

  const openFeedTimeline = useCallback((product: ProductSlide) => {
    setActiveCat(product.category);
    setFeedScrollToId(product.id);
    setFeedSurface("timeline");
  }, []);

  immersiveOpenRef.current = immersiveProduct !== null;

  const restoreFromImmersive = useCallback(() => {
    const place = feedImmersiveReturnRef.current;
    setImmersiveProduct(null);
    setFeedSurface(place.surface);
    if (place.surface === "timeline" && place.productId) {
      setFeedScrollToId(place.productId);
    } else {
      feedRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  onMenuPagerCommitRef.current = (at, direction) => {
    if (immersiveOpenRef.current) {
      if (direction === "prev") {
        restoreFromImmersive();
        return "handled";
      }
      return "handled";
    }

    const surface = feedSurfaceRef.current;

    if (at === 2 && direction === "next") {
      if (surface === "grid") {
        const first = productSlides[0];
        if (first) openFeedTimeline(first);
        else setFeedSurface("timeline");
        return "handled";
      }
      return "handled";
    }

    if (at === 2 && direction === "prev") {
      if (surface === "timeline") {
        setFeedSurface("grid");
        feedRef.current?.scrollTo({ top: 0, behavior: "auto" });
        return "handled";
      }
      return 1;
    }

    if (at === 1 && direction === "next") {
      setFeedSurface("grid");
      return 2;
    }

    return undefined;
  };

  onMenuPagerDragRef.current = (dx, at) => {
    if (immersiveOpenRef.current) {
      if (dx > 0) return dx * 0.45;
      return dx * 0.2;
    }
    if (at !== 2) return undefined;
    const surface = feedSurfaceRef.current;
    if (surface === "timeline" && dx > 0) return dx * 0.42;
    if (surface === "grid" && dx < 0) return dx * 0.42;
    if (surface === "timeline" && dx < 0) return dx * 0.22;
    return undefined;
  };

  const menuPager = useHorizontalPager(
    3,
    menuPanelFromViewParam(viewParam),
    true,
    onMenuPagerCommitRef,
    onMenuPagerDragRef,
  );
  const menuIndex = menuPager.index;

  const runMenuPagerCommit = useCallback(
    (at: number, direction: "next" | "prev") => {
      const custom = onMenuPagerCommitRef.current?.(at, direction);
      if (custom === "handled") return;
      const fallback =
        direction === "next"
          ? at < 2
            ? at + 1
            : null
          : at > 0
            ? at - 1
            : null;
      const target = typeof custom === "number" ? custom : fallback;
      if (target !== null && target !== at) {
        menuPager.goTo(target);
      }
    },
    [menuPager.goTo],
  );

  const onFeedTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    feedSwipeRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      t: Date.now(),
    };
  };

  const onFeedTouchEnd = (event: React.TouchEvent) => {
    if (menuIndex !== 2 || feedSurfaceRef.current !== "timeline") return;
    const start = feedSwipeRef.current;
    feedSwipeRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Date.now() - start.t > 650) return;
    const horizontalDominant =
      Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.25;
    if (!horizontalDominant) return;
    event.stopPropagation();
    runMenuPagerCommit(2, dx < 0 ? "next" : "prev");
  };

  const view: DiscoverView = menuIndex === 2 ? "feed" : "reels";

  useLayoutEffect(() => {
    const chrome = feedImmersiveOpen
      ? immersiveChromeRef.current
      : menuIndex === 2
        ? feedToolbarRef.current
        : pagerChromeRef.current;
    if (!chrome) {
      setPagerChromeHeight(0);
      return;
    }
    const measure = () => setPagerChromeHeight(chrome.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(chrome);
    return () => ro.disconnect();
  }, [menuIndex, feedImmersiveOpen]);
  const [pagerWidth, setPagerWidth] = useState(0);

  useEffect(() => {
    const el = menuPager.containerRef.current;
    if (!el) return;
    const update = () => setPagerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [menuPager.containerRef]);

  const immersiveSlides = useMemo(() => {
    if (!immersiveProduct) return [];
    const idx = productSlides.findIndex((p) => p.id === immersiveProduct.id);
    if (idx < 0) return productSlides;
    return productSlides.slice(idx);
  }, [immersiveProduct, productSlides]);

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
        `[data-product-id="${productId}"]`,
      );
      if (!target) return;
      const pager = scroller.closest(".menu-pager");
      const chromeVar = pager
        ? getComputedStyle(pager).getPropertyValue("--discover-chrome-h")
        : "";
      const chromePx = Number.parseFloat(chromeVar) || pagerChromeHeight || 120;
      scroller.scrollTo({
        top: target.offsetTop - chromePx - 8,
        behavior,
      });
    },
    [pagerChromeHeight],
  );

  useLayoutEffect(() => {
    if (feedSurface !== "timeline" || !feedScrollToId) return;
    scrollFeedToProduct(feedScrollToId, "auto");
    setFeedScrollToId(null);
  }, [feedSurface, feedScrollToId, scrollFeedToProduct]);

  const scrollToCategory = useCallback(
    (catId: string) => {
      setActiveCat(catId);
      if (feedImmersiveOpen) {
        const scroller = immersiveReelsRef.current;
        const target = scroller?.querySelector(
          `.discover__slide[data-category="${catId}"]`,
        );
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (menuIndex === 1) {
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
    [menuIndex, feedImmersiveOpen, feedSurface, scrollFeedToProduct],
  );

  const onDiscoverTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    discoverSwipeRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      t: Date.now(),
    };
  };

  const closeFeedImmersive = useCallback(() => {
    setImmersiveProduct(null);
  }, []);

  const onDiscoverTouchEnd = (event: React.TouchEvent) => {
    const start = discoverSwipeRef.current;
    discoverSwipeRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Date.now() - start.t > 650) return;

    const verticalDominant =
      Math.abs(dy) >= SWIPE_MIN_PX && Math.abs(dy) > Math.abs(dx) * 1.15;
    if (feedImmersiveOpen) {
      const horizontalDominant =
        Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.15;
      if (horizontalDominant && dx > 0) {
        restoreFromImmersive();
        return;
      }
      if (verticalDominant && dy > 0) {
        const scroller = immersiveReelsRef.current;
        if (scroller && visibleSlideIndex(scroller) === 0) {
          restoreFromImmersive();
          return;
        }
      }
      return;
    }
  };

  const goToMenuPanel = useCallback(
    (panel: number) => {
      setImmersiveProduct(null);
      if (panel === 1) {
        requestAnimationFrame(() =>
          reelsRef.current?.scrollTo({ top: 0, behavior: "auto" }),
        );
      }
      menuPager.goTo(panel);
    },
    [menuPager.goTo],
  );

  const openProductInReels = useCallback((product: ProductSlide) => {
    feedImmersiveReturnRef.current = {
      surface: feedSurfaceRef.current,
      productId: product.id,
    };
    setActiveCat(product.category);
    setImmersiveProduct(product);
  }, []);

  useLayoutEffect(() => {
    const el = immersiveReelsRef.current;
    if (!feedImmersiveOpen || !el) return;
    el.scrollTop = 0;
  }, [feedImmersiveOpen, immersiveProduct?.id]);

  useEffect(() => {
    const el = reelsRef.current;
    if (!el || menuIndex !== 1) return;
    const onScroll = () => syncReelsFromVertical();
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [syncReelsFromVertical, menuIndex]);

  const syncImmersiveFromVertical = useCallback(() => {
    const el = immersiveReelsRef.current;
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

  useEffect(() => {
    if (menuIndex === 2 && prevMenuIndexRef.current !== 2) {
      setFeedSurface("grid");
    }
    if (menuIndex !== 2) {
      setFeedToolbarPinned(false);
      setFeedSurface("grid");
    }
    prevMenuIndexRef.current = menuIndex;
  }, [menuIndex]);

  useEffect(() => {
    const scroller = feedRef.current;
    if (!scroller || menuIndex !== 2 || feedSurface !== "timeline") return;
    const onScroll = () => syncCategoryFromFeedScroll(scroller);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [syncCategoryFromFeedScroll, menuIndex, feedSurface]);

  useEffect(() => {
    const scroller = feedRef.current;
    const brand = feedBrandRef.current;
    if (!scroller || !brand || menuIndex !== 2) {
      setFeedToolbarPinned(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setFeedToolbarPinned(!entry.isIntersecting),
      { root: scroller, threshold: 0 },
    );
    observer.observe(brand);
    return () => observer.disconnect();
  }, [menuIndex]);

  useEffect(() => {
    const el = immersiveReelsRef.current;
    if (!el || !feedImmersiveOpen) return;
    const onScroll = () => syncImmersiveFromVertical();
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [feedImmersiveOpen, syncImmersiveFromVertical]);

  // Browser back/forward only — never push panel from ?view= while the pager is driving navigation.
  useEffect(() => {
    const onPopState = () => {
      if (menuPager.draggingRef.current) return;
      menuPager.goTo(menuPanelFromViewParam(readViewParamFromLocation()));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [menuPager.goTo]);

  useEffect(() => {
    if (menuPager.draggingRef.current) return;
    const q = menuSearchForPanel(menuIndex);
    const current = window.location.search.replace(/^\?/, "");
    if (q === current) return;
    navigate({ pathname: "/", search: q ? `?${q}` : "" }, { replace: true });
  }, [menuIndex, navigate]);

  useEffect(() => {
    const video = reelsWelcomeVideoRef.current;
    if (!video) return;
    if (menuIndex === 1 && !feedImmersiveOpen) void video.play().catch(() => {});
    else video.pause();
  }, [menuIndex, feedImmersiveOpen]);

  const fromHub = searchParams.get("from") === "hub";
  useEffect(() => {
    if (menuIndex !== 1) {
      reelsFromHubScrollDoneRef.current = false;
      return;
    }
    if (!fromHub || reelsFromHubScrollDoneRef.current) return;
    reelsFromHubScrollDoneRef.current = true;
    requestAnimationFrame(() => reelsRef.current?.scrollTo({ top: 0, behavior: "auto" }));
  }, [fromHub, menuIndex]);

  const pagerTrackWidth =
    pagerWidth > 0 ? pagerWidth : menuPager.containerRef.current?.clientWidth ?? 0;
  const slideOffset =
    pagerTrackWidth > 0
      ? -menuIndex * pagerTrackWidth + menuPager.dragPx
      : menuPager.dragPx;
  const trackTransform = `translate3d(${slideOffset}px, 0, 0)`;

  const trackClass = [
    "menu-pager__track",
    menuPager.dragging ? "menu-pager__track--dragging" : "menu-pager__track--snap",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={menuPager.containerRef}
      className={`menu-pager${feedImmersiveOpen ? " menu-pager--immersive menu-pager--reels-view" : ""}${menuIndex === 1 ? " menu-pager--reels-view" : ""}`}
      style={
        pagerChromeHeight > 0
          ? ({
              "--discover-chrome-h": `${pagerChromeHeight}px`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {menuIndex === 1 && !feedImmersiveOpen && (
        <ReelsChrome
          chromeRef={pagerChromeRef}
          view={view}
          activeCat={activeCat}
          onHub={() => goToMenuPanel(0)}
          onReels={() => goToMenuPanel(1)}
          onFeed={() => goToMenuPanel(2)}
          onCategory={scrollToCategory}
        />
      )}

      {feedImmersiveOpen && (
        <ReelsChrome
          chromeRef={immersiveChromeRef}
          view="reels"
          activeCat={activeCat}
          onHub={() => goToMenuPanel(0)}
          onReels={() => {
            closeFeedImmersive();
            goToMenuPanel(1);
          }}
          onFeed={() => restoreFromImmersive()}
          onCategory={scrollToCategory}
          onCloseImmersive={restoreFromImmersive}
          extraClassName="discover--pager-chrome--immersive"
        />
      )}

      {(menuIndex === 1 || feedImmersiveOpen) && (
        <div
          className={[
            "discover__progress",
            "discover__progress--pager",
            feedImmersiveOpen ? "discover__progress--immersive" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden
        >
          <span style={{ width: `${Math.max(4, progress * 100)}%` }} />
        </div>
      )}

      <div className={trackClass} style={{ transform: trackTransform }}>
        <div className="menu-pager__panel">
          <HubPanel
            mediaActive={menuIndex === 0}
            onExploreMenu={() => goToMenuPanel(1)}
          />
        </div>

        <div className="menu-pager__panel">
          <div className="discover discover--reels">
            <div ref={reelsRef} className="discover__reels-scroller">
              <section
                className="discover__slide discover__pane discover__pane--welcome"
                data-welcome="true"
              >
                <div className="discover__media-wrap" aria-hidden>
                  <video
                    ref={reelsWelcomeVideoRef}
                    className="discover__media"
                    src={hub.video}
                    poster={hub.poster}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                </div>
                <div className="discover__shade" />
                <div className="discover__welcome">
                  <span className="hub__location">{hub.location}</span>
                  <h1 className="hub__title">
                    <img src={hub.wordmark} alt="Francisco" className="hub__wordmark" />
                  </h1>
                  <p className="hub__tagline">{hub.tagline}</p>
                  <button
                    type="button"
                    className="btn btn--primary btn--inline"
                    onClick={() => scrollToCategory(categories[0]?.id ?? "focaccias")}
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

              {productSlides.map((slide) => (
                <ProductReel key={slide.id} slide={slide} />
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

        <div className="menu-pager__panel">
          <div className="discover discover--feed">
            <div
              ref={feedRef}
              className="discover__feed discover__feed--timeline"
              aria-hidden={feedImmersiveOpen}
              onTouchStart={onFeedTouchStart}
              onTouchEnd={onFeedTouchEnd}
            >
              <div
                ref={feedBrandRef}
                className="discover__header-row discover__feed-brand"
              >
                {feedSurface === "timeline" ? (
                  <button
                    type="button"
                    className="feed-back"
                    onClick={() => {
                      setFeedSurface("grid");
                      feedRef.current?.scrollTo({ top: 0, behavior: "auto" });
                    }}
                  >
                    {ptBR.discover.backToProfileGrid}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="discover__brand-link"
                    onClick={() => goToMenuPanel(0)}
                  >
                    Francisco
                  </button>
                )}
                <ThemeToggle />
              </div>
              {menuIndex === 2 && (
                <>
                  {feedToolbarPinned && pagerChromeHeight > 0 && (
                    <div
                      className="discover__toolbar-spacer"
                      style={{ height: pagerChromeHeight }}
                      aria-hidden
                    />
                  )}
                  <DiscoverToolbar
                    ref={feedToolbarRef}
                    className={[
                      "discover__toolbar--feed-sticky",
                      feedToolbarPinned ? "discover__toolbar--feed-fixed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    view={view}
                    activeCat={activeCat}
                    onReels={() => goToMenuPanel(1)}
                    onFeed={() => goToMenuPanel(2)}
                    onCategory={scrollToCategory}
                  />
                </>
              )}
              <div key={feedSurface} className="feed-surface">
                {feedSurface === "grid" ? (
                  <FeedProfileGrid
                    slides={productSlides}
                    onSelect={openFeedTimeline}
                  />
                ) : (
                  <>
                    {productSlides.map((slide) => (
                      <FeedPost
                        key={slide.id}
                        slide={slide}
                        onOpenReels={openProductInReels}
                      />
                    ))}
                    <footer className="feed-post feed-post--outro">
                      <h3>{ptBR.discover.outroTitle}</h3>
                      <p>{ptBR.discover.outroSubtitle}</p>
                    </footer>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {feedImmersiveOpen && immersiveProduct && (
        <div
          className="discover__immersive discover discover--reels"
          role="dialog"
          aria-modal="true"
          aria-label={ptBR.discover.reelDialog(immersiveProduct.name)}
        >
          <div
            ref={immersiveReelsRef}
            className="discover__reels-scroller discover__reels-scroller--immersive"
            onTouchStart={onDiscoverTouchStart}
            onTouchEnd={onDiscoverTouchEnd}
          >
            {immersiveSlides.map((slide) => (
              <ProductReel key={slide.id} slide={slide} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
