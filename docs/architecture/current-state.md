# Estado atual

Verificado no código em 13 de novembro de 2026. Último commit observado: `26f66ad`. Não havia `.specify/` nem `.cursor/`. Este documento descreve o que existe. A direção de produto está no [Blueprint v0.4](../product/blueprint-v0.4.md).

## Stack

Resolvido no `package-lock.json`:

- React 19.3.1 e React DOM 19.3.1.
- React Router DOM 7.18.4.
- Vite 6.4.4 e `@vitejs/plugin-react` 4.7.0.
- TypeScript 5.8.3, `strict`, sem `noEmit` no script de build. `npm run build` é só `vite build` e não falha por erro de tipo.
- Playwright 1.49.1, usado em scripts de auditoria. Não há `@playwright/test`.
- `lucide-react` 1.64.0.

Não há `.nvmrc` nem `engines`.

## Estrutura

- `src/App.tsx`: `/` renderiza `DiscoverPage`; `/discover` redireciona; o restante volta para `/`.
- `src/pages/DiscoverPage.tsx`: hub, reels, feed, perfil, pager e mídia no mesmo módulo.
- `src/App.css`: estilos da experiência, num único arquivo.
- `src/components/`, `src/hooks/`, `src/media/`, `src/lib/`, `src/motion/`, `src/panels/`, `src/i18n/pt-BR.ts`, `src/theme.tsx`, `src/favorites/`, `src/loyalty/`.
- `data/menu-snapshot.json`: dados do cardápio embutidos no build por `src/data/menu.ts`.
- `public/menu` e `public/brand`: imagens e vídeos.
- `scripts/`: snapshot por scraping, auditorias, posters e publicação R2.
- `vercel.json`: rewrite de SPA e cache de `/assets`, `/brand` e `/menu`.
- Não há `.github/`, backend, banco, Supabase nem autenticação.

`src/pages/HubPage.tsx` não é usado por rota. Conflito C14 em [open-decisions.md](../product/open-decisions.md).

## Dados que o snapshot tem

Hub (vídeo, poster, logo, Wi-Fi, link de avaliação no Google), categorias e produtos com `id`, categoria, nome, descrição, preço em texto, imagem, vídeo, poster e indicação vegana. A origem registrada no JSON é `https://francisco.sipfloweb.com/`. Isso não identifica o fornecedor OpenDelivery do Studios Coffee (C13).

## Funcionalidades presentes

- Hub, reels, feed, perfil, favoritos locais, tema e selo vegano por lista fixa. **EXISTE** para um restaurante.
- Fidelidade e cashback. **PARCIAL.** `src/loyalty/guestEnrollment.ts` devolve o próprio cadastro, aceita qualquer código de cinco dígitos e não gera passe. A interface aparece no hub e no perfil. A remoção fica para a migração da experiência pública. O código não muda agora.
- Multi-tenant, usuários, OpenDelivery, vários cardápios, biblioteca e painel. **A CONSTRUIR.**
- Analytics, A/B, fidelidade de terceiros e cardápio por horário. **PROPOSTA FUTURA.**

## Integrações que existem

- Vercel, como hosting estático. A URL citada nas baselines é `https://feels-menu.vercel.app/`.
- Cloudflare R2, por `VITE_MEDIA_ORIGIN` em `.env.production`. O procedimento vigente está em [MEDIA.md](../MEDIA.md).
- Google Fonts, OpenMoji via jsDelivr e link de avaliação no Google.
- Scraping em `scripts/parse-discover.mjs`. Não é o adaptador OpenDelivery.

## Scripts e testes

- `scripts/test_publish_r2_videos.py`: testes do publisher com bucket simulado.
- `audit:mobile`: WebKit e Chromium, iPhone 14 Pro e Pixel 7.
- `audit:reels-baseline` e `audit:r2-headers`.
- `media:posters`, com ffmpeg.
- `scripts/publish-r2-videos.py`: publicação fail-closed, com conferência de hash e `--rollback`. Credenciais só pelo ambiente do shell.

Não há CI, lint, typecheck no build nem teste de componente.

## Lacunas em relação à V1

| Decisão confirmada | Situação no código |
|---|---|
| Showcase sem pedidos | O app já não recebe pedidos |
| Link principal abre o cardápio padrão | Decisão C2 aceita. O código ainda abre o hub em `/` sem `view`. A migração é da spec futura da experiência pública |
| Vários usuários com a mesma permissão | Não há usuário |
| Categorias híbridas | Só categorias do snapshot |
| Um produto por categoria em cada cardápio | Há um único conjunto de categorias |
| Importar indisponível e ocultar na pública | Não há status de disponibilidade |
| Importar todos os menus e serviços | Não há essas entidades |
| Piloto Studios Coffee | A marca atual é Studios Coffee, de um app fixo |
| Backend Supabase | Não há cliente, schema nem RLS |

## Dívidas que afetam a migração

- `DiscoverPage.tsx` e `App.css` concentram a experiência. Quase toda mudança visual passa por eles.
- Marca, título e textos estão fixos em `index.html` e `pt-BR.ts`.
- Favoritos usam uma chave única de `localStorage`.
- O domínio `r2.dev` em `.env.production` é o endereço público atual do bucket de mídia. O bucket exclusivo dos documentos públicos está aceito no [ADR 0015](decisions/0015-armazenamento-distribuicao.md) e ainda não existe. O [ADR 0007](decisions/0007-midia-r2-cdn.md) continua proposta.
- Não há observabilidade de produção além do diagnóstico local de vídeo, ligado por query string.
