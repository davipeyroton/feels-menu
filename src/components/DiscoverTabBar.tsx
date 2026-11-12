import { FileText, Home, LayoutGrid, User } from "lucide-react";
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
}[] = [
  { id: 0, label: ptBR.discover.tabMenu, Icon: FileText },
  { id: 1, label: ptBR.discover.tabFeed, Icon: LayoutGrid },
  { id: 2, label: ptBR.discover.tabProfile, Icon: User },
];

type ThumbRect = { x: number; y: number; w: number; h: number };

function activeTabIndex(destination: TabBarDestination): number {
  return destination === "hub" ? 0 : destination + 1;
}

export default function DiscoverTabBar({
  activeDestination,
  onHome,
  onSelect,
}: {
  activeDestination: TabBarDestination;
  onHome: () => void;
  onSelect: (mode: DiscoverModeIndex) => void;
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
    const pillRect = pill.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    setThumb({
      x: rect.left - pillRect.left,
      y: rect.top - pillRect.top,
      w: rect.width,
      h: rect.height,
    });
  }, [activeDestination]);

  useLayoutEffect(() => {
    syncThumb();
  }, [syncThumb]);

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
    <nav className="discover-tab-bar" aria-label={ptBR.discover.mainNav}>
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
          <Home
            className="discover-tab-bar__icon"
            size={22}
            strokeWidth={homeOn ? 2.1 : 1.55}
            aria-hidden
          />
        </button>
        <div className="discover-tab-bar__tabs" role="tablist">
          {TABS.map(({ id, label, Icon }) => {
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
                <Icon
                  className="discover-tab-bar__icon"
                  size={22}
                  strokeWidth={on ? 2.1 : 1.55}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
