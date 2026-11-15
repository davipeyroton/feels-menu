import { Navigate, useSearchParams } from "react-router-dom";

/** Old bookmarks: `/discover` → `/?view=reels`, including `view=feed`. */
export default function LegacyDiscoverRedirect() {
  const [searchParams] = useSearchParams();
  const next = new URLSearchParams(searchParams);
  next.set("view", "reels");
  return <Navigate to={`/?${next.toString()}`} replace />;
}
