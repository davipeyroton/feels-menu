# Feels Menu

Cardápio digital (hub, reels e feed) — protótipo Vite + React no monorepo REA.

Dados e fluxo inspirados em [francisco.sipfloweb.com](https://francisco.sipfloweb.com), após análise com REA.

## Evidência

`../francisco-analysis/REA-FINDINGS.md` · `capture-hub.json` · `capture-discover.json`

## Rodar

```bash
cd feels-menu
npm install
npm run dev
```

- `/` — hub (vídeo, Explore Menu, Google Review, Wi-Fi)
- `/discover` — pager: hub → reels → feed (grade / timeline / imersivo)

Atualizar cardápio do site público:

```bash
npm run snapshot
```

## Nota

Mídia (vídeo, fotos) ainda referencia o CDN do site original; troque quando tiver assets próprios.
