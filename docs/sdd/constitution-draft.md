# Rascunho de constituição

Status: rascunho para uma futura invocação de `/speckit-constitution`. O Spec Kit não foi inicializado. Não existe `.specify/memory/constitution.md`.

A parte A reproduz princípios confirmados do [Blueprint v0.5](../product/blueprint-v0.5.md). A [v0.4](../product/blueprint-v0.4.md) permanece como histórico. A parte B é proposta de engenharia para a constituição do Spec Kit e não está confirmada como decisão de produto.

## Parte A — vigente para agentes

1. A origem administra a operação. O Feels administra a experiência.
2. O Feels não envia alteração operacional ao OpenDelivery e não é a fonte da verdade de preço e disponibilidade.
3. A V1 é showcase. Não há pedido, checkout nem fidelidade própria.
4. Multi-tenancy desde a fundação. Dados de restaurantes diferentes não se misturam. RLS é o mecanismo previsto. Credencial de serviço fica no backend.
5. Vários cardápios por restaurante, com seleção, ordem e apresentação independentes. Um produto aparece em uma categoria por cardápio. A origem dessa categoria é derivada pelos produtos, no [ADR 0013](../architecture/decisions/0013-categorias-independentes.md).
6. O link principal abre o cardápio padrão em `/` no host `{restaurantSlug}.{domínio}`. O hub fica em `/hub`. Um cardápio específico abre em `/{menuSlug}`. O nome do domínio continua pendente. Ver [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md). O código atual ainda não faz isso.
7. A publicação é híbrida. A versão congela seleção, categorias, ordem, textos comerciais, imagens, vídeos e configuração visual. Preço, disponibilidade, status e arquivamento vêm da sincronização e não exigem republicação.
8. Um produto aparece uma vez por cardápio, na oferta selecionada. A unicidade é `UNIQUE (experience_menu_id, source_product_id)`, com `source_offer_id` consistente. A sincronização não troca essa oferta. A administração está no [ADR 0011](../architecture/decisions/0011-administracao-ofertas.md).
9. Indisponíveis são importados e ficam ocultos na experiência pública.
10. Todos os menus e serviços da origem são importados como `SourceMenu` e `SourceService`. As janelas de horário ficam em `SourceAvailability` e não comandam a experiência pública da V1. Ver [ADR 0012](../architecture/decisions/0012-menu-servico-disponibilidade.md).
11. Todos os membros do restaurante têm a mesma permissão funcional. Ação crítica exige confirmação explícita, além de autenticação e autorização.
12. Credenciais não ficam em texto aberto.
13. Registro ausente num snapshot completo é arquivado, não apagado.
14. O sync não sobrescreve personalização comercial nem mídia do restaurante ou do Feels.
15. A experiência pública é mobile-first. Componentes atuais permanecem quando forem compatíveis com multi-restaurante.
16. O fornecedor OpenDelivery do Studios Coffee não está validado. Não tratar integração real como desbloqueada.
17. O snapshot operacional público vale até `2 × effective_sync_interval`. O intervalo efetivo é `max(15 minutos, TTL informado)`. TTL acima de uma hora não cria outro teto. A idade conta da última sincronização bem-sucedida e válida. Em EXPIRED, as rotas de cardápio seguem o [ADR 0010](../architecture/decisions/0010-experiencia-expired.md): nome, logotipo e indisponibilidade temporária, sem preço nem disponibilidade antigos.

Produção, credencial, migration, merge e deploy exigem aprovação explícita do Davi. Isso é regra operacional dos agentes, em [ações críticas](../../agents/policies/critical-actions.md). Não é uma decisão de produto além das ações críticas já confirmadas no blueprint.

## Parte B — proposta para o Spec Kit

Estas regras orientam o rascunho. Entram na constituição gerada só depois de aprovação na etapa de `specify init`, que não ocorre agora.

- Mudança pequena, reversível e com spec.
- Arquivo novo de implementação não cresce sem justificativa no plano. `DiscoverPage.tsx` e `App.css` são candidatos a divisão, não a mais concentração.
- Cada interpretação tem um dono. O adaptador traduz o protocolo; o domínio não relê o payload.
- Falha de cadastro ou de sync não fica silenciosa. Stub precisa ser identificável.
- Toda feature de produção define o que é medido e onde o erro aparece.
- Critério de aceite do spec tem verificação nomeada.
- Mudança de mídia ou navegação da experiência pública é verificada em WebKit e Chromium.
- Regressão de performance da experiência pública é tratada como defeito. Comparar com `docs/performance/` quando a mudança tocar vídeo, feed ou reels.
- Tarefa concluída leva evidência: comando, saída e, se a tela mudou, verificação visual.
- Quality gates automatizados são recomendados e ainda não existem. Não declarar a tarefa pronta por ausência de CI.

## Fora da constituição até decisão

Publicação híbrida, uma oferta por produto no cardápio, a administração dessas ofertas, menu e serviço de origem, categorias independentes, a entrega por CDN, o armazenamento desses documentos, o consumo deles, a leitura pública com cache e CORS, as rotas no host do restaurante, a freshness operacional e a experiência pública de EXPIRED estão aceitas. R2 como destino permanente da biblioteca continua proposta. Ver ADRs [0004](../architecture/decisions/0004-categorias-hibridas.md), [0005](../architecture/decisions/0005-experience-product-source-offer.md), [0006](../architecture/decisions/0006-publicacao-versionada.md), [0007](../architecture/decisions/0007-midia-r2-cdn.md), [0009](../architecture/decisions/0009-operational-freshness.md), [0010](../architecture/decisions/0010-experiencia-expired.md), [0011](../architecture/decisions/0011-administracao-ofertas.md), [0012](../architecture/decisions/0012-menu-servico-disponibilidade.md), [0013](../architecture/decisions/0013-categorias-independentes.md), [0014](../architecture/decisions/0014-entrega-cdn.md), [0015](../architecture/decisions/0015-armazenamento-distribuicao.md), [0016](../architecture/decisions/0016-consumo-documentos-publicos.md) e [0017](../architecture/decisions/0017-leitura-publica-cache-cors.md). `AuditEvent` continua recomendação.
