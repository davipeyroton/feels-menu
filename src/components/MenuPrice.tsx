import { parseMenuPrice } from "../lib/formatPrice";
import { ptBR } from "../i18n/pt-BR";

export type MenuPriceVariant = "reel" | "feed" | "grid";

type MenuPriceProps = {
  label: string | null | undefined;
  variant: MenuPriceVariant;
  className?: string;
};

export default function MenuPrice({ label, variant, className }: MenuPriceProps) {
  const parsed = parseMenuPrice(label);
  if (!parsed) return null;

  return (
    <span
      className={[
        "menu-price",
        `menu-price--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ptBR.discover.priceAria(parsed.full)}
    >
      {parsed.currency.length > 0 ? (
        <>
          <span className="menu-price__currency" aria-hidden>
            {parsed.currency}
          </span>
          <span className="menu-price__amount" aria-hidden>
            {parsed.amount}
          </span>
        </>
      ) : (
        <span className="menu-price__amount" aria-hidden>
          {parsed.amount}
        </span>
      )}
    </span>
  );
}
