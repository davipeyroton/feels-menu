import rawSnapshot from "../../data/menu-snapshot.json";
import { priceInBrl, ptBR } from "../i18n/pt-BR";

function decodeHtml(text: string): string {
  return text
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

function normalizeProductMedia(image: string | null, video: string | null) {
  return {
    image: image?.startsWith("/menu/") ? image : null,
    video: video?.startsWith("/menu/") ? video : null,
  };
}

const snapshot = {
  ...rawSnapshot,
  hub: {
    ...rawSnapshot.hub,
    tagline: ptBR.hub.tagline,
  },
  categories: rawSnapshot.categories.map((cat) => ({
    ...cat,
    label: ptBR.categories[cat.id as keyof typeof ptBR.categories] ?? cat.label,
  })),
  slides: rawSnapshot.slides.map((slide) => {
    if (slide.kind !== "product") return slide;
    const description = slide.description
      ? decodeHtml(slide.description)
      : "";
    const tr = ptBR.products[slide.id];
    const media = normalizeProductMedia(slide.image, slide.video);
    return {
      ...slide,
      ...media,
      name: tr?.name ?? slide.name,
      description: tr?.description ?? description,
      price: priceInBrl(slide.price),
    };
  }),
};

export type ProductSlide = {
  kind: "product";
  index: number;
  id: string;
  category: string;
  name: string;
  description: string;
  price: string | null;
  image: string | null;
  video: string | null;
};

export type WelcomeSlide = { kind: "welcome"; index: number };

export type Slide = ProductSlide | WelcomeSlide;

export const menu = snapshot;
export const hub = snapshot.hub;
export const categories = snapshot.categories;
export const slides = snapshot.slides as Slide[];

export function productsByCategory(catId: string): ProductSlide[] {
  return slides.filter(
    (s): s is ProductSlide => s.kind === "product" && s.category === catId,
  );
}

export function firstSlideIndexForCategory(catId: string): number {
  const slide = slides.find(
    (s) => s.kind === "product" && s.category === catId,
  );
  return slide?.index ?? 1;
}

export const allProducts = slides
  .filter((s): s is ProductSlide => s.kind === "product")
  .sort((a, b) => a.index - b.index);

export function categoryLabel(catId: string): string {
  return categories.find((c) => c.id === catId)?.label ?? catId;
}
