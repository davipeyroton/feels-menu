import { Route, Routes } from "react-router-dom";
import DiscoverPage from "./pages/DiscoverPage";
import { ThemeProvider } from "./theme";
import "./App.css";

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Single route keeps pager state when URL switches between / and /discover. */}
        <Route path="*" element={<DiscoverPage />} />
      </Routes>
    </ThemeProvider>
  );
}
