import {
  FileText,
  Home,
  LayoutGrid,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { DiscoverModeIndex } from "../menuRouting";
import { ptBR } from "../i18n/pt-BR";

export type TabBarDestination = "hub" | DiscoverModeIndex;

type TabId = DiscoverModeIndex;

const TABS: {
  id: TabId;
  label: string;
  Icon: typeof FileText;
  iconId: TabBarIconId;
}[] = [
  { id: 0, label: ptBR.discover.tabMenu, Icon: FileText, iconId: "file-text" },
  { id: 1, label: ptBR.discover.tabFeed, Icon: LayoutGrid, iconId: "layout-grid" },
  { id: 2, label: ptBR.discover.tabProfile, Icon: User, iconId: "user" },
];

type ThumbRect = { x: number; y: number; w: number; h: number };

type TabBarIconId = "home" | "file-text" | "layout-grid" | "user";

/** Layout-space thumb box (stable when an ancestor uses transform: scale). */
function thumbBoundsInPill(item: HTMLElement, pill: HTMLElement): ThumbRect {
  const pillRect = pill.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  if (pillRect.width <= 0 || pillRect.height <= 0) {
    return {
      x: item.offsetLeft,
      y: item.offsetTop,
      w: item.offsetWidth,
      h: item.offsetHeight,
    };
  }
  const scaleX = pill.offsetWidth / pillRect.width;
  const scaleY = pill.offsetHeight / pillRect.height;
  return {
    x: (itemRect.left - pillRect.left) * scaleX,
    y: (itemRect.top - pillRect.top) * scaleY,
    w: itemRect.width * scaleX,
    h: itemRect.height * scaleY,
  };
}

function activeTabIndex(destination: TabBarDestination): number {
  return destination === "hub" ? 0 : destination + 1;
}

function TabBarIcon({
  icon: Icon,
  active,
  iconId,
}: {
  icon: LucideIcon;
  active: boolean;
  iconId: TabBarIconId;
}) {
  const solidWhenActive = iconId === "layout-grid";
  const size = active && solidWhenActive ? 25 : 24;
  const outline = !active || !solidWhenActive;

  if (outline) {
    return (
      <span
        className="discover-tab-bar__icon-stack"
        data-active={active ? "true" : "false"}
        data-icon={iconId}
        data-variant="outline"
      >
        <Icon
          className="discover-tab-bar__icon"
          size={24}
          strokeWidth={active ? 2.05 : 1.75}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        />
      </span>
    );
  }

  return (
    <span
      className="discover-tab-bar__icon-stack"
      data-active="true"
      data-icon={iconId}
      data-variant="solid"
    >
      <Icon
        className="discover-tab-bar__icon discover-tab-bar__icon--solid-fill"
        size={size}
        strokeWidth={0}
        fill="currentColor"
        stroke="none"
        aria-hidden
      />
    </span>
  );
}

export default function DiscoverTabBar({
  activeDestination,
  onHome,
  onSelect,
  lightChrome = false,
  reelsChrome = false,
  scrollImmersed = false,
}: {
  activeDestination: TabBarDestination;
  onHome: () => void;
  onSelect: (mode: DiscoverModeIndex) => void;
  /** Feed/profile in light theme: light tab bar (default is dark) */
  lightChrome?: boolean;
  /** Reels-only thumb styling */
  reelsChrome?: boolean;
  /** Reels scroll: perspective zoom */
  scrollImmersed?: boolean;
}) {
  const homeOn = activeDestination === "hub";
  const pillRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<ThumbRect | null>(null);

  const syncThumb = useCallback(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const index = activeTabIndex(activeDestination);
    const item = itemRefs.current[index];
    if (!item) return;
    setThumb(thumbBoundsInPill(item, pill));
  }, [activeDestination]);

  useLayoutEffect(() => {
    syncThumb();
  }, [syncThumb, scrollImmersed]);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const ro = new ResizeObserver(() => syncThumb());
    ro.observe(pill);
    for (const el of itemRefs.current) {
      if (el) ro.observe(el);
    }
    window.addEventListener("resize", syncThumb);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncThumb);
    };
  }, [syncThumb]);

  const setItemRef = (index: number) => (el: HTMLButtonElement | null) => {
    itemRefs.current[index] = el;
  };

  return (
    <nav
      className={[
        "discover-tab-bar",
        lightChrome ? "discover-tab-bar--light-chrome" : "",
        reelsChrome ? "discover-tab-bar--reels-chrome" : "",
        scrollImmersed ? "discover-tab-bar--scroll-immersed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ptBR.discover.mainNav}
    >
      <div className="discover-tab-bar__pill" ref={pillRef}>
        {thumb ? (
          <span
            className="discover-tab-bar__thumb"
            aria-hidden
            style={{
              width: thumb.w,
              height: thumb.h,
              transform: `translate3d(${thumb.x}px, ${thumb.y}px, 0)`,
            }}
          />
        ) : null}
        <button
          type="button"
          ref={setItemRef(0)}
          className={[
            "discover-tab-bar__item",
            homeOn ? "discover-tab-bar__item--on" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-current={homeOn ? "page" : undefined}
          aria-label={ptBR.discover.tabHome}
          onClick={onHome}
        >
          <TabBarIcon icon={Home} active={homeOn} iconId="home" />
        </button>
        <div className="discover-tab-bar__tabs" role="tablist">
          {TABS.map(({ id, label, Icon, iconId }) => {
            const on = activeDestination === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                ref={setItemRef(id + 1)}
                className={[
                  "discover-tab-bar__item",
                  on ? "discover-tab-bar__item--on" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-selected={on}
                aria-label={label}
                onClick={() => onSelect(id)}
              >
                <TabBarIcon icon={Icon} active={on} iconId={iconId} />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
