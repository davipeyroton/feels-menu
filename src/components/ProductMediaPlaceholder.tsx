import { hub } from "../data/menu";

export default function ProductMediaPlaceholder({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={["product-media-placeholder", className].filter(Boolean).join(" ")}
      aria-hidden
    >
      <span className="product-media-placeholder__frame">
        <img
          className="product-media-placeholder__logo"
          src={hub.wordmark}
          alt=""
          draggable={false}
          decoding="async"
        />
      </span>
    </span>
  );
}
