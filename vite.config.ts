import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const mediaOrigin = env.VITE_MEDIA_ORIGIN?.replace(/\/$/, "") ?? "";

  return {
    plugins: [
      react(),
      {
        name: "html-media-origin",
        transformIndexHtml(html) {
          if (!mediaOrigin) return html;
          const preconnect = `    <link rel="preconnect" href="${mediaOrigin}" crossorigin />\n`;
          let out = html.replace("<head>", `<head>\n${preconnect}`);
          out = out.replace(
            'href="/brand/intro-menu-poster.jpg"',
            `href="${mediaOrigin}/brand/intro-menu-poster.jpg"`,
          );
          out = out.replace(
            'href="/brand/coffee-feelings-logo.png"',
            `href="${mediaOrigin}/brand/coffee-feelings-logo.png"`,
          );
          return out;
        },
      },
    ],
  };
});
