import { Clapperboard, Home, LayoutGrid, User } from "lucide-react";
import type { DiscoverModeIndex } from "../menuRouting";
import { ptBR } from "../i18n/pt-BR";

export type TabBarDestination = "hub" | DiscoverModeIndex;

type TabId = DiscoverModeIndex;

const TABS: {
  id: TabId;
  label: string;
  Icon: typeof Clapperboard;
}[] = [
  { id: 0, label: ptBR.discover.tabReels, Icon: Clapperboard },
  { id: 1, label: ptBR.discover.tabFeed, Icon: LayoutGrid },
  { id: 2, label: ptBR.discover.tabProfile, Icon: User },
];

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

  return (
    <nav className="discover-tab-bar" aria-label={ptBR.discover.mainNav}>
      <div className="discover-tab-bar__pill">
        <button
          type="button"
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
