# Modelo de domínio

Referência para a modelagem física no PostgreSQL. Fonte vigente: [Blueprint v0.5](../product/blueprint-v0.5.md). A [v0.4](../product/blueprint-v0.4.md) permanece como histórico. Não há migration. Entidade marcada como recomendada não é decisão confirmada.

Toda entidade de restaurante tem `restaurant_id` próprio ou alcançável por relação controlada. Isolamento: [security.md](security.md).

## Identidade

### User

Identidade de quem administra a plataforma. Autenticação prevista: Supabase Auth. O blueprint não fixa e-mail, magic link nem OAuth. Isso está pendente.

### Restaurant

Restaurante dentro do Feels. Dono das conexões, cardápios, apresentações e da biblioteca de mídia.

### RestaurantMembership

Liga usuário e restaurante.

Campos citados no blueprint: `restaurant_id`, `user_id`, `status`, `created_at`.

Regra confirmada: na V1 todos os membros têm o mesmo nível funcional de permissão. Ações críticas exigem confirmação explícita e continuam sujeitas a autenticação e autorização.

Um usuário administra vários restaurantes. Um restaurante tem vários usuários.

## Integração

### IntegrationConnection

Conexão do restaurante com um sistema externo.

Campos sugeridos: `id`, `restaurant_id`, `provider`, `external_merchant_id`, `credentials_reference`, `integration_version`, `status`, `last_sync_at`, `created_at`, `updated_at`.

`credentials_reference` aponta para o cofre. O segredo não fica na linha em texto aberto. `provider` isola o OpenDelivery de integrações futuras.

### SyncRun

Uma execução de sincronização.

Campos sugeridos: `id`, `integration_connection_id`, `started_at`, `completed_at`, `status`, `source_last_update`, `records_processed`, `records_created`, `records_updated`, `records_archived`, `error_summary`.

### SyncIssue

Problema de uma execução.

Campos sugeridos: `id`, `sync_run_id`, `entity_type`, `external_id`, `severity`, `message`, `resolved_at`.

## Catálogo de origem

Identidade única recomendada para registro importado: conexão, tipo de entidade e identificador externo. O código externo do PDV, quando o protocolo enviar, fica guardado para reconciliação. A estabilidade desses identificadores no fornecedor do piloto **não foi validada**.

### SourceMenu

Menu recebido da origem. Distinto de `ExperienceMenu`. Campos documentados: `id`, `name` e `externalCode`. Aceito na C5. Ver [ADR 0012](decisions/0012-menu-servico-disponibilidade.md).

### SourceService

Serviço recebido da origem. Tipos documentados: `DELIVERY` e `TAKEOUT`. Aponta um `SourceMenu` por `menuId`. Mais de um serviço pode apontar o mesmo menu. A especificação consultada não documenta id próprio de serviço. O Feels não inventa esse id. A chave persistente, se for composta, depende de validação com o fornecedor.

### SourceCategory

Categoria recebida do sistema externo. Pertence a um `SourceMenu`. Permanece para sincronização e rastreabilidade, mesmo quando o cardápio de experiência não a usa.

### SourceProduct

Produto original (`Item` no OpenDelivery): nome, descrição, imagem e demais atributos do item. Não carrega o preço de uma oferta.

### SourceOffer

Oferta do produto. Preço, disponibilidade, categoria e índice podem variar por menu ou serviço de origem.

**Decisão aceita (C4):** várias ofertas do mesmo produto são importadas. Cada cardápio seleciona uma. `ExperienceProduct` referencia `source_offer_id`. Ver [ADR 0005](decisions/0005-experience-product-source-offer.md). A administração no painel está no [ADR 0011](decisions/0011-administracao-ofertas.md): a sincronização não troca a oferta escolhida. O preço público é o `value`. `originalValue` fica na oferta e não implica preço riscado.

### SourceOptionGroup e SourceOption

Grupos e opções como o fornecedor enviou. Preservam identificador externo e dados originais. O quanto disso aparece na V1 visual está pendente.

### SourceAvailability

Janelas de datas e horários da origem. Associadas à categoria ou à oferta. O status `AVAILABLE` ou `UNAVAILABLE` fica no registro dono e não representa horário de funcionamento. As janelas não comandam a experiência pública da V1. Reconciliação e arquivamento dessas janelas dependem dos campos reais do fornecedor. Ver [ADR 0012](decisions/0012-menu-servico-disponibilidade.md).

## Experiência

### ProductPresentation

Apresentação global do produto: título comercial, descrição comercial, imagem principal, vídeo e elementos visuais. Não guarda preço nem disponibilidade.

### ExperienceMenu

Cardápio criado no Feels.

Campos sugeridos: `id`, `restaurant_id`, `name`, `slug`, `is_default`, `status`.

Regra confirmada (C2 e [ADR 0015](decisions/0015-armazenamento-distribuicao.md)): existe um cardápio padrão. O restaurante é o host `{restaurantSlug}.{domínio}`. O link principal abre esse cardápio em `/`. O hub fica em `/hub`. Outro cardápio abre em `/{menuSlug}`. O nome do domínio continua pendente.

O cardápio aponta a versão ativa da camada de experiência. A data de publicação fica nessa versão (C7, consequência da C3). O código atual ainda não tem essas rotas.

### ExperienceCategory

Categoria comercial dentro de um cardápio. Independente de `SourceCategory`. Não possui `source_category_id` nem `origin_type`.

Campos: `id`, `experience_menu_id`, `name`, `position`.

Regras aceitas. Ver [ADR 0004](decisions/0004-categorias-hibridas.md) e [ADR 0013](decisions/0013-categorias-independentes.md):

- Categorias próprias continuam permitidas.
- Um produto aparece em uma categoria por cardápio.
- A origem é derivada: `ExperienceCategory → ExperienceProduct → SourceOffer → SourceCategory`.
- Uma origem, várias origens distintas ou origem vazia dependem dos produtos colocados.
- A sincronização não altera nome, ordem nem composição.
- Origem arquivada permanece no histórico. O painel calcula o aviso quando algum produto ainda aponta para essa origem. A categoria e os produtos permanecem. O público segue a oferta escolhida.

### ExperienceProduct

Presença de uma oferta num cardápio.

Campos: `id`, `experience_menu_id`, `experience_category_id`, `source_offer_id`, `source_product_id`, `position`, `visibility`, `presentation_override`, `created_at`, `updated_at`.

Regras aceitas (C4):

- Unicidade: `UNIQUE (experience_menu_id, source_product_id)`.
- `source_offer_id` é a oferta escolhida para aquele produto naquele cardápio.
- `source_product_id` deriva dessa oferta ou permanece consistente. A integridade referencial impede os dois valores divergirem.
- O mesmo produto pode aparecer em outro cardápio, em outra categoria, com outra oferta e com outra ordem.
- Exemplo: Cappuccino Delivery a R$ 15 e Cappuccino Takeout a R$ 13 ficam na origem. Um cardápio escolhe uma.
- Com uma oferta, a seleção pode ser automática e o `source_offer_id` fica persistido. Com várias, a inclusão naquele cardápio espera a escolha.
- `presentation_override` não altera dado operacional.
- Recomendação C6, pendente: esse campo guarda só título e descrição; mídia vai para `MediaAssignment`.
- Oferta escolhida indisponível ou arquivada oculta o produto na experiência pública daquele cardápio. Outra oferta não a substitui. O registro de experiência não é apagado pela sincronização. No arquivamento, o administrador pode escolher outra oferta ou retirar o produto. O registro arquivado permanece. Ver [ADR 0011](decisions/0011-administracao-ofertas.md).

Precedência de apresentação, recomendada para o detalhamento: sobrescrita do cardápio, depois apresentação global, depois valor de origem. O sync escreve nas tabelas de origem e não nas de apresentação.

## Mídia

### MediaAsset

Arquivo da biblioteca do restaurante. Origem do conteúdo:

- `source`: veio do sistema de origem.
- `restaurant_upload`: o restaurante enviou.
- `feels_content`: o Feels disponibilizou.

A sincronização não sobrescreve mídia criada ou enviada pelo restaurante ou pelo Feels.

`feels_content` reutilizado por vários restaurantes não tem dono único. Conflito C8, pendente: catálogo global somente leitura e atribuição por restaurante.

### MediaRendition

Versão derivada do original: miniatura, imagem otimizada, vídeo otimizado, outras resoluções. O original permanece.

### MediaAssignment

Liga mídia a produto e contexto. Permite configuração global e sobrescrita por cardápio.

## Entidades da publicação híbrida

Aceitas com a C3. Ver [ADR 0006](decisions/0006-publicacao-versionada.md).

- Versão da camada de experiência: congela seleção, categorias, ordenação, títulos comerciais, descrições comerciais, imagens, vídeos e configurações visuais. O cardápio aponta a versão ativa. A entrega pública dessa versão está no [ADR 0014](decisions/0014-entrega-cdn.md). O armazenamento, a CDN e a retenção estão no [ADR 0015](decisions/0015-armazenamento-distribuicao.md).
- Camada operacional: preço, disponibilidade, status e arquivamento, atualizados pela sincronização. Não fazem parte do que a publicação congela. A experiência pública usa o último snapshot completo e válido enquanto a idade, contada da última sincronização bem-sucedida e válida, não passa de `2 × effective_sync_interval`. Estados: FRESH, STALE e EXPIRED. Ver [ADR 0009](decisions/0009-operational-freshness.md). Em EXPIRED, as rotas de cardápio seguem o [ADR 0010](decisions/0010-experiencia-expired.md).

`AuditEvent` continua recomendação, não decisão. `SourceMenu`, `SourceService` e `SourceAvailability` estão aceitos no [ADR 0012](decisions/0012-menu-servico-disponibilidade.md).

## Relações

```mermaid
erDiagram
    User ||--o{ RestaurantMembership : has
    Restaurant ||--o{ RestaurantMembership : has
    Restaurant ||--o{ IntegrationConnection : connects
    IntegrationConnection ||--o{ SyncRun : runs
    SyncRun ||--o{ SyncIssue : logs
    IntegrationConnection ||--o{ SourceMenu : imports
    IntegrationConnection ||--o{ SourceService : imports
    SourceService }o--|| SourceMenu : menuId
    SourceMenu ||--o{ SourceCategory : contains
    IntegrationConnection ||--o{ SourceProduct : imports
    SourceCategory ||--o{ SourceOffer : lists
    SourceProduct ||--o{ SourceOffer : offeredAs
    SourceCategory ||--o{ SourceAvailability : hours
    SourceOffer ||--o{ SourceAvailability : hours
    Restaurant ||--o{ ProductPresentation : owns
    SourceProduct ||--o| ProductPresentation : globalLook
    Restaurant ||--o{ ExperienceMenu : owns
    ExperienceMenu ||--o{ ExperienceCategory : orders
    ExperienceMenu ||--o{ ExperienceVersion : publishes
    ExperienceCategory ||--o{ ExperienceProduct : orders
    SourceProduct ||--o{ ExperienceProduct : oncePerMenu
    SourceOffer ||--o{ ExperienceProduct : selectedOffer
    Restaurant ||--o{ MediaAsset : owns
    MediaAsset ||--o{ MediaRendition : derives
    MediaAsset ||--o{ MediaAssignment : usedIn
```

`ExperienceProduct` referencia a oferta selecionada e o produto derivado dela. A unicidade é por cardápio e produto (C4). A origem da categoria de experiência é derivada por essa oferta. Ver [ADR 0013](decisions/0013-categorias-independentes.md). A versão da experiência é a camada congelada (C3). Preço e disponibilidade não entram nessa versão.

## Regras de negócio

1. Preço e disponibilidade vêm da origem. O Feels não os edita e não os envia de volta.
2. Indisponível é importado e não aparece na experiência pública. Se a oferta escolhida estiver indisponível, o produto fica oculto naquele cardápio mesmo que outra oferta do mesmo produto esteja disponível. Janela de horário não comanda essa exibição na V1.
3. Ausência num snapshot completo e válido arquiva menu, serviço, categoria, produto e oferta de origem. Não há exclusão física. Carga parcial ou inválida não arquiva. A janela de horário só entra nessa regra quando os campos reais permitirem reconciliação.
4. Arquivar preserva histórico, mídia, apresentação e referências de cardápio. A sincronização não troca o `source_offer_id`.
5. Sync é idempotente: repetir não duplica e não apaga personalização comercial.
6. Um produto aparece uma vez por cardápio, na oferta selecionada. A restrição é `UNIQUE (experience_menu_id, source_product_id)`.
7. Cardápios do mesmo restaurante não compartilham ordem nem seleção.
8. Mídia `restaurant_upload` e `feels_content` sobrevive ao sync.
9. Credencial não fica em texto aberto.
10. Ação crítica pede confirmação explícita, além de autenticação e autorização.
