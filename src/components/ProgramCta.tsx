import { ChevronRight, Stamp } from "lucide-react";
import { ptBR } from "../i18n/pt-BR";

export default function ProgramCta({
  variant = "hub",
  onClick,
  sheetOpen = false,
}: {
  variant?: "hub" | "profile";
  onClick: () => void;
  sheetOpen?: boolean;
}) {
  const title = ptBR.hub.programHubTitle;
  const hint = ptBR.hub.programHubHint;
  const ariaLabel = ptBR.hub.programHubAria;

  return (
    <button
      type="button"
      className={`program-cta program-cta--${variant}`}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={sheetOpen}
      aria-label={ariaLabel}
    >
      <span className="program-cta__icon" aria-hidden>
        <Stamp size={22} strokeWidth={1.65} aria-hidden />
      </span>
      <span className="program-cta__copy">
        <span className="program-cta__title">{title}</span>
        <span className="program-cta__hint">{hint}</span>
      </span>
      {variant === "profile" ? (
        <ChevronRight
          className="program-cta__chevron"
          size={20}
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
    </button>
  );
}
