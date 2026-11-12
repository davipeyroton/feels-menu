import { categoryLabel, type ProductSlide } from "../data/menu";
import MenuPrice from "./MenuPrice";

export default function FeedGridCaption({
  slide,
  contextCategory = null,
}: {
  slide: ProductSlide;
  /** Toolbar category: matching cells use emphasized label styling. */
  contextCategory?: string | null;
}) {
  const inContext =
    contextCategory != null && slide.category === contextCategory;
  const aside = contextCategory != null && slide.category !== contextCategory;

  return (
    <div className="feed-grid__caption">
      <span
        className={[
          "discover__cat-label",
          "feed-grid__cat-label",
          inContext ? "feed-grid__cat-label--context" : "",
          aside ? "feed-grid__cat-label--aside" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {categoryLabel(slide.category)}
      </span>
      <div className="feed-grid__meta-row">
        <span className="feed-grid__title">{slide.name}</span>
        <MenuPrice label={slide.price} variant="grid" />
      </div>
    </div>
  );
}
