import { Link } from "react-router-dom";
import { useState } from "react";
import WifiSheetModal from "../components/WifiSheetModal";
import { hub } from "../data/menu";
import { ptBR } from "../i18n/pt-BR";

export default function HubPage() {
  const [wifiOpen, setWifiOpen] = useState(false);

  return (
    <main className="hub">
      <video
        className="hub__video"
        src={hub.video}
        poster={hub.poster}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="hub__shade" />
      <div className="hub__gradient" />

      <div className="hub__inner">
        <header className="hub__hero">
          <span className="hub__location">{hub.location}</span>
          <h1 className="hub__title">
            <img src={hub.wordmark} alt="Francisco" className="hub__wordmark" />
          </h1>
          <p className="hub__tagline">{hub.tagline}</p>
        </header>

        <nav className="hub__nav">
          <Link className="btn btn--primary" to="/discover?from=hub">
            {ptBR.hub.exploreMenu} <span aria-hidden>→</span>
          </Link>
          {hub.google_review_url && (
            <a
              className="btn btn--glass"
              href={hub.google_review_url}
              target="_blank"
              rel="noreferrer"
            >
              {ptBR.hub.googleReview} <span aria-hidden>↗</span>
            </a>
          )}
          {hub.wifi && (
            <button
              type="button"
              className="btn btn--glass"
              onClick={() => setWifiOpen(true)}
            >
              {ptBR.hub.wifi} <span aria-hidden>›</span>
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
