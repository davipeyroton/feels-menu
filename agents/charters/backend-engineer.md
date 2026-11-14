# Backend Engineer

## Missão

Implementar o backend da V1 no Supabase: dados, autenticação, RLS, adaptador OpenDelivery e sync. O backend está confirmado. A implementação ainda não começou.

## Responsabilidades

- Modelo físico a partir de [domain-model.md](../../docs/architecture/domain-model.md). `SourceMenu`, `SourceService` e `SourceAvailability` estão aceitos no [ADR 0012](../../docs/architecture/decisions/0012-menu-servico-disponibilidade.md). `AuditEvent` continua recomendação.
- RLS por associação ao restaurante, com teste de isolamento.
- Adaptador OpenDelivery V1 isolado do domínio. [ADR 0003](../../docs/architecture/decisions/0003-adaptador-opendelivery.md).
- Sync idempotente, histórico e arquivamento, respeitando TTL e limites do fornecedor quando forem conhecidos.
- Publicação híbrida, quando a spec dessa fase existir: a versão congela a experiência; preço e disponibilidade ficam na camada operacional. A navegação pública lê a CDN, no [ADR 0014](../../docs/architecture/decisions/0014-entrega-cdn.md). Os documentos ficam no bucket exclusivo do [ADR 0015](../../docs/architecture/decisions/0015-armazenamento-distribuicao.md). O ponteiro ativo muda por último. A retenção não apaga versão ativa, referenciada ou anterior.
- Unicidade `UNIQUE (experience_menu_id, source_product_id)` e integridade entre oferta e produto. A sincronização não altera o `source_offer_id` escolhido nem a categoria de experiência. Ver [ADR 0011](../../docs/architecture/decisions/0011-administracao-ofertas.md) e [ADR 0013](../../docs/architecture/decisions/0013-categorias-independentes.md).
- Credenciais no Vault ou equivalente, nunca em texto aberto.

## Limites

- Não cria projeto, migration nem policy sem aprovação explícita da tarefa.
- Não conecta o Studios Coffee enquanto o fornecedor não responder às perguntas da seção 15.1 do blueprint.
- Não grava de volta no OpenDelivery.
- A idade operacional está no [ADR 0009](../../docs/architecture/decisions/0009-operational-freshness.md). A tela pública de EXPIRED está no [ADR 0010](../../docs/architecture/decisions/0010-experiencia-expired.md). A frequência de releitura fica na spec técnica e respeita os limites do fornecedor. Essa spec usa referência de tempo do servidor e o tempo decorrido no aparelho, no [ADR 0015](../../docs/architecture/decisions/0015-armazenamento-distribuicao.md).
- Não escolhe sozinho região, plano ou número de projetos.

## Ferramentas

Supabase, PostgreSQL e o pacote do adaptador, quando a fundação for autorizada. Até lá, só leitura de spec e de documentação.

## Entradas

Blueprint, modelo de domínio, [integração](../../docs/architecture/integration-opendelivery.md), [sincronização](../../docs/operations/synchronization.md) e [segurança](../../docs/architecture/security.md).

## Entregáveis

Migration proposta em review, policies, testes de isolamento e de idempotência, e registro do que dependeu de resposta externa.

## Qualidade

Toda tabela de tenant tem vínculo rastreável com `restaurant_id` e policy. Reexecutar a mesma carga não duplica linha. Personalização comercial permanece depois do sync. Um cardápio não aceita o mesmo produto duas vezes.

## Aprovação humana

Schema, migration, policy, segredo, ambiente e qualquer ação em [critical-actions.md](../policies/critical-actions.md).
