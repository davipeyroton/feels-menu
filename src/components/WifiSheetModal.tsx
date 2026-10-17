import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ptBR } from "../i18n/pt-BR";

export type WifiCredentials = {
  ssid: string;
  password: string;
};

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    el.remove();
  }
}

export default function WifiSheetModal({
  open,
  onClose,
  wifi,
}: {
  open: boolean;
  onClose: () => void;
  wifi: WifiCredentials;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="wifi-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={ptBR.hub.wifiModalAria}
    >
      <button
        type="button"
        className="wifi-sheet__backdrop"
        aria-label={ptBR.hub.close}
        onClick={onClose}
      />
      <div className="wifi-sheet__panel">
        <div className="wifi-sheet__handle" aria-hidden />
        <p className="wifi-sheet__eyebrow">{ptBR.hub.wifiModalTitle}</p>

        <div className="wifi-sheet__block">
          <p className="wifi-sheet__label">{ptBR.hub.wifiNetwork}</p>
          <p className="wifi-sheet__value font-display">{wifi.ssid}</p>
        </div>

        <div className="wifi-sheet__block">
          <p className="wifi-sheet__label">{ptBR.hub.wifiPassword}</p>
          <div className="wifi-sheet__password-row">
            <p className="wifi-sheet__value font-display">{wifi.password}</p>
            <button
              type="button"
              className="wifi-sheet__copy"
              onClick={async () => {
                await copyText(wifi.password);
                setCopied(true);
              }}
            >
              {copied ? ptBR.hub.wifiCopied : ptBR.hub.wifiCopy}
            </button>
          </div>
        </div>

        <p className="wifi-sheet__hint">{ptBR.hub.wifiHint}</p>

        <button type="button" className="wifi-sheet__close" onClick={onClose}>
          {ptBR.hub.close}
        </button>
      </div>
    </div>,
    document.body,
  );
}
