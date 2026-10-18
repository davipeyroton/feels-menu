import { useEffect, useRef, useState } from "react";
import { GoogleBusinessIcon, WifiIcon } from "../components/icons";
import WifiSheetModal from "../components/WifiSheetModal";
import { hub } from "../data/menu";
import { ptBR } from "../i18n/pt-BR";

export default function HubPanel({
  onExploreMenu,
  mediaActive = true,
}: {
  onExploreMenu: () => void;
  mediaActive?: boolean;
}) {
  const [wifiOpen, setWifiOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (mediaActive) void video.play().catch(() => {});
    else video.pause();
  }, [mediaActive]);

  return (
    <main className="hub">
      <video
        ref={videoRef}
        className="hub__video"
        src={hub.video}
        poster={hub.poster}
        muted
        loop
        playsInline
        preload={mediaActive ? "auto" : "metadata"}
      />
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
          <button type="button" className="btn btn--primary" onClick={onExploreMenu}>
            {ptBR.hub.exploreMenu} <span aria-hidden>→</span>
          </button>
          {hub.google_review_url && (
            <a
              className="btn btn--glass btn--hub-icon-trail"
              href={hub.google_review_url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="btn__label">{ptBR.hub.googleReview}</span>
              <span className="btn__trail-icon">
                <GoogleBusinessIcon />
              </span>
            </a>
          )}
          {hub.wifi && (
            <button
              type="button"
              className="btn btn--glass btn--hub-icon-trail"
              onClick={() => setWifiOpen(true)}
            >
              <span className="btn__label">{ptBR.hub.wifi}</span>
              <span className="btn__trail-icon">
                <WifiIcon />
              </span>
            </button>
          )}
        </nav>
      </div>

      {hub.wifi && (
        <WifiSheetModal
          open={wifiOpen}
          onClose={() => setWifiOpen(false)}
          wifi={hub.wifi}
        />
      )}
    </main>
  );
}
