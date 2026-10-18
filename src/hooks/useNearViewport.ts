import { useEffect, useState, type RefObject } from "react";

type NearViewportOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
};

export function useNearViewport(
  targetRef: RefObject<Element | null>,
  enabled = true,
  options: NearViewportOptions = {},
): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || !enabled) {
      setNear(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      {
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? "280px 0px",
        threshold: options.threshold ?? 0,
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    enabled,
    options.root,
    options.rootMargin,
    options.threshold,
    targetRef,
  ]);

  return near;
}
