import { ChevronRight } from "lucide-react";
import { HubLoyaltyIcon } from "./icons";
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
  const title =
    variant === "hub" ? ptBR.hub.programHubTitle : ptBR.hub.programUnified;
  const hint =
    variant === "hub" ? ptBR.hub.programHubHint : ptBR.hub.programUnifiedHint;
  const ariaLabel =
    variant === "hub"
      ? ptBR.hub.programHubAria
      : ptBR.hub.programUnifiedAria;

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
        <HubLoyaltyIcon size={22} />
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
