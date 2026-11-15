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
  CATEGORY_PAGE_GAP_PX,
  categoryPageTrackTransform,
  discoverModeFractionalIndex,
  discoverModeTrackTransform,
  pagerSnapDurationSeconds,
  PAGER_SNAP_EASE_OUT,
  panelDepthStyle,
} from "../motion/instagramMotion";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type RefObject,
} from "react";
import { useNearViewport } from "../hooks/useNearViewport";
import {
  applyModePagerSnap,
  pauseDiscoverMedia,
  prepareOpenDiscoverReels,
  prepareReturnToHub,
  primeDiscoverReelsEntry,
} from "../lib/discoverNavigation";
import { configureInlineVideo, INLINE_VIDEO_PROPS } from "../lib/inlineVideo";
import { productReelPoster } from "../lib/productReelPoster";
import { createScrollRafHandler } from "../lib/scrollRaf";
import {
  isVideoDiagEnabled,
  isLegacyReelsPlaybackEnabled,
  sanitizeMediaUrl,
  videoDiagEvent,
} from "../lib/videoDiagnostics";
import {
  prefetchImage,
  imageLoadingForUrl,
  isMediaWarm,
  markMediaWarm,
  pauseVideosWithin,
  warmHubIntroMedia,
  prefetchReelNeighborMedia,
  warmProductMedia,
  releaseVideoPrimersExcept,
  teardownVideoElement,
  teardownVideosWithin,
} from "../media/mediaWarm";
import {
  adjacentReelTarget,
  allProducts,
  categories,
  categoryLabel,
  hub,
  reelNavigationOrder,
  reelPairForHighlight,
  visibleReelSequence,
  type ProductSlide,
  type ReelFilterId,
} from "../data/menu";
import { ptBR } from "../i18n/pt-BR";
import { CategoryEmoji } from "../openmoji/categoryEmoji";
import MenuPrice from "../components/MenuPrice";
import ProductMediaPlaceholder from "../components/ProductMediaPlaceholder";
import ThemeToggle from "../components/ThemeToggle";
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

function reelOptionLabel(id: ReelFilterId): string {
  return id === "all" ? ptBR.discover.allCategories : categoryLabel(id);
}

function CategoryPair({
  highlight,
  filter,
  open,
  onOpenChange,
  onSelect,
}: {
  highlight: ReelFilterId;
  filter: ReelFilterId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = "reel-category-selector";
  const pair = reelPairForHighlight(highlight);
  const showSelector = filter === "all";
  const order = reelNavigationOrder();
  const selectedId = pair.center;
  const trackRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [shift, setShift] = useState(0);
  const [placed, setPlaced] = useState(false);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const windowEl = track?.parentElement;
    if (!track || !windowEl) return;
    const cellOf = (id: ReelFilterId | null) =>
      id
        ? track.querySelector<HTMLElement>(`[data-cat-id="${id}"]`)
        : null;
    const measure = () => {
      const label = track.querySelector<HTMLElement>(
        `[data-cat-id="${pair.center}"] .discover__cat-pair-item`,
      );
      const view = windowEl.clientWidth;
      if (!label || view <= 0) return;
      const x = label.offsetLeft + label.offsetWidth / 2 - view / 2;
      setShift((current) => (Math.abs(current - x) < 0.5 ? current : x));
      setPlaced(true);
      const first = cellOf(pair.previous) ?? cellOf(pair.center);
      const last = cellOf(pair.next) ?? cellOf(pair.center);
      if (first && last) {
        const bleed = 8;
        const clipLeft = Math.max(0, first.offsetLeft - x - bleed);
        const clipRight = Math.max(
          0,
          view - (last.offsetLeft + last.offsetWidth - x) - bleed,
        );
        windowEl.style.clipPath = `inset(0px ${clipRight}px 0px ${clipLeft}px)`;
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(windowEl);
    observer.observe(track);
    for (const cell of track.querySelectorAll<HTMLElement>(
      ".discover__cat-pair-cell",
    )) {
      observer.observe(cell);
    }
    return () => observer.disconnect();
  }, [highlight, filter, pair.previous, pair.center, pair.next]);

  useLayoutEffect(() => {
    if (!showSelector) return;
    const root = rootRef.current;
    const track = trackRef.current;
    const chevron = chevronRef.current;
    const windowEl = track?.parentElement;
    if (!root || !track || !chevron || !windowEl) return;
    let frame = 0;
    let stopped = false;
    const place = () => {
      const slot = track.querySelector<HTMLElement>(
        '[data-cat-id="all"] .discover__cat-pair-chevron-slot',
      );
      const todosLabel = track.querySelector<HTMLElement>(
        '[data-cat-id="all"] .discover__cat-pair-label',
      );
      const centerLabel = track.querySelector<HTMLElement>(
        `[data-cat-id="${pair.center}"] .discover__cat-pair-label`,
      );
      if (!slot || !todosLabel || !centerLabel) return;
      const rootRect = root.getBoundingClientRect();
      const windowRect = windowEl.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const clip = windowEl.style.clipPath.match(
        /inset\(\s*([-\d.]+)px\s+([-\d.]+)px\s+([-\d.]+)px\s+([-\d.]+)px\s*\)/,
      );
      const visibleLeft = windowRect.left + (clip ? Number(clip[4]) : 0);
      const visibleRight = windowRect.right - (clip ? Number(clip[2]) : 0);
      const outside =
        slotRect.right <= visibleLeft + 0.5 ||
        slotRect.left >= visibleRight - 0.5;
      if (outside) {
        const base = centerLabel.getBoundingClientRect();
        chevron.style.left = "0px";
        chevron.style.top = `${base.bottom - rootRect.top - chevron.offsetHeight}px`;
        return;
      }
      const textRight = todosLabel.getBoundingClientRect().right;
      const beside = textRight - rootRect.left + 2;
      const slotLeft = slotRect.left - rootRect.left;
      chevron.style.left = `${Math.max(slotLeft, beside)}px`;
      chevron.style.top = `${slotRect.top - rootRect.top}px`;
    };
    const stop = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      place();
    };
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== track || event.propertyName !== "transform") return;
      stop();
    };
    place();
    frame = requestAnimationFrame(function loop() {
      if (stopped) return;
      place();
      frame = requestAnimationFrame(loop);
    });
    track.addEventListener("transitionend", onTransitionEnd);
    const timer = window.setTimeout(stop, 400);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      track.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [showSelector, highlight, filter, shift, pair.center, placed]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  useLayoutEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const chevron = chevronRef.current;
    const menu = menuRef.current;
    if (!root || !chevron || !menu) return;
    let frameId = 0;
    const place = () => {
      const rootRect = root.getBoundingClientRect();
      const chevronRect = chevron.getBoundingClientRect();
      const menuWidth = menu.offsetWidth;
      let left = chevronRect.left - rootRect.left;
      const maxLeft = root.clientWidth - menuWidth;
      if (left > maxLeft) left = Math.max(0, maxLeft);
      menu.style.left = `${left}px`;
      menu.style.top = `${chevronRect.bottom - rootRect.top + 6}px`;
    };
    place();
    const loop = () => {
      place();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [open, highlight, filter, shift]);

  const options = reelNavigationOrder().map((id) => ({
    id,
    label: reelOptionLabel(id),
    emoji: id !== "all",
  }));

  return (
    <div
      ref={rootRef}
      className={["discover__cat-nav", open ? "discover__cat-nav--open" : ""]
        .filter(Boolean)
        .join(" ")}
      data-reel-filter={filter}
      data-reel-highlight={highlight}
      data-cat-prev={pair.previous ?? ""}
      data-cat-center={pair.center}
      data-cat-next={pair.next ?? ""}
      data-cat-selected={selectedId}
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <div
        className="discover__cat-pair"
        role="tablist"
        aria-label={ptBR.discover.categories}
      >
        <div
          className={[
            "discover__cat-pair-window",
            placed ? "" : "discover__cat-pair-window--instant",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            ref={trackRef}
            className={[
              "discover__cat-pair-track",
              placed ? "" : "discover__cat-pair-track--instant",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              transform: `translate3d(${-shift}px, 0, 0)`,
            }}
          >
            {order.map((id) => {
              const visible =
                id === pair.previous || id === pair.center || id === pair.next;
              const selected = id === selectedId;
              const edge =
                id === pair.previous ? "left" : id === pair.next ? "right" : "";
              return (
                <div
                  key={id}
                  className="discover__cat-pair-cell"
                  data-cat-id={id}
                  aria-hidden={visible ? undefined : true}
                  style={{
                    pointerEvents: visible ? "auto" : "none",
                    visibility: visible ? "visible" : "hidden",
                  }}
                >
                  <button
                    type="button"
                    role={visible ? "tab" : undefined}
                    aria-selected={visible ? selected : undefined}
                    tabIndex={visible ? 0 : -1}
                    className={[
                      "discover__cat-pair-item",
                      selected ? "discover__cat-pair-item--on" : "",
                      edge === "left" ? "discover__cat-pair-item--edge-left" : "",
                      edge === "right"
                        ? "discover__cat-pair-item--edge-right"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      if (visible) onSelect(id);
                    }}
                  >
                    <span className="discover__cat-pair-label">
                      {reelOptionLabel(id)}
                    </span>
                  </button>
                  {id === "all" && showSelector ? (
                    <span className="discover__cat-pair-chevron-slot" aria-hidden />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {showSelector ? (
        <button
          ref={chevronRef}
          type="button"
          className="discover__cat-pair-chevron"
          aria-label={ptBR.discover.categories}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => onOpenChange(!open)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
      {showSelector ? (
        <ul
          ref={menuRef}
          id={listId}
          className="discover__cat-selector"
          role="listbox"
          hidden={!open}
          aria-label={ptBR.discover.categories}
        >
          {options.map((option) => {
            const selected = filter === option.id;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={[
                    "discover__cat-dropdown-option",
                    selected ? "discover__cat-dropdown-option--on" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onSelect(option.id)}
                >
                  {option.emoji ? (
                    <CategoryEmoji
                      categoryId={option.id}
                      size={20}
                      className="discover__cat-emoji"
                    />
                  ) : (
                    <span className="discover__cat-emoji" aria-hidden />
                  )}
                  <span>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export type ProductMediaHandle = {
  retryPlay: () => void;
};

const ProductMedia = memo(
  forwardRef<
    ProductMediaHandle,
    {
      slide: ProductSlide;
      className: string;
      playVideo?: boolean;
      videoEnabled?: boolean;
      /** Prefetch/decode priority for frame poster (never mounts `<video>`). */
      warm?: boolean;
      onPlaybackGateChange?: (needsTapToPlay: boolean) => void;
    }
  >(function ProductMedia(
    {
      slide,
      className,
      playVideo = false,
      videoEnabled = true,
      warm = false,
      onPlaybackGateChange,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const isPlayingRef = useRef(false);
    const playPromiseRef = useRef<Promise<void> | null>(null);
    const posterRestoreTimerRef = useRef<number | null>(null);
    const mountVideo = Boolean(videoEnabled && slide.video && playVideo);
    const posterUrl = productReelPoster(slide);
    const showPoster = Boolean(posterUrl);
    const mediaUrl = sanitizeMediaUrl(slide.video);
    const imageEager =
      playVideo || warm || isMediaWarm(posterUrl) || isMediaWarm(slide.video);
    const emitVideoState = useCallback(
      (kind: string, extra?: Record<string, unknown>) => {
        const video = videoRef.current;
        videoDiagEvent(kind, {
          slideId: slide.id,
          videoUrl: mediaUrl,
          readyState: video?.readyState ?? null,
          networkState: video?.networkState ?? null,
          currentTime: video ? Number(video.currentTime.toFixed(3)) : null,
          paused: video?.paused ?? null,
          errorCode: video?.error?.code ?? null,
          errorMessage: video?.error?.message ?? null,
          ...extra,
        });
      },
      [mediaUrl, slide.id],
    );

    const clearPosterRestoreTimer = useCallback(() => {
      if (posterRestoreTimerRef.current == null) return;
      window.clearTimeout(posterRestoreTimerRef.current);
      posterRestoreTimerRef.current = null;
    }, []);

    const schedulePosterVisible = useCallback(
      (delayMs = 120) => {
        clearPosterRestoreTimer();
        posterRestoreTimerRef.current = window.setTimeout(() => {
          setVideoPlaying(false);
        }, delayMs);
      },
      [clearPosterRestoreTimer],
    );

    const classifyPlayError = useCallback((error: unknown) => {
      const name =
        typeof error === "object" && error && "name" in error
          ? String((error as { name?: string }).name)
          : "";
      if (name === "AbortError") return "abort";
      if (name === "NotAllowedError") return "not-allowed";
      return "failure";
    }, []);

    const requestPlay = useCallback((reason: "auto" | "canplay" | "manual") => {
      const video = videoRef.current;
      if (!video) return;
      if (isPlayingRef.current || !video.paused) {
        emitVideoState("reel-play-skip", { reason, skip: "already-playing" });
        return;
      }
      if (playPromiseRef.current) {
        emitVideoState("reel-play-skip", { reason, skip: "pending-promise" });
        return;
      }
      emitVideoState("reel-play-call", { reason });
      try {
        const pending = video.play();
        playPromiseRef.current = pending;
        void pending
          .then(() => {
            if (playPromiseRef.current === pending) {
              playPromiseRef.current = null;
            }
            emitVideoState("reel-play-resolve", { reason });
          })
          .catch((error: unknown) => {
            if (playPromiseRef.current === pending) {
              playPromiseRef.current = null;
            }
            const kind = classifyPlayError(error);
            emitVideoState("reel-play-reject", {
              reason,
              errorKind: kind,
              errorName:
                typeof error === "object" && error && "name" in error
                  ? String((error as { name?: string }).name)
                  : null,
              errorMessage:
                typeof error === "object" && error && "message" in error
                  ? String((error as { message?: string }).message)
                  : null,
            });
            if (kind === "abort") {
              // Expected on navigation/teardown. Keep gate closed.
              onPlaybackGateChange?.(false);
              return;
            }
            schedulePosterVisible(0);
            onPlaybackGateChange?.(true);
          });
      } catch (error: unknown) {
        playPromiseRef.current = null;
        const kind = classifyPlayError(error);
        emitVideoState("reel-play-throw", {
          reason,
          errorKind: kind,
          errorName:
            typeof error === "object" && error && "name" in error
              ? String((error as { name?: string }).name)
              : null,
        });
        if (kind === "abort") {
          onPlaybackGateChange?.(false);
          return;
        }
        schedulePosterVisible(0);
        onPlaybackGateChange?.(true);
      }
    }, [classifyPlayError, emitVideoState, onPlaybackGateChange, schedulePosterVisible]);

    useImperativeHandle(
      ref,
      () => ({ retryPlay: () => requestPlay("manual") }),
      [requestPlay],
    );

    useEffect(() => {
      if (!warm && !playVideo) return;
      if (posterUrl) markMediaWarm(posterUrl);
      if (videoEnabled) markMediaWarm(slide.video);
    }, [videoEnabled, warm, playVideo, posterUrl, slide.video]);

    useEffect(() => {
      if (!videoEnabled) return;
      if (!playVideo || !slide.video) return;
      releaseVideoPrimersExcept(slide.video);
    }, [videoEnabled, playVideo, slide.video]);

    useEffect(() => {
      if (!playVideo) {
        schedulePosterVisible(0);
        onPlaybackGateChange?.(false);
      }
    }, [onPlaybackGateChange, playVideo, schedulePosterVisible]);

    useEffect(() => {
      if (!mountVideo) {
        clearPosterRestoreTimer();
        playPromiseRef.current = null;
        isPlayingRef.current = false;
        setVideoPlaying(false);
        return;
      }
      const video = videoRef.current;
      if (!video || !slide.video) return;

      configureInlineVideo(video);
      emitVideoState("reel-video-mounted");

      const onPlaying = () => {
        clearPosterRestoreTimer();
        isPlayingRef.current = true;
        setVideoPlaying(true);
        onPlaybackGateChange?.(false);
        emitVideoState("reel-video-event", { event: "playing" });
      };

      const onPause = () => {
        isPlayingRef.current = false;
        schedulePosterVisible(140);
        emitVideoState("reel-video-event", { event: "pause" });
      };

      const onWaiting = () => {
        schedulePosterVisible(140);
        emitVideoState("reel-video-event", { event: "waiting" });
      };

      const onStalled = () => {
        schedulePosterVisible(180);
        emitVideoState("reel-video-event", { event: "stalled" });
      };

      const onEmptied = () => {
        isPlayingRef.current = false;
        playPromiseRef.current = null;
        schedulePosterVisible(0);
        emitVideoState("reel-video-event", { event: "emptied" });
      };

      const onError = () => {
        isPlayingRef.current = false;
        playPromiseRef.current = null;
        schedulePosterVisible(0);
        onPlaybackGateChange?.(true);
        emitVideoState("reel-video-event", { event: "error" });
      };

      const onCanPlay = () => {
        emitVideoState("reel-video-event", { event: "canplay" });
        if (!playVideo) return;
        requestPlay("canplay");
      };

      const onLoadedMetadata = () => {
        emitVideoState("reel-video-event", { event: "loadedmetadata" });
      };

      const onLoadedData = () => {
        emitVideoState("reel-video-event", { event: "loadeddata" });
      };

      const onAbort = () => {
        playPromiseRef.current = null;
        emitVideoState("reel-video-event", { event: "abort" });
      };

      if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        schedulePosterVisible(0);
      }
      // iOS Safari buffers past metadata only after play(); waiting for canplay deadlocks.
      if (playVideo) requestPlay("auto");
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("loadeddata", onLoadedData);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("pause", onPause);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("stalled", onStalled);
      video.addEventListener("emptied", onEmptied);
      video.addEventListener("error", onError);
      video.addEventListener("abort", onAbort);

      return () => {
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("stalled", onStalled);
        video.removeEventListener("emptied", onEmptied);
        video.removeEventListener("error", onError);
        video.removeEventListener("abort", onAbort);
        clearPosterRestoreTimer();
        playPromiseRef.current = null;
        isPlayingRef.current = false;
        emitVideoState("reel-video-teardown", { reason: "effect-cleanup" });
        emitVideoState("reel-video-unmounted", { reason: "effect-cleanup" });
        teardownVideoElement(video);
        setVideoPlaying(false);
      };
    }, [
      clearPosterRestoreTimer,
      emitVideoState,
      mountVideo,
      onPlaybackGateChange,
      playVideo,
      requestPlay,
      schedulePosterVisible,
      slide.video,
    ]);

    if (!showPoster && !slide.video) {
      return <ProductMediaPlaceholder className={className} />;
    }

    return (
      <span className="product-media-layered" aria-hidden>
        {showPoster ? (
          <img
            className={[
              className,
              "product-media-layered__poster",
              videoPlaying ? "product-media-layered__poster--hidden" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            src={posterUrl!}
            alt=""
            loading={imageLoadingForUrl(posterUrl, imageEager)}
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
              videoPlaying ? "product-media-layered__video--playing" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            src={slide.video!}
            poster={posterUrl ?? undefined}
            loop
            preload={playVideo ? "auto" : "none"}
            aria-hidden
            {...INLINE_VIDEO_PROPS}
          />
        ) : null}
        {!showPoster && !mountVideo && slide.video ? (
          <ProductMediaPlaceholder className={className} />
        ) : null}
      </span>
    );
  }),
);

const REEL_DESC_ZOOM_IN_MAX = 32;

function ProductReel({
  slide,
  reelIndex,
  allSlides,
  playbackActive = false,
  cacheMedia = false,
  reelFocused = false,
  playbackFocused = false,
  disableVideo = false,
}: {
  slide: ProductSlide;
  reelIndex: number;
  allSlides: ProductSlide[];
  /** Play when slide is in view and reels panel is focused. */
  playbackActive?: boolean;
  /** Poster prefetch hints after the first reels visit. */
  cacheMedia?: boolean;
  reelFocused?: boolean;
  playbackFocused?: boolean;
  disableVideo?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const interested = isFavorite(slide.id);
  const [copyZoomedOut, setCopyZoomedOut] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inViewRef = useRef(false);
  const [inView, setInView] = useState(false);
  const [playIntent, setPlayIntent] = useState(false);
  const [needsVideoTap, setNeedsVideoTap] = useState(false);
  const productMediaRef = useRef<ProductMediaHandle>(null);

  useLayoutEffect(() => {
    if (reelIndex !== 0 || !cacheMedia) return;
    const root = sectionRef.current?.closest<HTMLElement>(
      ".discover__reels-scroller",
    );
    if (!root || root.scrollTop > 12) return;
    inViewRef.current = true;
    setInView(true);
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
    const wantPlay = playbackActive && playbackFocused;
    if (wantPlay) {
      setPlayIntent(true);
      return;
    }
    const timer = window.setTimeout(() => setPlayIntent(false), 120);
    return () => window.clearTimeout(timer);
  }, [playbackActive, playbackFocused]);

  useEffect(() => {
    if (!inView) {
      setCopyZoomedOut(false);
    }
  }, [inView]);

  const onMediaTap = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    if (needsVideoTap) {
      event.preventDefault();
      productMediaRef.current?.retryPlay();
      return;
    }
    if (copyZoomedOut) {
      event.preventDefault();
      setCopyZoomedOut(false);
    }
  }, [copyZoomedOut, needsVideoTap]);

  const onSeeMore = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setCopyZoomedOut(true);
  }, []);


  useEffect(() => {
    if (!inView || !playbackActive) return;
    if (disableVideo) {
      const cover = productReelPoster(slide);
      if (cover) prefetchImage(cover);
      if (slide.image) prefetchImage(slide.image);
    } else {
      warmProductMedia(slide);
    }
    const prev = allSlides[reelIndex - 1];
    const next = allSlides[reelIndex + 1];
    prefetchReelNeighborMedia(prev, next);
  }, [allSlides, disableVideo, inView, playbackActive, reelIndex, slide]);

  /** Playback focus (settled) owns mount/play; visual focus is independent. */
  const shouldPlay = !disableVideo && playbackActive && playbackFocused && playIntent;
  const posterWarm =
    cacheMedia && (reelIndex === 0 || playIntent || inView || reelFocused);
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
          ref={productMediaRef}
          slide={slide}
          className="discover__media discover__media--product"
          playVideo={shouldPlay}
          videoEnabled={!disableVideo}
          warm={posterWarm}
          onPlaybackGateChange={setNeedsVideoTap}
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
              {descTruncatedInZoom ? (
                <button
                  type="button"
                  className="discover__desc discover__desc--clamp-chars"
                  onClick={onSeeMore}
                >
                  {zoomInDescription}
                  <span className="discover__desc-ellipsis" aria-hidden>
                    ...
                  </span>
                  <span className="discover__desc-more">{ptBR.discover.seeMore}</span>
                </button>
              ) : (
                <p
                  className={[
                    "discover__desc",
                    copyZoomedOut ? "discover__desc--open" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {description}
                </p>
              )}
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
    highlight: ReelFilterId;
    filter: ReelFilterId;
    selectorOpen: boolean;
    onSelect: (id: string) => void;
    onSelectorOpen: (open: boolean) => void;
    className?: string;
  }
>(function DiscoverToolbar(
  { highlight, filter, selectorOpen, onSelect, onSelectorOpen, className },
  ref,
) {
  return (
    <div
      ref={ref}
      className={["discover__toolbar", className].filter(Boolean).join(" ")}
    >
      <CategoryPair
        highlight={highlight}
        filter={filter}
        open={selectorOpen}
        onOpenChange={onSelectorOpen}
        onSelect={onSelect}
      />
    </div>
  );
});

function ReelsChrome({
  chromeRef,
  toolbarRef,
  profileChrome,
  modeFraction,
  showDiscoverToolbar,
  highlight,
  filter,
  selectorOpen,
  onHub,
  onSelectCategory,
  onSelectorOpen,
  chromeHeaderLit,
  extraClassName,
}: {
  chromeRef?: RefObject<HTMLDivElement | null>;
  toolbarRef?: RefObject<HTMLDivElement | null>;
  profileChrome: boolean;
  modeFraction: number;
  showDiscoverToolbar: boolean;
  highlight: ReelFilterId;
  filter: ReelFilterId;
  selectorOpen: boolean;
  onHub: () => void;
  onSelectCategory: (id: string) => void;
  onSelectorOpen: (open: boolean) => void;
  chromeHeaderLit?: boolean;
  extraClassName?: string;
}) {
  return (
    <div
      ref={chromeRef}
      className={[
        "discover--pager-chrome",
        "discover--pager-chrome--discover",
        profileChrome
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
          <div className="discover__header-end">
            <span className="discover__header-place">{hub.location}</span>
            {profileChrome && <ThemeToggle />}
          </div>
        </div>
        {showDiscoverToolbar && (
          <DiscoverToolbar
            ref={toolbarRef}
            className="discover__toolbar--chrome"
            highlight={highlight}
            filter={filter}
            selectorOpen={selectorOpen}
            onSelect={onSelectCategory}
            onSelectorOpen={onSelectorOpen}
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

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewParam = normalizeViewParam(searchParams.get("view"));
  const disableReelVideo = searchParams.get("disableReelVideo") === "1";

  useEffect(() => {
    document.title = ptBR.meta.title;
  }, []);

  useEffect(() => {
    warmHubIntroMedia(hub.video, hub.poster);
  }, []);

  const reelsRef = useRef<HTMLDivElement>(null);
  const pagerChromeRef = useRef<HTMLDivElement>(null);
  const [pagerChromeHeight, setPagerChromeHeight] = useState(0);
  const [reelFilter, setReelFilter] = useState<ReelFilterId>("all");
  const [highlightCat, setHighlightCat] = useState<ReelFilterId>("all");
  const reelFilterRef = useRef<ReelFilterId>("all");
  reelFilterRef.current = reelFilter;
  const highlightRef = useRef<ReelFilterId>("all");
  highlightRef.current = highlightCat;
  const categoryTrackRef = useRef<HTMLDivElement>(null);
  const commitCategoryRef = useRef<(id: string) => void>(() => {});
  const [categoryMotion, setCategoryMotion] = useState<{
    target: ReelFilterId | null;
    side: "next" | "prev" | "none";
    drag: number;
    animate: boolean;
    axis: "x" | "y" | null;
    commit: boolean;
  }>({
    target: null,
    side: "none",
    drag: 0,
    animate: false,
    axis: null,
    commit: false,
  });
  const categoryMotionRef = useRef(categoryMotion);
  categoryMotionRef.current = categoryMotion;
  const reelStartLockRef = useRef(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [reelsChromeDimmed, setReelsChromeDimmed] = useState(false);
  const reelsChromeDimmedRef = useRef(false);
  const reelsPrevScrollTopRef = useRef(0);
  const [focusedReelIndex, setFocusedReelIndex] = useState(0);
  const [playbackFocusedReelIndex, setPlaybackFocusedReelIndex] = useState(0);
  const focusedReelIndexRef = useRef(0);
  focusedReelIndexRef.current = focusedReelIndex;
  const playbackFocusedReelIndexRef = useRef(0);
  playbackFocusedReelIndexRef.current = playbackFocusedReelIndex;
  const settledPlaybackFocusEnabled = !isLegacyReelsPlaybackEnabled();
  const supportsScrollEnd =
    typeof window !== "undefined" && "onscrollend" in window;
  const playbackSettleTimerRef = useRef<number | null>(null);
  const lastScrollSampleRef = useRef<{ at: number; top: number } | null>(null);
  const reelsGestureSeqRef = useRef(0);
  const reelsScrollGestureRef = useRef<{
    id: number;
    startedAt: number;
    visualChanges: number;
    playbackChanges: number;
  } | null>(null);
  const [reelsPlaybackSettled, setReelsPlaybackSettled] = useState(
    () => mainPanelFromViewParam(viewParam) === 1,
  );
  const [reelsMediaCache, setReelsMediaCache] = useState(
    () => mainPanelFromViewParam(viewParam) === 1,
  );
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
  const prevMenuIndexRef = useRef(0);
  const menuIndexRef = useRef(0);
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
  const visibleSequence = useMemo(
    () => visibleReelSequence(reelFilter),
    [reelFilter],
  );
  const visibleSlides =
    visibleSequence.status === "category"
      ? visibleSequence.products
      : productSlides;
  const neighborSlides = useMemo(() => {
    const target = categoryMotion.target;
    if (!target || target === reelFilter) return null;
    const sequence = visibleReelSequence(target);
    if (sequence.status === "absent") return null;
    return sequence.products;
  }, [categoryMotion.target, reelFilter]);

  useLayoutEffect(() => {
    if (!reelStartLockRef.current) return;
    reelStartLockRef.current = false;
    const scroller = reelsRef.current;
    if (scroller) scroller.scrollTop = 0;
    setFocusedReelIndex(0);
    setPlaybackFocusedReelIndex(0);
  }, [reelFilter, visibleSlides]);

  useEffect(() => {
    if (visibleSequence.status !== "absent") return;
    reelFilterRef.current = "all";
    setReelFilter("all");
    setHighlightCat("all");
    setFocusedReelIndex(0);
    setPlaybackFocusedReelIndex(0);
  }, [visibleSequence.status]);

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

  // Reels and profile change through the bottom bar. Horizontal swipe stays off.
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

  const hubIntroVideoPlay = menuIndex === 0;
  const hubIntroVideoMounted = menuIndex === 0;
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
  const earlyHubReelPlayback =
    hubToDiscoverTransition &&
    discoverModeIndex === 0 &&
    menuIndex === 1;
  const reelsPlaybackActive =
    reelsPagerReady && (reelsPlaybackSettled || earlyHubReelPlayback);

  useLayoutEffect(() => {
    if (!reelsPagerReady) {
      setReelsPlaybackSettled(false);
      return;
    }
    const leavingHub = menuPager.animating && hubToDiscoverTransition;
    if (menuPager.animating && !leavingHub) {
      setReelsPlaybackSettled(false);
      return;
    }
    const startReelPlayback = () => {
      requestAnimationFrame(() => setReelsPlaybackSettled(true));
    };
    if (hubToReelsInstantRef.current || leavingHub) {
      if (hubToReelsInstantRef.current) hubToReelsInstantRef.current = false;
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
    hubToDiscoverTransition,
    reelFilter,
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
    setFocusedReelIndex(0);
    setPlaybackFocusedReelIndex(0);
    if (reelFilterRef.current === "all") setHighlightCat("all");
    reelsRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [menuIndex, discoverModeIndex]);

  onModePagerCommitRef.current = () => "handled";

  onModePagerDragRef.current = () => 0;

  onModePagerPreferVerticalRef.current = ({ target, panelIndex }) => {
    if (!(target instanceof Element)) return false;

    const reels = reelsRef.current;
    if (reels?.contains(target) && panelIndex === 0) return true;

    if (panelIndex === 1 && target.closest(".customer-profile__scroll")) {
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
      setChromePanel(discoverModeIndex === 1 ? 2 : 1);
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

  const clearPlaybackSettleTimer = useCallback(() => {
    if (playbackSettleTimerRef.current == null) return;
    window.clearTimeout(playbackSettleTimerRef.current);
    playbackSettleTimerRef.current = null;
  }, []);

  const closeReelsScrollGesture = useCallback(
    (reason: string, changedPlaybackFocus: boolean) => {
      const gesture = reelsScrollGestureRef.current;
      if (!gesture) return;
      videoDiagEvent("reels-gesture-end", {
        gestureId: gesture.id,
        reason,
        visualChanges: gesture.visualChanges,
        playbackChanges: gesture.playbackChanges,
        durationMs: Math.round(performance.now() - gesture.startedAt),
        changedPlaybackFocus,
      });
      reelsScrollGestureRef.current = null;
    },
    [],
  );

  const commitPlaybackFocus = useCallback(
    (reason: "scrollend" | "fallback" | "legacy-sync") => {
      clearPlaybackSettleTimer();
      if (!settledPlaybackFocusEnabled) return;
      const next = focusedReelIndexRef.current;
      const prev = playbackFocusedReelIndexRef.current;
      const changed = next !== prev;
      if (changed) {
        setPlaybackFocusedReelIndex(next);
        const gesture = reelsScrollGestureRef.current;
        if (gesture) gesture.playbackChanges += 1;
        videoDiagEvent("reels-playback-focus-change", {
          from: prev,
          to: next,
          reason,
          gestureId: gesture?.id ?? null,
        });
      }
      closeReelsScrollGesture(reason, changed);
    },
    [clearPlaybackSettleTimer, closeReelsScrollGesture, settledPlaybackFocusEnabled],
  );

  const schedulePlaybackFocusSettle = useCallback(() => {
    if (!settledPlaybackFocusEnabled) return;
    const scroller = reelsRef.current;
    if (!scroller) return;
    const now = performance.now();
    const scrollTop = scroller.scrollTop;
    const prev = lastScrollSampleRef.current;
    let quietMs = 110;
    if (prev) {
      const dt = Math.max(16, now - prev.at);
      const velocity = Math.abs(scrollTop - prev.top) / dt;
      quietMs = velocity > 2 ? 190 : velocity > 1 ? 150 : 110;
    }
    lastScrollSampleRef.current = { at: now, top: scrollTop };
    clearPlaybackSettleTimer();
    playbackSettleTimerRef.current = window.setTimeout(() => {
      commitPlaybackFocus("fallback");
    }, quietMs);
  }, [clearPlaybackSettleTimer, commitPlaybackFocus, settledPlaybackFocusEnabled]);

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
    let nextFocus = focusedReelIndexRef.current;
    let nextCategory: string | null = null;
    for (let index = 0; index < slides.length; index++) {
      const node = slides[index]!;
      const top = node.offsetTop;
      const bottom = top + node.offsetHeight;
      if (mid >= top && mid < bottom) {
        nextFocus = index;
        nextCategory = node.dataset.category ?? null;
        break;
      }
    }
    const visualChanged = nextFocus !== focusedReelIndexRef.current;
    if (visualChanged) {
      if (settledPlaybackFocusEnabled) {
        if (!reelsScrollGestureRef.current) {
          const id = ++reelsGestureSeqRef.current;
          reelsScrollGestureRef.current = {
            id,
            startedAt: performance.now(),
            visualChanges: 0,
            playbackChanges: 0,
          };
          videoDiagEvent("reels-gesture-start", {
            gestureId: id,
            fromFocus: focusedReelIndexRef.current,
          });
        }
        reelsScrollGestureRef.current.visualChanges += 1;
        videoDiagEvent("reels-visual-focus-change", {
          gestureId: reelsScrollGestureRef.current.id,
          from: focusedReelIndexRef.current,
          to: nextFocus,
        });
      } else {
        setPlaybackFocusedReelIndex(nextFocus);
      }
      setFocusedReelIndex(nextFocus);
    }
    if (reelFilterRef.current === "all") {
      const nextHighlight = nextFocus === 0 ? "all" : nextCategory;
      if (nextHighlight) {
        setHighlightCat((current) =>
          current === nextHighlight ? current : nextHighlight,
        );
      }
    }
    if (settledPlaybackFocusEnabled && Math.abs(delta) > 0.5) {
      if (!reelsScrollGestureRef.current) {
        const id = ++reelsGestureSeqRef.current;
        reelsScrollGestureRef.current = {
          id,
          startedAt: performance.now(),
          visualChanges: 0,
          playbackChanges: 0,
        };
        videoDiagEvent("reels-gesture-start", {
          gestureId: id,
          fromFocus: focusedReelIndexRef.current,
        });
      }
      schedulePlaybackFocusSettle();
    }
  }, [schedulePlaybackFocusSettle, settledPlaybackFocusEnabled]);

  const onSelectorOpen = useCallback(
    (open: boolean) => {
      setSelectorOpen(open);
      if (open) {
        reelsChromeDimmedRef.current = false;
        setReelsChromeDimmed(false);
        return;
      }
      syncReelsFromVertical();
    },
    [syncReelsFromVertical],
  );

  const selectReelFilter = useCallback((id: string) => {
    const known =
      id === "all" || categories.some((category) => category.id === id);
    const next: ReelFilterId = known ? id : "all";
    setSelectorOpen(false);
    if (next === reelFilterRef.current) return;
    reelFilterRef.current = next;
    reelStartLockRef.current = true;
    setReelFilter(next);
    setHighlightCat(next);
    setFocusedReelIndex(0);
    setPlaybackFocusedReelIndex(0);
    focusedReelIndexRef.current = 0;
    playbackFocusedReelIndexRef.current = 0;
    reelsRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  commitCategoryRef.current = selectReelFilter;

  const previewCategory = useCallback((id: ReelFilterId) => {
    if (categoryMotionRef.current.animate) return;
    if (id === reelFilterRef.current) {
      selectReelFilter(id);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      selectReelFilter(id);
      return;
    }
    const order = reelNavigationOrder();
    const found = order.indexOf(highlightRef.current);
    const from = found < 0 ? 0 : found;
    const to = order.indexOf(id);
    const side = to >= from ? "next" : "prev";
    const width = reelsRef.current?.clientWidth ?? 0;
    const travel = width + CATEGORY_PAGE_GAP_PX;
    setCategoryMotion({
      target: id,
      side,
      drag: 0,
      animate: false,
      axis: "x",
      commit: false,
    });
    window.requestAnimationFrame(() => {
      const track = categoryTrackRef.current;
      if (track) {
        const seconds = pagerSnapDurationSeconds(0);
        track.style.setProperty("--motion-duration-pager", `${seconds.toFixed(3)}s`);
        track.style.setProperty("--motion-ease-pager", PAGER_SNAP_EASE_OUT);
      }
      setCategoryMotion({
        target: id,
        side,
        drag: side === "next" ? -travel : travel,
        animate: true,
        axis: "x",
        commit: true,
      });
    });
  }, [selectReelFilter]);

  useEffect(() => {
    const scroller = reelsRef.current;
    if (!scroller || menuIndex !== 1 || discoverModeIndex !== 0) return;

    const lockPx = 8;
    const horizontalRatio = 1.48;
    const verticalRatio = 0.88;
    const fling = 0.35;
    let blockClick = false;
    let active: {
      pointerId: number;
      x: number;
      y: number;
      lastX: number;
      lastT: number;
      velocityX: number;
      locked: "x" | "y" | null;
      scrollTop: number;
    } | null = null;

    const widthOf = () => scroller.clientWidth || 1;

    const onDown = (event: PointerEvent) => {
      if (categoryMotionRef.current.animate) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (
        event.target instanceof Element &&
        event.target.closest(".discover__cat-nav")
      ) {
        return;
      }
      active = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastT: event.timeStamp,
        velocityX: 0,
        locked: null,
        scrollTop: scroller.scrollTop,
      };
    };

    const onMove = (event: PointerEvent) => {
      if (!active || event.pointerId !== active.pointerId) return;
      const dx = event.clientX - active.x;
      const dy = event.clientY - active.y;
      const dt = Math.max(event.timeStamp - active.lastT, 1);
      active.velocityX = (event.clientX - active.lastX) / dt;
      active.lastX = event.clientX;
      active.lastT = event.timeStamp;

      if (active.locked === null) {
        if (Math.abs(dx) < lockPx && Math.abs(dy) < lockPx) return;
        if (Math.abs(dy) >= lockPx && Math.abs(dy) >= Math.abs(dx) * verticalRatio) {
          active.locked = "y";
        } else if (Math.abs(dx) > Math.abs(dy) * horizontalRatio) {
          active.locked = "x";
        } else {
          active.locked = "y";
        }
      }
      if (active.locked !== "x") return;
      blockClick = true;
      try {
        if (!scroller.hasPointerCapture(event.pointerId)) {
          scroller.setPointerCapture(event.pointerId);
        }
      } catch {
        // A pointer that cannot be captured still moves the category track.
      }

      scroller.scrollTop = active.scrollTop;
      const width = widthOf();
      const travel = width + CATEGORY_PAGE_GAP_PX;
      const direction = dx < 0 ? "next" : "prev";
      const target = adjacentReelTarget(highlightRef.current, direction);
      const canMove = target !== null && target !== reelFilterRef.current;
      const raw = canMove ? Math.max(-travel, Math.min(travel, dx)) : dx * 0.28;
      setCategoryMotion({
        target: canMove ? target : null,
        side: canMove ? direction : "none",
        drag: raw,
        animate: false,
        axis: "x",
        commit: false,
      });
    };

    const onUp = (event: PointerEvent) => {
      if (!active || event.pointerId !== active.pointerId) return;
      const dx = event.clientX - active.x;
      const locked = active.locked;
      const velocity = active.velocityX;
      const scrollTop = active.scrollTop;
      active = null;
      if (locked !== "x") {
        setCategoryMotion({
          target: null,
          side: "none",
          drag: 0,
          animate: false,
          axis: null,
          commit: false,
        });
        return;
      }
      scroller.scrollTop = scrollTop;
      const width = widthOf();
      const travel = width + CATEGORY_PAGE_GAP_PX;
      const commitPx = Math.max(52, width * 0.22);
      const progress = -dx / width;
      const wantsNext =
        progress >= 0.48 || dx < -commitPx || (velocity < -fling && dx < 0);
      const wantsPrev =
        progress <= -0.48 || dx > commitPx || (velocity > fling && dx > 0);
      const direction = wantsNext ? "next" : wantsPrev ? "prev" : null;
      const target = direction
        ? adjacentReelTarget(highlightRef.current, direction)
        : null;
      const resetMotion = () => {
        setCategoryMotion({
          target: null,
          side: "none",
          drag: 0,
          animate: false,
          axis: null,
          commit: false,
        });
      };
      if (!direction || !target || target === reelFilterRef.current) {
        if (Math.abs(categoryMotionRef.current.drag) < 1) {
          resetMotion();
          return;
        }
        setCategoryMotion((current) => ({
          ...current,
          drag: 0,
          animate: true,
          axis: null,
          commit: false,
        }));
        return;
      }
      const destination = direction === "next" ? -travel : travel;
      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        Math.abs(destination - categoryMotionRef.current.drag) < 2
      ) {
        commitCategoryRef.current(target);
        resetMotion();
        return;
      }
      const track = categoryTrackRef.current;
      if (track) {
        const seconds = pagerSnapDurationSeconds(velocity);
        track.style.setProperty("--motion-duration-pager", `${seconds.toFixed(3)}s`);
        track.style.setProperty("--motion-ease-pager", PAGER_SNAP_EASE_OUT);
      }
      setCategoryMotion({
        target,
        side: direction,
        drag: destination,
        animate: true,
        axis: "x",
        commit: true,
      });
    };

    const onTouchMove = (event: TouchEvent) => {
      if (categoryMotionRef.current.axis === "x") event.preventDefault();
    };
    const onClick = (event: globalThis.MouseEvent) => {
      if (!blockClick) return;
      blockClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    scroller.addEventListener("pointerdown", onDown);
    scroller.addEventListener("pointermove", onMove);
    scroller.addEventListener("pointerup", onUp);
    scroller.addEventListener("pointercancel", onUp);
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    scroller.addEventListener("click", onClick, true);
    return () => {
      scroller.removeEventListener("pointerdown", onDown);
      scroller.removeEventListener("pointermove", onMove);
      scroller.removeEventListener("pointerup", onUp);
      scroller.removeEventListener("pointercancel", onUp);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("click", onClick, true);
    };
  }, [menuIndex, discoverModeIndex]);

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
      if (panel !== 0) return;
      setChromePanel(0);
      prepareReturnToHub(menuPager.containerRef.current);
      replaceMenuSearch(0, discoverModeIndexRef.current);
      menuPager.goTo(0);
    },
    [menuPager.containerRef, menuPager.goTo, replaceMenuSearch],
  );

  useEffect(() => {
    if (menuIndex !== 0) return;
    pauseDiscoverMedia(menuPager.containerRef.current);
  }, [menuIndex, menuPager.containerRef]);

  useEffect(() => {
    if (menuIndex !== 1 || discoverModeIndex === 0) return;
    teardownVideosWithin(reelsRef.current, "video");
  }, [menuIndex, discoverModeIndex]);

  useEffect(() => {
    if (menuIndex === 1 && discoverModeIndex === 0) return;
    teardownVideosWithin(
      menuPager.containerRef.current?.querySelector(".discover-shell"),
      "video",
    );
  }, [menuIndex, discoverModeIndex, menuPager.containerRef]);

  useEffect(() => {
    if (!settledPlaybackFocusEnabled) {
      setPlaybackFocusedReelIndex(focusedReelIndexRef.current);
      return;
    }
    videoDiagEvent("reels-playback-focus-mode", { settledPlaybackFocusEnabled });
  }, [settledPlaybackFocusEnabled]);

  useEffect(() => {
    if (menuIndex !== 1 || discoverModeIndex !== 0) {
      reelsPrevScrollTopRef.current = 0;
      reelsChromeDimmedRef.current = false;
      setReelsChromeDimmed(false);
      clearPlaybackSettleTimer();
      closeReelsScrollGesture("reels-inactive", false);
      lastScrollSampleRef.current = null;
      return;
    }
    const el = reelsRef.current;
    if (!el) return;
    reelsPrevScrollTopRef.current = el.scrollTop;
    const onScroll = createScrollRafHandler(() => syncReelsFromVertical());
    const onScrollEnd = () => commitPlaybackFocus("scrollend");
    el.addEventListener("scroll", onScroll, { passive: true });
    if (settledPlaybackFocusEnabled && supportsScrollEnd) {
      el.addEventListener("scrollend", onScrollEnd);
    }
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (settledPlaybackFocusEnabled && supportsScrollEnd) {
        el.removeEventListener("scrollend", onScrollEnd);
      }
      onScroll.cancel();
      clearPlaybackSettleTimer();
    };
  }, [
    clearPlaybackSettleTimer,
    closeReelsScrollGesture,
    commitPlaybackFocus,
    discoverModeIndex,
    menuIndex,
    settledPlaybackFocusEnabled,
    supportsScrollEnd,
    syncReelsFromVertical,
  ]);

  useEffect(() => {
    if (!isVideoDiagEnabled()) return;
    if (menuIndex !== 1 || discoverModeIndex !== 0) return;
    const root = reelsRef.current;
    if (!root) return;
    let maxVideos = 0;
    let lastCount = -1;
    const sample = (reason: string) => {
      const count = root.querySelectorAll("video").length;
      if (count === lastCount) return;
      lastCount = count;
      if (count > maxVideos) maxVideos = count;
      videoDiagEvent("reels-video-count", { reason, count, maxVideos });
    };
    sample("start");
    const observer = new MutationObserver(() => sample("mutation"));
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      videoDiagEvent("reels-video-count-end", { maxVideos });
    };
  }, [discoverModeIndex, menuIndex]);

  useEffect(() => {
    if (!disableReelVideo) return;
    if (!isVideoDiagEnabled()) return;
    if (menuIndex !== 1 || discoverModeIndex !== 0) return;
    const root = reelsRef.current;
    if (!root) return;

    const startedAt = performance.now();
    let createdVideoElements = 0;
    let playCalls = 0;
    let mp4Requests = 0;
    let reelMp4Requests = 0;
    let scrollEvents = 0;
    let maxVideoElements = root.querySelectorAll("video").length;
    let seenResourceCount = 0;

    videoDiagEvent("reels-video-disabled-mode", {
      phase: "start",
      disableReelVideo: true,
      initialVideoElements: maxVideoElements,
      settledPlaybackFocusEnabled,
    });

    const sampleVideoCount = (reason: string) => {
      const count = root.querySelectorAll("video").length;
      if (count > maxVideoElements) maxVideoElements = count;
      videoDiagEvent("reels-disabled-video-count", {
        reason,
        count,
        maxVideoElements,
      });
    };

    const onScroll = createScrollRafHandler(() => {
      scrollEvents += 1;
      if (scrollEvents === 1 || scrollEvents % 12 === 0) {
        videoDiagEvent("reels-disabled-scroll", {
          scrollEvents,
          scrollTop: Math.round(root.scrollTop),
        });
      }
    });

    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function patchedPlay(
      this: HTMLMediaElement,
      ...args: Parameters<HTMLMediaElement["play"]>
    ) {
      if (root.contains(this)) {
        playCalls += 1;
        videoDiagEvent("reels-disabled-play-call", {
          playCalls,
          src: sanitizeMediaUrl(
            (this as HTMLVideoElement).currentSrc ||
              (this as HTMLVideoElement).src ||
              null,
          ),
        });
      }
      return originalPlay.apply(this, args);
    };

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLVideoElement)) continue;
          if (!root.contains(node)) continue;
          createdVideoElements += 1;
          videoDiagEvent("reels-disabled-video-created", {
            createdVideoElements,
            src: sanitizeMediaUrl(node.currentSrc || node.src || null),
          });
        }
      }
      sampleVideoCount("mutation");
    });

    let performanceObserver: PerformanceObserver | null = null;
    const processResourceEntries = (
      entries: PerformanceEntryList | PerformanceEntry[],
    ) => {
      for (const entry of entries) {
        if (entry.entryType !== "resource") continue;
        if (entry.startTime < startedAt) continue;
        const name = (entry as PerformanceResourceTiming).name;
        if (!/\.mp4(\?|#|$)/i.test(name)) continue;
        mp4Requests += 1;
        if (/\/menu\/.+\.mp4(\?|#|$)/i.test(name)) {
          reelMp4Requests += 1;
        }
        videoDiagEvent("reels-disabled-mp4-resource", {
          mp4Requests,
          reelMp4Requests,
          url: sanitizeMediaUrl(name),
        });
      }
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    mutationObserver.observe(root, { childList: true, subtree: true });
    sampleVideoCount("start");

    try {
      const existing = performance.getEntriesByType("resource");
      seenResourceCount = existing.length;
      processResourceEntries(existing.slice(seenResourceCount));
    } catch {
      /* ignore */
    }

    if (typeof PerformanceObserver !== "undefined") {
      performanceObserver = new PerformanceObserver((list) => {
        processResourceEntries(list.getEntries());
      });
      try {
        performanceObserver.observe({
          type: "resource",
          buffered: true,
        });
      } catch {
        /* unsupported in this browser */
      }
    }

    return () => {
      HTMLMediaElement.prototype.play = originalPlay;
      root.removeEventListener("scroll", onScroll);
      onScroll.cancel();
      mutationObserver.disconnect();
      performanceObserver?.disconnect();
      sampleVideoCount("end");
      videoDiagEvent("reels-video-disabled-mode", {
        phase: "end",
        disableReelVideo: true,
        createdVideoElements,
        playCalls,
        mp4Requests,
        reelMp4Requests,
        scrollEvents,
        maxVideoElements,
        finalVideoElements: root.querySelectorAll("video").length,
      });
    };
  }, [
    disableReelVideo,
    discoverModeIndex,
    menuIndex,
    settledPlaybackFocusEnabled,
  ]);

  useEffect(() => {
    if (menuIndex === 1) {
      hasVisitedReelsRef.current = true;
      setReelsMediaCache(true);
    }
    prevMenuIndexRef.current = menuIndex;
  }, [menuIndex]);

  const navigateTabDestination = useCallback(
    (dest: TabBarDestination) => {
      if (dest === "hub") {
        if (menuIndexRef.current === 0) return;
        setChromePanel(0);
        prepareReturnToHub(menuPager.containerRef.current);
        replaceMenuSearch(0, discoverModeIndexRef.current);
        menuPager.goTo(0);
        return;
      }

      if (menuIndexRef.current === 1 && discoverModeIndex === dest) return;

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

      hasVisitedReelsRef.current = true;
      setReelsMediaCache(true);
      setChromePanel(dest === 0 ? 1 : 2);

      const fromDiscover = menuIndexRef.current === 1;
      if (!fromDiscover) {
        menuPager.goTo(1);
      }

      if (dest === 0 && fromDiscover) {
        setFocusedReelIndex(0);
        setPlaybackFocusedReelIndex(0);
        if (reelFilterRef.current === "all") setHighlightCat("all");
        requestAnimationFrame(() =>
          reelsRef.current?.scrollTo({ top: 0, behavior: "auto" }),
        );
      }

      applyModePagerSnap(modePager.containerRef.current, false);
      commitModePagerGoTo(dest);
      replaceMenuSearch(1, dest);
    },
    [
      commitModePagerGoTo,
      discoverModeIndex,
      menuPager.containerRef,
      menuPager.goTo,
      modePager.containerRef,
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
        prepareReturnToHub(menuPager.containerRef.current);
        return;
      }
      const mode = discoverModeFromViewParam(view);
      commitModePagerGoTo(mode);
      setChromePanel(mode === 1 ? 2 : 1);
      hasVisitedReelsRef.current = true;
      setReelsMediaCache(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [commitModePagerGoTo, menuPager.containerRef, menuPager.goTo]);

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
    setFocusedReelIndex(0);
    setPlaybackFocusedReelIndex(0);
    if (reelFilterRef.current === "all") setHighlightCat("all");
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
  const profileChrome = modeChromeVisual === 1;
  const reelsCacheMedia = reelsMediaCache || hasVisitedReelsRef.current;
  const panelIsNear = (idx: number) => {
    if (idx === 1 && hubToDiscoverTransition) return true;
    return (
      Math.abs(fractionalIndex - idx) < (pagerInteracting ? 0.58 : 0.01)
    );
  };
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
        menuIndex === 1 && discoverLayoutMode === 0 ? "menu-pager--reels-mode" : "",
        menuIndex === 1 && discoverLayoutMode === 1
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
          profileChrome={profileChrome}
          modeFraction={chromeModeFraction}
          showDiscoverToolbar={menuIndex === 1 && discoverModeIndex === 0}
          highlight={highlightCat}
          filter={reelFilter}
          selectorOpen={selectorOpen}
          onHub={() => goToMenuPanel(0)}
          onSelectCategory={previewCategory}
          onSelectorOpen={onSelectorOpen}
          chromeHeaderLit={selectorOpen}
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
        lightChrome={menuIndex === 1 && modeChromeVisual === 1}
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
            hubVideoPlay={hubIntroVideoPlay}
            hubVideoMounted={hubIntroVideoMounted}
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
            <div className="discover__reels-stage">
              <div
                ref={categoryTrackRef}
                className={[
                  "discover__cat-pages",
                  categoryMotion.animate ? "discover__cat-pages--snap" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  transform: categoryPageTrackTransform(
                    categoryMotion.side === "prev" && neighborSlides !== null,
                    categoryMotion.drag,
                  ),
                }}
                onTransitionEnd={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.propertyName !== "transform") return;
                  if (!categoryMotionRef.current.animate) return;
                  const motion = categoryMotionRef.current;
                  if (
                    motion.commit &&
                    motion.target &&
                    motion.target !== reelFilterRef.current
                  ) {
                    commitCategoryRef.current(motion.target);
                  }
                  setCategoryMotion({
                    target: null,
                    side: "none",
                    drag: 0,
                    animate: false,
                    axis: null,
                    commit: false,
                  });
                }}
              >
                {categoryMotion.side === "prev" && neighborSlides ? (
                  <div className="discover__cat-page" aria-hidden>
                    {neighborSlides.map((slide, index) => (
                      <ProductReel
                        key={slide.id}
                        slide={slide}
                        reelIndex={index}
                        allSlides={neighborSlides}
                        playbackActive={false}
                        cacheMedia={false}
                        reelFocused={false}
                        playbackFocused={false}
                        disableVideo
                      />
                    ))}
                  </div>
                ) : null}
                <div
                  ref={reelsRef}
                  className={[
                    "discover__reels-scroller",
                    categoryMotion.axis === "x"
                      ? "discover__reels-scroller--axis-x"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {visibleSlides.map((slide, index) => (
                    <ProductReel
                      key={slide.id}
                      slide={slide}
                      reelIndex={index}
                      allSlides={visibleSlides}
                      playbackActive={reelsPlaybackActive}
                      cacheMedia={reelsCacheMedia}
                      reelFocused={focusedReelIndex === index}
                      playbackFocused={playbackFocusedReelIndex === index}
                      disableVideo={disableReelVideo}
                    />
                  ))}

                  {visibleSlides.length > 0 ? (
                    <section className="discover__slide discover__pane discover__pane--outro">
                      <div className="discover__bottom-fade" aria-hidden />
                      <div className="discover__slide-inner discover__slide-inner--center">
                        <h2 className="discover__title">{ptBR.discover.outroTitle}</h2>
                        <p className="discover__desc discover__desc--plain">
                          {ptBR.discover.outroSubtitle}
                        </p>
                      </div>
                    </section>
                  ) : null}
                </div>
                {categoryMotion.side === "next" && neighborSlides ? (
                  <div className="discover__cat-page" aria-hidden>
                    {neighborSlides.map((slide, index) => (
                      <ProductReel
                        key={slide.id}
                        slide={slide}
                        reelIndex={index}
                        allSlides={neighborSlides}
                        playbackActive={false}
                        cacheMedia={false}
                        reelFocused={false}
                        playbackFocused={false}
                        disableVideo
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
              </div>
              <div
                className="discover-mode-pane discover-mode-pane--profile"
                aria-hidden={modePaneIsInactive(1)}
                inert={modePaneIsInactive(1)}
              >
                <CustomerProfilePane products={productSlides} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
