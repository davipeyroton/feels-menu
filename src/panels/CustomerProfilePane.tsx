import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import FeedMediaFlyOverlay, {
  readPostMediaRect,
  readThumbRect,
} from "../components/FeedMediaFlyOverlay";
import FeedPost from "../components/FeedPost";
import GuestProgramSheet from "../components/GuestProgramSheet";
import MenuPrice from "../components/MenuPrice";
import { categoryLabel, hub, type ProductSlide } from "../data/menu";
import { useFavorites } from "../favorites/FavoritesContext";
import { ptBR } from "../i18n/pt-BR";
import type { ViewRect } from "../motion/feedGridMediaFly";

type ProfileSurface = "grid" | "post";

export default function CustomerProfilePane({
  products,
}: {
  products: ProductSlide[];
}) {
  const { favoriteIds } = useFavorites();
  const [guestOpen, setGuestOpen] = useState(false);
  const [surface, setSurface] = useState<ProfileSurface>("grid");
  const [gridDismissActive, setGridDismissActive] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
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

  const postScrollerRef = useRef<HTMLDivElement>(null);
  const pendingOpenRef = useRef<{
    product: ProductSlide;
    fromRect: ViewRect;
  } | null>(null);
  const flyBusyRef = useRef(false);

  const favorites = useMemo(
    () => products.filter((p) => favoriteIds.has(p.id)),
    [products, favoriteIds],
  );

  const clearFly = useCallback(() => {
    pendingOpenRef.current = null;
    flyBusyRef.current = false;
    setMediaFly(null);
    setFlyHiddenProductId(null);
    setFlyTargetProductId(null);
  }, []);

  const completeFly = useCallback(() => {
    flyBusyRef.current = false;
    setMediaFly(null);
    setFlyHiddenProductId(null);
    setFlyTargetProductId(null);
  }, []);

  const scrollPostToProduct = useCallback(
    (productId: string, behavior: ScrollBehavior = "auto") => {
      const scroller = postScrollerRef.current;
      if (!scroller) return;
      const target = scroller.querySelector<HTMLElement>(
        `.feed-post[data-product-id="${productId}"]`,
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

  const openFavorite = useCallback(
    (slide: ProductSlide, cell: HTMLElement) => {
      clearFly();
      setGridDismissActive(true);
      pendingOpenRef.current = {
        product: slide,
        fromRect: readThumbRect(cell),
      };
      setActiveProductId(slide.id);
      setSurface("post");
    },
    [clearFly],
  );

  const closeExpandedPost = useCallback(
    (productId: string, fromRectOverride?: ViewRect) => {
      if (flyBusyRef.current || mediaFly || !gridDismissActive) return;
      const slide = favorites.find((p) => p.id === productId);
      const scroller = postScrollerRef.current;
      if (!slide || !scroller) return;

      const fromRect =
        fromRectOverride ?? readPostMediaRect(scroller, productId);
      if (!fromRect) {
        setGridDismissActive(false);
        setSurface("grid");
        setActiveProductId(null);
        return;
      }

      flyBusyRef.current = true;
      setFlyHiddenProductId(productId);
      setFlyTargetProductId(productId);
      setGridDismissActive(false);

      flushSync(() => {
        setSurface("grid");
        setActiveProductId(null);
      });

      const cell = postScrollerRef.current?.closest(".profile-feed-surface")
        ?.querySelector<HTMLElement>(
          `.feed-grid__cell[data-product-id="${productId}"]`,
        );
      cell?.scrollIntoView({ block: "center", behavior: "auto" });
      void cell?.offsetHeight;

      const toRect = cell ? readThumbRect(cell) : fromRect;

      flushSync(() => {
        setMediaFly({ slide, from: fromRect, to: toRect });
      });
    },
    [favorites, gridDismissActive, mediaFly],
  );

  const activeSlide = useMemo(
    () =>
      activeProductId
        ? favorites.find((p) => p.id === activeProductId) ?? null
        : null,
    [activeProductId, favorites],
  );

  const postTimelineActive = surface === "post" && activeSlide !== null;

  useLayoutEffect(() => {
    if (surface !== "post" || !activeProductId) return;
    const productId = activeProductId;
    const pendingOpen = pendingOpenRef.current;
    if (!pendingOpen || pendingOpen.product.id !== productId) return;

    const scroller = postScrollerRef.current;
    if (!scroller) return;

    const scroll = () => scrollPostToProduct(productId, "auto");
    scroll();
    let cancelled = false;
    const runFly = () => {
      if (cancelled || flyBusyRef.current) return;
      if (pendingOpenRef.current?.product.id !== productId) return;
      const toRect = readPostMediaRect(scroller, productId);
      pendingOpenRef.current = null;
      if (!toRect) {
        setFlyHiddenProductId(null);
        return;
      }
      flyBusyRef.current = true;
      setFlyHiddenProductId(productId);
      setMediaFly({
        slide: pendingOpen.product,
        from: pendingOpen.fromRect,
        to: toRect,
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scroll();
        runFly();
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activeProductId, scrollPostToProduct, surface]);

  return (
    <div className="customer-profile discover discover--profile">
      <div className="profile-feed-surface">
        <div
          className={[
            "profile-feed-surface__layer",
            "profile-feed-surface__layer--grid",
            surface === "grid" ? "profile-feed-surface__layer--on" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="customer-profile__scroll">
            <header className="customer-profile__header">
              <div className="customer-profile__avatar" aria-hidden>
                <span>{ptBR.profile.avatarInitials}</span>
              </div>
              <div className="customer-profile__identity">
                <h1 className="customer-profile__name">{ptBR.profile.title}</h1>
                <p className="customer-profile__meta">{hub.location}</p>
              </div>
            </header>

            <dl className="customer-profile__stats">
              <div className="customer-profile__stat">
                <dt>{ptBR.profile.statSaved}</dt>
                <dd>{favorites.length}</dd>
              </div>
            </dl>

            <p className="customer-profile__bio">{ptBR.profile.bio}</p>

            <button
              type="button"
              className="customer-profile__program-btn"
              onClick={() => setGuestOpen(true)}
            >
              <span className="customer-profile__program-title">
                {ptBR.hub.programUnified}
              </span>
              <span className="customer-profile__program-hint">
                {ptBR.hub.programUnifiedHint}
              </span>
            </button>

            <section
              className="customer-profile__grid-section"
              aria-label={ptBR.profile.savedItems}
            >
              <h2 className="customer-profile__section-title">
                {ptBR.profile.savedItems}
              </h2>
              {favorites.length === 0 ? (
                <p className="customer-profile__empty">
                  {ptBR.profile.emptySaved}
                </p>
              ) : (
                <section className="feed-grid customer-profile__grid">
                  {favorites.map((slide) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={[
                        "feed-grid__cell",
                        "customer-profile__cell",
                        flyTargetProductId === slide.id
                          ? "feed-grid__cell--fly-target"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      data-product-id={slide.id}
                      onClick={(event) =>
                        openFavorite(slide, event.currentTarget)
                      }
                      aria-label={ptBR.discover.viewProduct(slide.name)}
                    >
                      {slide.image ? (
                        <img
                          className="feed-grid__thumb"
                          src={slide.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="feed-grid__placeholder" />
                      )}
                      <div className="feed-grid__caption">
                        <span className="discover__cat-label feed-grid__cat-label">
                          {categoryLabel(slide.category)}
                        </span>
                        <span className="feed-grid__title">{slide.name}</span>
                        <MenuPrice label={slide.price} variant="grid" />
                      </div>
                    </button>
                  ))}
                </section>
              )}
            </section>
          </div>
        </div>

        <div
          ref={postScrollerRef}
          className={[
            "profile-feed-surface__layer",
            "profile-feed-surface__layer--post",
            "discover__feed",
            "discover__feed--timeline",
            surface === "post" ? "profile-feed-surface__layer--on" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden={surface !== "post"}
        >
          {activeSlide ? (
            <FeedPost
              key={activeSlide.id}
              slide={activeSlide}
              mediaActive={postTimelineActive}
              mediaFlyHidden={flyHiddenProductId === activeSlide.id}
              closableFromGrid={gridDismissActive}
              onCloseFromGrid={(fromRect) =>
                closeExpandedPost(activeSlide.id, fromRect)
              }
            />
          ) : null}
        </div>
      </div>

      {mediaFly
        ? createPortal(
            <FeedMediaFlyOverlay
              slide={mediaFly.slide}
              from={mediaFly.from}
              to={mediaFly.to}
              onComplete={completeFly}
            />,
            document.body,
          )
        : null}

      <GuestProgramSheet
        open={guestOpen}
        program={null}
        onClose={() => setGuestOpen(false)}
      />
    </div>
  );
}
