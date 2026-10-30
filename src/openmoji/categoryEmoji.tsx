/**
 * Category icons from OpenMoji (CC BY-SA 4.0) — https://openmoji.org
 * Outlined (black) SVGs from jsDelivr; tinted white via CSS on dark UI.
 */
const OPENMOJI_VERSION = "15.1.0";

const categoryEmojiHex: Record<string, string> = {
  quente: "2615",
  gelado: "1F9CA",
  matcha: "1F33F",
  metodos: "2699",
  chas: "1F375",
  comer: "1F35E",
  refrescos: "1F964",
};

function openMojiBlackSvg(hex: string): string {
  return `https://cdn.jsdelivr.net/npm/openmoji@${OPENMOJI_VERSION}/black/svg/${hex}.svg`;
}

export function categoryEmojiSrc(categoryId: string): string | undefined {
  const hex = categoryEmojiHex[categoryId];
  if (!hex) return undefined;
  return openMojiBlackSvg(hex);
}

export const hubOpenMoji = {
  explore: "27A1",
  cashback: "1FA99",
  loyalty: "1F3AB",
} as const;

export function OpenMojiIcon({
  hex,
  size = 22,
  className = "",
}: {
  hex: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={openMojiBlackSvg(hex)}
      alt=""
      width={size}
      height={size}
      decoding="async"
      draggable={false}
    />
  );
}

export function CategoryEmoji({
  categoryId,
  size = 20,
  className = "",
}: {
  categoryId: string;
  size?: number;
  className?: string;
}) {
  const src = categoryEmojiSrc(categoryId);
  if (!src) return null;

  return (
    <img
      className={className}
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
