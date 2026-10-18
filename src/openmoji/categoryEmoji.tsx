/**
 * Category icons from OpenMoji (CC BY-SA 4.0) — https://openmoji.org
 * Outlined (black) SVGs from jsDelivr; tinted white via CSS on dark UI.
 */
const OPENMOJI_VERSION = "15.1.0";

const categoryEmojiHex: Record<string, string> = {
  focaccias: "1F35E",
  specials: "2728",
  coffee: "2615",
  cold: "1F9CA",
  "no-coffee": "1F375",
  drinks: "1F964",
};

function openMojiBlackSvg(hex: string): string {
  return `https://cdn.jsdelivr.net/npm/openmoji@${OPENMOJI_VERSION}/black/svg/${hex}.svg`;
}

export function categoryEmojiSrc(categoryId: string): string | undefined {
  const hex = categoryEmojiHex[categoryId];
  if (!hex) return undefined;
  return openMojiBlackSvg(hex);
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
