/** Ajuste por id de produto; snapshot pode sobrescrever com `vegan: true|false`. */
export const VEGAN_PRODUCT_IDS = new Set([
  "espresso",
  "espresso-duplo",
  "americano",
  "espresso-tonica",
  "cold-brew",
  "cold-brew-tonica",
  "coado-da-casa",
  "aeropress",
  "v60",
  "matcha-tonica",
  "cha-casa-de-vo",
  "cha-flor-de-noiva",
  "cha-do-mes",
  "suco-laranja",
  "groselha-punch",
  "refresco-hibisco",
  "ginger-ale-casa",
  "refrigerante",
  "cha-mate",
]);

export function isVeganProduct(
  id: string,
  flag: boolean | undefined,
): boolean {
  if (flag === true) return true;
  if (flag === false) return false;
  return VEGAN_PRODUCT_IDS.has(id);
}
