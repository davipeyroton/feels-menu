import { useState } from "react";
import GuestProgramSheet from "../components/GuestProgramSheet";
import HubIntroVideo from "../components/HubIntroVideo";
import ProgramCta from "../components/ProgramCta";
import { hub } from "../data/menu";
import { ptBR } from "../i18n/pt-BR";

export default function HubPanel({
  mediaActive = true,
}: {
  mediaActive?: boolean;
}) {
  const [guestSheetOpen, setGuestSheetOpen] = useState(false);

  return (
    <main className="hub">
      <HubIntroVideo
        className="hub__video"
        active={mediaActive && !guestSheetOpen}
      />
      <div className="hub__shade" />
      <div className="hub__gradient" />

      <div className="hub__inner">
        <header className="hub__hero">
          <div className="hub__hero-top">
            <h1 className="hub__brand">{ptBR.hub.brandName}</h1>
            <span className="hub__location hub__hero-place">{hub.location}</span>
          </div>
        </header>

        <nav className="hub__nav" aria-label={ptBR.hub.programHubAria}>
          <ProgramCta
            variant="hub"
            sheetOpen={guestSheetOpen}
            onClick={() => setGuestSheetOpen(true)}
          />
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
