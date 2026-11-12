import { useState } from "react";
import GuestProgramSheet from "../components/GuestProgramSheet";
import HubIntroVideo from "../components/HubIntroVideo";
import { HubArrowIcon } from "../components/icons";
import { hub } from "../data/menu";
import { ptBR } from "../i18n/pt-BR";

export default function HubPanel({
  onExploreMenu,
  mediaActive = true,
}: {
  onExploreMenu: () => void;
  mediaActive?: boolean;
}) {
  const [guestSheetOpen, setGuestSheetOpen] = useState(false);

  return (
    <main className="hub">
      <HubIntroVideo className="hub__video" active={mediaActive} />
      <div className="hub__shade" />
      <div className="hub__gradient" />

      <div className="hub__inner">
        <header className="hub__hero">
          <div className="hub__hero-top">
            <span className="hub__location hub__hero-brand">{ptBR.hub.brandName}</span>
            <span className="hub__location hub__hero-place">{hub.location}</span>
          </div>
        </header>

        <nav className="hub__nav">
          <button
            type="button"
            className="btn btn--hub-cta"
            onClick={onExploreMenu}
          >
            {ptBR.hub.exploreMenuCta}
            <span className="btn--hub-cta__icon" aria-hidden>
              <HubArrowIcon />
            </span>
          </button>
          <button
            type="button"
            className="hub__program-link"
            onClick={() => setGuestSheetOpen(true)}
          >
            <span className="hub__program-link__title">{ptBR.hub.programUnified}</span>
            <span className="hub__program-link__hint">{ptBR.hub.programUnifiedHint}</span>
          </button>
        </nav>
      </div>

      <GuestProgramSheet
        open={guestSheetOpen}
        program={null}
        onClose={() => setGuestSheetOpen(false)}
      />
    </main>
  );
}
