# Feels Menu

**Cardápio digital para o restaurante usar no salão** — o cliente abre no celular (QR na mesa ou link) e navega pelo menu com uma experiência pensada para mobile: boas-vindas, destaques em vídeo, categorias e produtos com fotos e preços.

Stack: Vite + React.

## O que o cliente vê

- **Hub** — vídeo de capa, acesso ao cardápio, avaliação no Google e Wi‑Fi do estabelecimento
- **Reels** — produtos em tela cheia, por categoria
- **Feed** — grade e timeline; modo imersivo para explorar itens

Tema claro/escuro no feed.

## Rodar localmente

```bash
npm install
npm run dev
```

- `/` — hub
- `/discover` — cardápio (hub → reels → feed)

## Atualizar o cardápio

Os dados ficam em `data/menu-snapshot.json`. Para regenerar a partir de uma fonte pública configurada no script:

```bash
npm run snapshot
```

Substitua imagens e vídeos pelos assets do seu restaurante quando estiver em produção.
