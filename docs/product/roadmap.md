# Roadmap

Fonte: [Blueprint v0.5](blueprint-v0.5.md). A [v0.4](blueprint-v0.4.md) permanece como histórico. Critérios de sucesso da V1: seção 16 do blueprint.

CI, proteção de branch e qualquer configuração fora de Markdown ficam para uma execução futura. Esta etapa só documenta.

## Fase 1 — Fundação e documentação

Objetivo: consolidar o blueprint, a arquitetura, os padrões de agentes e o plano de Spec-Driven Development.

Nesta execução entram os documentos em `docs/`, `agents/` e `AGENTS.md`.

Ficam para depois, com aprovação separada:

- `specify init` e arquivos do Spec Kit.
- Quality gates automatizados.
- GitHub Actions, proteção de branch e ambientes.

Conclusão desta execução: documentação aprovada, links válidos e `git status` só com Markdown. Conclusão da fase completa: Spec Kit inicializado e quality gates existentes, sem configurar isso agora.

## Fase 2 — Fundação técnica

Supabase, modelo de dados, autenticação, multi-tenancy, RLS desde a primeira migration, área administrativa e cadastro de restaurante e usuário.

Depende da Fase 1 documental. Não depende do fornecedor OpenDelivery.

Aceite: um usuário cria e acessa um restaurante; teste mostra que outro usuário não lê nem grava dados desse restaurante.

## Fase 3 — Integração e sincronização

Adaptador OpenDelivery V1, importação de todos os menus e serviços, categorias, produtos, ofertas e opções, sync idempotente, histórico, erro e arquivamento.

A validação com o fornecedor do Studios Coffee é pré-requisito da integração real. O adaptador pode ser especificado contra a especificação pública antes disso. A conexão real não começa sem resposta formal. O fornecedor não está validado.

Aceite: reexecução não duplica; item sumido é arquivado; TTL da origem é respeitado; histórico fica registrado.

## Fase 4 — Gestão de experiências

Vários cardápios, seleção de ofertas, categorias próprias e vínculo opcional com a origem, apresentação global e sobrescrita, ordenação independente e regra de disponibilidade (ocultar indisponível na experiência pública).

Depende das Fases 2 e 3 para dados reais. A especificação pode começar com o modelo de domínio.

Aceite: um produto aparece em uma única categoria por cardápio; a ordem de um cardápio não altera o outro; categorias próprias e sincronizadas coexistem.

## Fase 5 — Mídia

Biblioteca por restaurante, upload, armazenamento, versões otimizadas, associação global e por cardápio, preservação do que o restaurante ou o Feels enviou durante o sync.

R2 é recomendação técnica, não decisão fechada de produto. Ver [pipeline de mídia](../operations/media-pipeline.md).

Aceite: sync não substitui mídia `restaurant_upload` nem `feels_content`.

## Fase 6 — Experiência pública

`restaurantSlug`, `menuSlug`, link principal em `/` abrindo o cardápio padrão, hub em `/hub`, migração da experiência atual, responsividade e performance mobile.

A publicação híbrida está aceita. Esta fase a implementa. Ver [ADR 0006](../architecture/decisions/0006-publicacao-versionada.md). A política de dado operacional desatualizado só entra se for aprovada depois.

A migração inclui a remoção da fidelidade simulada. O código atual permanece até essa fase. As rotas conceituais também só mudam nessa spec. Hoje `/` ainda abre o hub.

Aceite: link principal abre o cardápio padrão; indisponível não aparece; a experiência mobile não regride em relação às baselines em `docs/performance/`.

## Fase 7 — Piloto

Conectar o Studios Coffee, sync real, cardápios, mídia, publicação e uso com pessoas reais, antes de expansão comercial.

Depende das fases anteriores e da validação do fornecedor.

Aceite: os 14 critérios da seção 16 do blueprint, incluindo operação de ponta a ponta do piloto.

## Evolução 2 — Inteligência comercial

**PROPOSTA FUTURA.** Analytics de navegação, visualização, tempo de tela, interação, testes A/B, recomendação de posicionamento, sugestão contextual, cardápio por horário e dia, vídeo educativo.

## Evolução 3 — Recompra e relacionamento

**PROPOSTA FUTURA.** Fidelidade de terceiros, Stampay ou Tappi, cadastro de cliente, Apple Wallet e Google Wallet, campanha, segmentação e recompra. Sem plataforma própria de pontos na primeira etapa.

## Dependências

```text
Fase 1 documental -> Fase 2
Fase 2 -> Fases 3, 4 e 5
Validação do fornecedor -> integração real da Fase 3 e piloto da Fase 7
Fases 3 e 4 -> Fase 6
Fase 5 -> Fase 6
Fase 6 e fornecedor validado -> Fase 7
```

A validação do fornecedor pode começar em paralelo à Fase 1. Ela não está concluída.
