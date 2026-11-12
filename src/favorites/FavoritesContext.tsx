import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "feels-menu-favorites";

function readIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

let cache = readIds();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist(next: Set<string>) {
  cache = new Set(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...cache]));
  emit();
}

type FavoritesContextValue = {
  favoriteIds: Set<string>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSnapshot() {
  return cache;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favoriteIds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback((productId: string) => {
    const next = new Set(cache);
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    persist(next);
  }, []);

  const value = useMemo(
    () => ({ favoriteIds, isFavorite, toggleFavorite }),
    [favoriteIds, isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
