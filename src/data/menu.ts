import rawSnapshot from "../../data/menu-snapshot.json";
import {
  resolveBrandAsset,
  resolveProductImage,
  resolveProductVideo,
} from "../lib/mediaUrl";
import { defaultVideoPosterPath } from "../lib/productReelPoster";
import { priceInBrl, ptBR } from "../i18n/pt-BR";
import { isVeganProduct } from "./veganProducts";

type RawProductSlide = {
  kind: "product";
  index: number;
  id: string;
  category: string;
  name: string;
  description: string;
  price: string | null;
  image: string | null;
  video: string | null;
  videoPoster?: string | null;
  vegan?: boolean;
};

function decodeHtml(text: string): string {
  return text
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

function normalizeProductMedia(
  image: string | null,
  video: string | null,
  videoPoster?: string | null,
) {
  const resolvedVideo = resolveProductVideo(video);
  const posterPath =
    videoPoster?.trim() ||
    (video ? defaultVideoPosterPath(video) : null) ||
    null;
  return {
    image: resolveProductImage(image),
    video: resolvedVideo,
    videoPoster: resolvedVideo
      ? resolveProductImage(posterPath)
      : resolveProductImage(videoPoster ?? null),
  };
}

const snapshot = {
  ...rawSnapshot,
  hub: {
    ...rawSnapshot.hub,
    tagline: ptBR.hub.tagline,
    video: resolveBrandAsset(rawSnapshot.hub.video),
    poster: resolveBrandAsset(rawSnapshot.hub.poster),
    wordmark: resolveBrandAsset(rawSnapshot.hub.wordmark),
  },
  categories: rawSnapshot.categories.map((cat) => ({
    ...cat,
    label: ptBR.categories[cat.id as keyof typeof ptBR.categories] ?? cat.label,
  })),
  slides: rawSnapshot.slides.map((slide) => {
    if (slide.kind !== "product") return slide;
    const product = slide as RawProductSlide;
    const description = product.description
      ? decodeHtml(product.description)
      : "";
    const tr = ptBR.products[product.id];
    const media = normalizeProductMedia(
      product.image,
      product.video,
      product.videoPoster,
    );
    return {
      ...product,
      ...media,
      name: tr?.name ?? product.name,
      description: tr?.description ?? description,
      price: priceInBrl(product.price),
      vegan: isVeganProduct(product.id, product.vegan),
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
  /** Frame extracted from `video` (reels); grid still uses `image`. */
  videoPoster: string | null;
  vegan: boolean;
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
