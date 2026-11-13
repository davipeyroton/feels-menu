# Feels Menu

**Status:** o código em produção hoje é o cardápio de um restaurante (Studios Coffee). A direção do produto é um SaaS multi-restaurante. A referência vigente é o [Blueprint v0.5](docs/product/blueprint-v0.5.md). A [v0.4](docs/product/blueprint-v0.4.md) fica como histórico. Este README descreve como rodar o app atual. Ele não descreve backend, banco nem OpenDelivery, porque isso ainda não existe no código.

Documentação de produto, arquitetura, operação e agentes: [AGENTS.md](AGENTS.md).

**Cardápio digital para o restaurante usar no salão** — o cliente abre no celular (NFC, QR na mesa ou link) e navega pelo menu com uma experiência pensada para mobile: boas-vindas, destaques em vídeo, categorias e produtos com fotos e preços.

Stack atual: Vite + React. Backend previsto para a V1, ainda não implementado: Supabase ([ADR 0002](docs/architecture/decisions/0002-supabase-backend.md)).

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

- `/` — no código atual, a experiência abre no hub quando não há `view`. A decisão aceita, ainda não migrada, é que `/` seja o cardápio padrão e `/hub` seja o hub
- `/discover` — redireciona para a rota atual

O detalhe do que já existe no código está em [docs/architecture/current-state.md](docs/architecture/current-state.md).

## Atualizar o cardápio

Os dados ficam em `data/menu-snapshot.json`. Para regenerar a partir de uma fonte pública configurada no script:

```bash
npm run snapshot
```

Substitua imagens e vídeos pelos assets do seu restaurante quando estiver em produção.
