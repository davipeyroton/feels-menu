import { Navigate, useSearchParams } from "react-router-dom";

/** Old bookmarks: `/discover` → `/?view=reels` or `/?view=feed`. */
export default function LegacyDiscoverRedirect() {
  const [searchParams] = useSearchParams();
  const next = new URLSearchParams(searchParams);
  if (next.get("view") !== "feed") next.set("view", "reels");
  return <Navigate to={`/?${next.toString()}`} replace />;
}
