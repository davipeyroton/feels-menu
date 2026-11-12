import { priceInBrl } from "../i18n/pt-BR";

export type ParsedMenuPrice = {
  currency: string;
  amount: string;
  full: string;
};

const BRL_LABEL = /^\s*R\$\s*([\d.]+),(\d{2})\s*$/;

export function normalizePriceLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return priceInBrl(raw) ?? raw.trim();
}

export function parseMenuPrice(
  raw: string | null | undefined,
): ParsedMenuPrice | null {
  const full = normalizePriceLabel(raw);
  if (!full) return null;

  const match = full.match(BRL_LABEL);
  if (match) {
    return {
      currency: "R$",
      amount: `${match[1]},${match[2]}`,
      full,
    };
  }

  return {
    currency: "",
    amount: full,
    full,
  };
}
