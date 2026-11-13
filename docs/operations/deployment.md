# Deploy e ambientes

Fonte: [Blueprint v0.4](../product/blueprint-v0.4.md), seção 12.3. Esta página não configura CI, Vercel, Supabase nem proteção de branch. Essas atividades ficam para uma execução futura.

## Hoje

O app estático é publicado na Vercel. `vercel.json` define rewrite de SPA e cache de assets. Mídia de produção aponta para R2 pelo procedimento em [MEDIA.md](../MEDIA.md). Não há workflow em `.github/`.

Não foi verificado, a partir do repositório, se o deploy de produção dispara a cada push na branch principal. Tratar isso como desconhecido.

## Ambientes previstos

O blueprint recomenda três ambientes: desenvolvimento, homologação e produção. A quantidade de projetos Supabase e o custo estão pendentes (C11).

Recomendação de uso, ainda não aprovada como topologia fechada:

- Desenvolvimento: máquina local e projeto Supabase de desenvolvimento.
- Homologação: preview da Vercel e projeto Supabase separado.
- Produção: projeto protegido. Mudança exige aprovação explícita do Davi.

## O que não acontece sem aprovação

- Deploy de produção.
- Alteração de variável, domínio, bucket ou dado de produção.
- Migration.
- Merge na branch principal.

Rollback de deploy e da versão de experiência seguem a publicação híbrida aceita no [ADR 0006](../architecture/decisions/0006-publicacao-versionada.md). A política de dado operacional desatualizado não está aceita. O script atual `scripts/publish-r2-videos.py` já tem `--rollback` para os três vídeos que ele publica. Esse script não é o pipeline da biblioteca futura e não deve ser executado sem aprovação.

## Quality gates

Typecheck, build, testes, smoke em WebKit e Chromium, isolamento multi-tenant e sync idempotente são recomendação do blueprint. Testes de publicação e rollback entram somente se a estratégia versionada for adotada. A adoção de `@playwright/test` é mudança explícita de dependência, não feita.
