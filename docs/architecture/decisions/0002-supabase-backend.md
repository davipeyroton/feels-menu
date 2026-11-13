# ADR 0002 — Supabase como backend da V1

- Status: Aceita
- Data: 2026-11-13
- Fonte: [Blueprint v0.4](../../product/blueprint-v0.4.md), seção 8.1 e tabela da seção 4

## Decisão

O backend da V1 é Supabase. Componentes previstos: PostgreSQL, Supabase Auth, RLS, Supabase Cron, Supabase Queues ou mecanismo equivalente, e Vault ou mecanismo seguro equivalente.

## Fora desta decisão

Região, plano, número de projetos por ambiente, runtime do worker e a escolha entre leitura direta do banco ou documento publicado continuam pendentes. Ver [open-decisions.md](../../product/open-decisions.md).

Nenhum projeto Supabase é criado nesta etapa documental.
