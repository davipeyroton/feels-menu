import type { ProductSlide } from "../data/menu";
import { ptBR } from "../i18n/pt-BR";
import FeedGridCaption from "./FeedGridCaption";
import FeedGridThumb from "./FeedGridThumb";

export default function FeedGridCell({
  slide,
  contextCategory = null,
  flyTarget = false,
  className,
  onSelect,
}: {
  slide: ProductSlide;
  contextCategory?: string | null;
  flyTarget?: boolean;
  className?: string;
  onSelect: (slide: ProductSlide, cell: HTMLButtonElement) => void;
}) {
  return (
    <button
      type="button"
      className={[
        "feed-grid__cell",
        className,
        flyTarget ? "feed-grid__cell--fly-target" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-product-id={slide.id}
      data-category={slide.category}
      onClick={(event) => onSelect(slide, event.currentTarget)}
      aria-label={ptBR.discover.viewProduct(slide.name)}
    >
      <div className="feed-grid__cell-stack">
        <FeedGridThumb slide={slide} />
        <FeedGridCaption slide={slide} contextCategory={contextCategory} />
      </div>
    </button>
  );
}
