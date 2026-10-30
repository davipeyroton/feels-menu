import { useState } from "react";
import GuestProgramSheet from "../components/GuestProgramSheet";
import HubIntroVideo from "../components/HubIntroVideo";
import {
  HubArrowIcon,
  HubCashbackIcon,
  HubLoyaltyIcon,
} from "../components/icons";
import { hub } from "../data/menu";
import { ptBR } from "../i18n/pt-BR";
import type { GuestProgram } from "../loyalty/guestEnrollment";

export default function HubPanel({
  onExploreMenu,
  mediaActive = true,
}: {
  onExploreMenu: () => void;
  mediaActive?: boolean;
}) {
  const [program, setProgram] = useState<GuestProgram | null>(null);

  return (
    <main className="hub">
      <HubIntroVideo className="hub__video" active={mediaActive} />
      <div className="hub__shade" />
      <div className="hub__gradient" />

      <div className="hub__inner">
        <header className="hub__hero">
          <span className="hub__location">{hub.location}</span>
          <h1 className="hub__title">
            <img src={hub.wordmark} alt={ptBR.hub.logoAlt} className="hub__wordmark" />
          </h1>
          <p className="hub__tagline">{hub.tagline}</p>
        </header>

        <nav className="hub__nav">
          <button
            type="button"
            className="btn btn--primary btn--hub-icon-trail"
            onClick={onExploreMenu}
          >
            <span className="btn__label">{ptBR.hub.exploreMenu}</span>
            <span className="btn__trail-icon">
              <HubArrowIcon />
            </span>
          </button>
          <button
            type="button"
            className="btn btn--glass btn--hub-icon-trail"
            onClick={() => setProgram("cashback")}
          >
            <span className="btn__label">{ptBR.hub.cashback}</span>
            <span className="btn__trail-icon">
              <HubCashbackIcon />
            </span>
          </button>
          <button
            type="button"
            className="btn btn--glass btn--hub-icon-trail"
            onClick={() => setProgram("loyalty")}
          >
            <span className="btn__label">{ptBR.hub.loyalty}</span>
            <span className="btn__trail-icon">
              <HubLoyaltyIcon />
            </span>
          </button>
        </nav>
      </div>

      <GuestProgramSheet
        open={program !== null}
        program={program}
        onClose={() => setProgram(null)}
      />
    </main>
  );
}
