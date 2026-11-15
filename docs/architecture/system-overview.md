# Visão geral do sistema

Fonte: [Blueprint v0.5](../product/blueprint-v0.5.md). A [v0.4](../product/blueprint-v0.4.md) permanece como histórico. Decisões confirmadas e recomendações estão separadas. O código de hoje não implementa esta arquitetura. Ver [estado atual](current-state.md).

## Quatro domínios

1. **Identidade e organizações.** Usuário, restaurante, associação, configuração, preferência de publicação e confirmação de ação crítica.
2. **Integrações e catálogo de origem.** Conexão, credencial, sincronização, histórico, erro, produto, categoria, oferta, preço e disponibilidade importados.
3. **Experiência e merchandising.** Apresentação e cardápios criados no Feels, com seleção e ordem próprias.
4. **Mídia.** Arquivos do restaurante, versões otimizadas e o vínculo com a apresentação global ou com um cardápio.

O domínio não conhece o formato do OpenDelivery. Quem traduz é o adaptador. [ADR 0003](decisions/0003-adaptador-opendelivery.md).

## Backend confirmado

Supabase é o backend da V1. [ADR 0002](decisions/0002-supabase-backend.md).

Componentes previstos no blueprint:

- PostgreSQL.
- Supabase Auth.
- RLS para isolamento entre restaurantes.
- Supabase Cron para agendamento.
- Supabase Queues ou mecanismo equivalente para trabalho assíncrono.
- Vault ou mecanismo seguro equivalente para segredos.

Credencial de serviço só no backend. O browser não recebe a chave que ignora RLS.

## Frontend

Recomendação inicial do blueprint, alinhada ao código atual: React, TypeScript, Vite e React Router. A separação entre área administrativa e experiência pública é requisito de arquitetura da V1. A experiência pública evolui de um restaurante fixo para `restaurantSlug` e `menuSlug`.

Não há decisão confirmada de monorepo. A recomendação de detalhamento é um repositório com `apps/public`, `apps/admin`, pacote de domínio, pacote do adaptador e pasta de schema Supabase. Continua [PENDENTE](../product/open-decisions.md).

## Fluxo alvo

```text
Admin (SPA)
  -> API e regras no backend Supabase
  -> PostgreSQL com RLS

Cron
  -> fila
  -> worker de sync
  -> Software Service OpenDelivery (somente leitura)
  -> tabelas Source*
  -> não altera apresentação nem mídia do restaurante

Experiência pública
  -> versão publicada da experiência
  -> dados operacionais mais recentes (preço, disponibilidade, status, arquivamento)
  -> oculta indisponível
  -> link principal em {restaurantSlug}.{domínio}/ abre o cardápio padrão
  -> /hub nesse host é o hub
  -> /{menuSlug} nesse host abre um cardápio específico
```

A publicação híbrida está aceita ([ADR 0006](decisions/0006-publicacao-versionada.md)). Preço e disponibilidade não exigem republicação. O código atual ainda não segue essas rotas.

A versão publicada chega por CDN, sem consulta ao banco a cada navegação. Quatro documentos: identidade, versão imutável, ponteiro ativo e projeção operacional. A CDN não decide freshness nem altera preço. Detalhe no [ADR 0014](decisions/0014-entrega-cdn.md). O bucket exclusivo no R2, a CDN da Cloudflare, o host por restaurante e a retenção estão no [ADR 0015](decisions/0015-armazenamento-distribuicao.md). O consumo dos documentos está no [ADR 0016](decisions/0016-consumo-documentos-publicos.md). A leitura pública, o cache e o CORS estão no [ADR 0017](decisions/0017-leitura-publica-cache-cors.md). O nome do domínio continua pendente. O [ADR 0007](decisions/0007-midia-r2-cdn.md) continua proposta.

O snapshot operacional segue a freshness aceita: idade desde a última sincronização bem-sucedida e válida, até `2 × effective_sync_interval`. TTL acima de uma hora não cria outro teto. Ver [operational-freshness.md](../operations/operational-freshness.md). A tela pública de EXPIRED está no [ADR 0010](decisions/0010-experiencia-expired.md). A escolha de oferta no painel está no [ADR 0011](decisions/0011-administracao-ofertas.md): o preço público é o `value` da oferta escolhida, e a sincronização não troca essa escolha. Menu, serviço e janela de horário da origem estão no [ADR 0012](decisions/0012-menu-servico-disponibilidade.md). O horário não comanda a experiência pública da V1. A origem da categoria de experiência é derivada pelos produtos, no [ADR 0013](decisions/0013-categorias-independentes.md).

## Mídia

Manter Cloudflare R2 é recomendação. O app atual já usa R2 para arquivos estáticos. A biblioteca por restaurante, upload assinado, CDN com domínio próprio e processamento assíncrono ainda não existem. Ver [pipeline de mídia](../operations/media-pipeline.md).

## Ambientes

O blueprint recomenda desenvolvimento, homologação e produção. Quantidade de projetos Supabase e custo estão pendentes (C11). Produção só muda com aprovação explícita. Esta documentação não cria projeto, variável nem deploy.

## O que esta visão não inclui na V1

Pedidos, checkout, escrita de volta ao OpenDelivery, fidelidade própria, analytics e cardápio por horário. Evoluções: [roadmap](../product/roadmap.md).
