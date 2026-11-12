import { Navigate, Route, Routes } from "react-router-dom";
import DiscoverPage from "./pages/DiscoverPage";
import LegacyDiscoverRedirect from "./pages/LegacyDiscoverRedirect";
import { FavoritesProvider } from "./favorites/FavoritesContext";
import { ThemeProvider } from "./theme";
import "./App.css";

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
      <Routes>
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/discover" element={<LegacyDiscoverRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
