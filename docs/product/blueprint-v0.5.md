<!-- Referência vigente. Incorpora o Blueprint v0.4 e as decisões C2, C3 e C4 aprovadas pelo fundador em 13 de novembro de 2026. O texto da v0.4 permanece em blueprint-v0.4.md. -->

# Feels Menu — Product & Technical Blueprint

**Versão:** 0.5
**Status:** Referência vigente
**Substitui:** [Blueprint v0.4](blueprint-v0.4.md), preservado como histórico
**Produto:** Feels Menu
**Piloto:** Studios Coffee
**Backend:** Supabase
**Integração inicial:** OpenDelivery

## O que mudou em relação à v0.4

Aprovado pelo fundador em 13 de novembro de 2026:

- **C2.** O link principal abre o cardápio padrão. Rotas conceituais: `/` cardápio padrão, `/hub` hub, `/:restaurantSlug/:menuSlug` cardápio específico. O código atual ainda não faz isso.
- **C3.** Publicação híbrida: camada de experiência versionada e camada operacional atualizada pela sincronização.
- **Freshness.** Aprovada pelo fundador em 13 de novembro de 2026, depois de C2, C3 e C4. O último snapshot operacional válido vale até `2 × effective_sync_interval`, com `effective_sync_interval = max(15 minutos, TTL informado)`. TTL acima de uma hora não cria outro teto. Detalhe no [ADR 0009](../architecture/decisions/0009-operational-freshness.md).
- **Experiência EXPIRED.** Aprovada pelo fundador em 13 de novembro de 2026. Nas rotas de cardápio, o estado EXPIRED substitui o cardápio por nome, logotipo e a mensagem de indisponibilidade temporária, com o botão "Tentar de novo". Detalhe no [ADR 0010](../architecture/decisions/0010-experiencia-expired.md).
- **C4.** Um produto aparece uma vez por cardápio. Várias ofertas podem existir na origem; o cardápio escolhe uma. Unicidade: `UNIQUE (experience_menu_id, source_product_id)`. `ExperienceProduct` referencia `source_offer_id`.
- **Ofertas no painel.** Aprovada pelo fundador em 13 de novembro de 2026. Uma oferta por aparição, escolha explícita quando há várias, sincronização sem trocar a oferta escolhida. Detalhe no [ADR 0011](../architecture/decisions/0011-administracao-ofertas.md).
- **C5.** Aprovada pelo fundador em 13 de novembro de 2026. `SourceMenu`, `SourceService` e `SourceAvailability` representam menu, serviço e janelas de horário da origem. O horário não comanda a experiência pública da V1. Detalhe no [ADR 0012](../architecture/decisions/0012-menu-servico-disponibilidade.md).
- **Categorias independentes.** Aprovada pelo fundador em 13 de novembro de 2026. A origem da categoria de experiência é derivada pelos produtos. Não há `source_category_id`. Detalhe no [ADR 0013](../architecture/decisions/0013-categorias-independentes.md).
- **Entrega por CDN.** Aprovada pelo fundador em 14 de novembro de 2026. A navegação pública lê quatro documentos na CDN e não consulta o banco. Detalhe no [ADR 0014](../architecture/decisions/0014-entrega-cdn.md).
- **Armazenamento e distribuição.** Aprovada pelo fundador em 14 de novembro de 2026. Bucket R2 exclusivo, CDN Cloudflare, subdomínio por restaurante e retenção de 90 dias ou 10 versões. O nome do domínio continua pendente. O ADR 0007 continua proposta. Detalhe no [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md).

O restante deste documento reproduz a v0.4, com as decisões desta lista no lugar das recomendações que elas substituíram.

---

# 1. Visão do produto

O Feels Menu é uma plataforma SaaS multi-restaurante que transforma cardápios operacionais existentes em experiências digitais visuais, envolventes e orientadas à conversão.

O produto não pretende substituir sistemas de gestão, PDVs ou plataformas de delivery. Seu papel é atuar como uma camada de experiência e merchandising sobre os dados operacionais já existentes.

A proposta é permitir que restaurantes apresentem seus produtos de maneira mais atraente, organizem diferentes experiências comerciais e evoluam a forma como seus clientes descobrem e consomem seus produtos.

## 1.1 Posicionamento

**O sistema de origem administra o cardápio operacional. O Feels administra a experiência comercial.**

O Feels deve:

- Conectar-se a sistemas de cardápio existentes.
- Importar e sincronizar produtos, categorias, preços e disponibilidade.
- Permitir a criação de múltiplos cardápios digitais.
- Personalizar a apresentação visual dos produtos.
- Permitir organização e ordenação independente por cardápio.
- Entregar uma experiência pública otimizada para dispositivos móveis.

O Feels não deve:

- Substituir o sistema de gestão do restaurante.
- Tornar-se a fonte da verdade de preços e disponibilidade.
- Enviar alterações operacionais de volta ao OpenDelivery.
- Gerenciar pedidos na primeira versão.
- Criar um sistema próprio de fidelidade na primeira versão.

---

# 2. Princípios fundamentais

### 2.1 Fonte da verdade operacional

Os sistemas externos são responsáveis pelos dados operacionais.

O OpenDelivery será a primeira integração, funcionando como fonte de dados para produtos, categorias, ofertas, preços, disponibilidade e demais informações disponíveis no protocolo.

O Feels mantém uma representação interna sincronizada desses dados.

### 2.2 Separação entre operação e apresentação

O Feels poderá modificar a apresentação comercial sem alterar os dados operacionais de origem.

Exemplos de campos controlados pelo Feels:

- Imagens e vídeos.
- Títulos comerciais.
- Descrições comerciais.
- Organização visual.
- Ordenação dos produtos.
- Destaques e elementos de apresentação.

### 2.3 Multi-tenancy desde a fundação

A arquitetura deve suportar múltiplos restaurantes, usuários e integrações sem misturar dados entre organizações.

### 2.4 Experiências independentes

Um mesmo restaurante poderá ter diferentes cardápios, cada um com organização, seleção e apresentação próprias.

### 2.5 Evolução incremental

A V1 deve entregar uma fundação sólida para experiências comerciais mais inteligentes, sem antecipar funcionalidades que ainda não precisam existir.

---

# 3. Escopo da V1

A primeira versão terá como objetivo conectar restaurantes ao OpenDelivery e transformar seus dados em experiências digitais personalizáveis.

## 3.1 Funcionalidades incluídas

1. Cadastro e gerenciamento de restaurantes.
2. Associação de múltiplos usuários a restaurantes.
3. Integração com OpenDelivery.
4. Sincronização periódica do catálogo.
5. Importação de todos os menus e serviços disponíveis na origem.
6. Importação de todos os produtos e categorias, inclusive indisponíveis.
7. Criação de múltiplos cardápios de experiência.
8. Seleção de produtos para cada cardápio.
9. Personalização visual dos produtos.
10. Biblioteca de mídia compartilhada por restaurante.
11. Configuração global e sobrescrita de apresentação por cardápio.
12. Organização de categorias e produtos.
13. Ordenação manual e independente por cardápio.
14. Publicação de cardápios digitais.
15. Link público principal por restaurante.
16. Definição de um cardápio padrão.
17. Experiência pública otimizada para dispositivos móveis.

## 3.2 Funcionalidades fora da V1

- Recebimento e gerenciamento de pedidos.
- Checkout próprio.
- Gestão operacional de cardápio.
- Alteração de preços e disponibilidade na origem.
- Programa próprio de fidelidade.
- Integrações de fidelidade com Stampay ou Tappi.
- Analytics avançado.
- Métricas de conversão e recompra.
- Testes A/B.
- Recomendações inteligentes.
- Seleção automática de cardápios por dia ou horário.
- Conteúdo educativo em vídeo.
- Sugestões automatizadas de merchandising.

Essas funcionalidades permanecem no roadmap de evolução.

---

# 4. Decisões finais do produto

As decisões abaixo foram confirmadas e devem ser tratadas como requisitos do projeto.

| Tema | Decisão final |
|---|---|
| Pedidos na V1 | Showcase: o Feels apresenta o cardápio, sem receber pedidos |
| Link principal | Abre diretamente o cardápio padrão |
| Permissões | Todos os usuários têm permissões iguais, com confirmação para ações críticas |
| Categorias | Modelo híbrido: categorias sincronizadas e categorias próprias |
| Produto em múltiplas categorias | Não. Um produto aparece em apenas uma categoria por cardápio |
| Produtos indisponíveis | Importar, mas ocultar na experiência pública |
| Menus e serviços OpenDelivery | Importar todos |
| Restaurante piloto | Studios Coffee |
| Backend | Supabase |

## 4.1 Comportamento do link público

Cada restaurante terá um link principal.

Esse link abrirá diretamente o cardápio definido como padrão pelo restaurante.

Rotas no host `{restaurantSlug}.{domínio}`, aceitas no [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md). O nome do domínio continua pendente.

- `/` — cardápio padrão do restaurante.
- `/hub` — hub institucional e de descoberta.
- `/{menuSlug}` — acesso direto a um cardápio específico.

O hub continua no produto. Ele não é a página inicial obrigatória do link principal.

O código atual ainda abre o hub em `/` quando não há parâmetro `view`. A migração fica para a especificação futura da experiência pública. Nenhum código muda por causa deste blueprint.

## 4.2 Permissões

Inicialmente, todos os membros de um restaurante terão as mesmas permissões funcionais.

Ações críticas devem exigir confirmação explícita, incluindo:

- Exclusão de restaurante.
- Remoção de integração.
- Alteração de credenciais.
- Remoção de usuários.
- Publicação ou reversão de versões, quando aplicável.

**Recomendação técnica:** registrar essas operações em um histórico de auditoria. A confirmação não substitui autenticação ou autorização; ela funciona como proteção adicional contra ações acidentais.

## 4.3 Categorias híbridas

O modelo deverá aceitar:

- Categorias importadas do sistema de origem.
- Categorias criadas diretamente no Feels.
- Categorias de experiência independentes da origem. A origem mostrada no painel é derivada pelos produtos.

As categorias de origem devem permanecer preservadas para fins de sincronização e rastreabilidade.

As categorias próprias devem permitir liberdade de organização comercial.

Um produto poderá pertencer a apenas uma categoria dentro de cada cardápio de experiência.

**Decisão aceita (categorias independentes, fundador, 13 de novembro de 2026):** `ExperienceCategory` não guarda `source_category_id`. A origem é derivada por `ExperienceCategory → ExperienceProduct → SourceOffer → SourceCategory`. O nome comercial não acompanha a renomeação da origem. A sincronização não altera nome, ordem nem composição. Origem arquivada gera aviso calculado no painel e não remove a categoria nem os produtos. Detalhe no [ADR 0013](../architecture/decisions/0013-categorias-independentes.md).

## 4.4 Disponibilidade

Todos os produtos serão importados, inclusive aqueles indisponíveis na origem.

Entretanto, produtos indisponíveis não serão exibidos na experiência pública.

A disponibilidade deve continuar sendo controlada pelo sistema de origem, sem edição operacional pelo Feels.

---

# 5. Arquitetura funcional

A arquitetura será organizada em quatro grandes domínios.

## 5.1 Identidade e organizações

Responsável por:

- Usuários.
- Restaurantes.
- Associação entre usuários e restaurantes.
- Configurações do restaurante.
- Preferências de publicação.
- Permissões e confirmações de ações críticas.

Entidades principais:

- User
- Restaurant
- RestaurantMembership

Um usuário poderá administrar vários restaurantes.

Um restaurante poderá ter vários usuários.

## 5.2 Integrações e catálogo de origem

Responsável por:

- Conexões com sistemas externos.
- Credenciais.
- Sincronização.
- Histórico de execução.
- Tratamento de erros.
- Produtos e categorias importados.
- Ofertas, preços e disponibilidade.

Entidades principais:

- IntegrationConnection
- SyncRun
- SyncIssue
- SourceCategory
- SourceProduct
- SourceOffer
- SourceOptionGroup
- SourceOption
- SourceMenu
- SourceService
- SourceAvailability

`SourceMenu`, `SourceService` e `SourceAvailability` estão aceitos na C5. Ver [ADR 0012](../architecture/decisions/0012-menu-servico-disponibilidade.md). `AuditEvent` continua recomendação.

A integração deve utilizar uma camada de adaptação para evitar que o restante do sistema dependa diretamente do formato do OpenDelivery.

## 5.3 Experiência e merchandising

Responsável por transformar os dados sincronizados em experiências comerciais.

Entidades principais:

- ProductPresentation
- ExperienceMenu
- ExperienceCategory
- ExperienceProduct

O mesmo produto poderá ter apresentações diferentes em cardápios distintos.

A organização e ordenação serão independentes por cardápio.

## 5.4 Mídia

Responsável por armazenar e relacionar imagens, vídeos e suas versões otimizadas.

Entidades principais:

- MediaAsset
- MediaRendition
- MediaAssignment

A biblioteca será compartilhada por restaurante.

A apresentação de mídia poderá ser global ou sobrescrita em um cardápio específico.

---

# 6. Modelo conceitual de dados

O modelo abaixo é uma referência inicial para a modelagem física no PostgreSQL.

## 6.1 Identidade

### User

Identidade do usuário da plataforma.

### Restaurant

Representa um restaurante dentro do Feels.

### RestaurantMembership

Relaciona usuários a restaurantes.

Campos importantes:

- restaurant_id
- user_id
- status
- created_at

Na V1, todos os membros terão o mesmo nível funcional de permissão.

## 6.2 Integração

### IntegrationConnection

Representa uma conexão entre o restaurante e um sistema externo.

Campos sugeridos:

- id
- restaurant_id
- provider
- external_merchant_id
- credentials_reference
- integration_version
- status
- last_sync_at
- created_at
- updated_at

As credenciais não devem ser armazenadas em texto aberto.

### SyncRun

Registra cada execução de sincronização.

Campos sugeridos:

- id
- integration_connection_id
- started_at
- completed_at
- status
- source_last_update
- records_processed
- records_created
- records_updated
- records_archived
- error_summary

### SyncIssue

Armazena problemas identificados durante uma sincronização.

Campos sugeridos:

- id
- sync_run_id
- entity_type
- external_id
- severity
- message
- resolved_at

## 6.3 Catálogo de origem

### SourceCategory

Representa uma categoria recebida do sistema externo. Pertence a um `SourceMenu`.

### SourceMenu

Menu recebido da origem, distinto do cardápio criado no Feels. Campos documentados: `id`, `name` e `externalCode`.

### SourceService

Serviço recebido da origem. Tipos documentados: `DELIVERY` e `TAKEOUT`. Aponta um menu por `menuId`. Mais de um serviço pode apontar o mesmo menu. A especificação consultada não documenta id próprio de serviço.

### SourceAvailability

Janelas de datas e horários da categoria ou da oferta. O status `AVAILABLE` ou `UNAVAILABLE` permanece no registro dono. As janelas não comandam a experiência pública da V1.

### SourceProduct

Representa o produto original.

### SourceOffer

Representa uma oferta comercial do produto, incluindo informações que podem variar por menu ou serviço.

**Decisão aceita (C4, fundador, 13 de novembro de 2026):** ExperienceProduct referencia a oferta selecionada (`source_offer_id`). O produto (`source_product_id`) vem dessa oferta ou é mantido de forma consistente e validável.

O Feels importa várias ofertas do mesmo produto. Cada cardápio de experiência escolhe uma única oferta para representá-lo. As demais permanecem no catálogo de origem.

Exemplo: Cappuccino na oferta Delivery a R$ 15 e na oferta Takeout a R$ 13. As duas ficam na origem. Um cardápio só seleciona uma delas para esse produto.

**Decisão aceita (administração de ofertas, fundador, 13 de novembro de 2026):** com uma oferta, o sistema pode selecioná-la e persiste `source_offer_id`. Com várias, o administrador escolhe antes de incluir o produto naquele cardápio. A sincronização não troca essa escolha e não acrescenta oferta nova a cardápio nenhum. Oferta escolhida indisponível ou arquivada oculta o produto naquele cardápio, sem cair para outra oferta. O preço público é o `value` da oferta selecionada. `originalValue` fica armazenado e não implica preço riscado. O painel identifica a oferta por serviço, menu de origem, preço e status, quando a origem os enviar, e não inventa um nome. Detalhe no [ADR 0011](../architecture/decisions/0011-administracao-ofertas.md). Essa decisão não aprova os nomes sozinha. A C5 os aceita no [ADR 0012](../architecture/decisions/0012-menu-servico-disponibilidade.md).

### SourceOptionGroup e SourceOption

Representam grupos de opções e opções vinculadas aos produtos, conforme disponibilizados pelo fornecedor.

A estrutura deve preservar os identificadores externos e os dados originais necessários para futuras evoluções.

## 6.4 Apresentação comercial

### ProductPresentation

Armazena a apresentação global do produto.

Exemplos:

- Título comercial.
- Descrição comercial.
- Imagem principal.
- Vídeo.
- Elementos visuais.

### ExperienceMenu

Representa um cardápio digital criado no Feels.

Campos sugeridos:

- id
- restaurant_id
- name
- slug
- is_default
- status
- published_at

### ExperienceCategory

Categoria comercial dentro de um cardápio. Independente da categoria de origem.

Campos:

- id
- experience_menu_id
- name
- position

Não há `source_category_id` nem relação N:N. A origem é derivada pelos produtos colocados. Ver [ADR 0013](../architecture/decisions/0013-categorias-independentes.md).

### ExperienceProduct

Representa a presença de uma oferta em um cardápio.

Campos:

- id
- experience_menu_id
- experience_category_id
- source_offer_id
- source_product_id
- position
- visibility
- presentation_override
- created_at
- updated_at

Regra de domínio aceita (C4):

`UNIQUE (experience_menu_id, source_product_id)`

O modelo precisa de integridade referencial para impedir que `source_product_id` discorde do produto da oferta em `source_offer_id`.

Consequências:

- Um produto aparece apenas uma vez em cada cardápio.
- O mesmo produto pode aparecer em cardápios diferentes.
- O mesmo produto pode estar em categorias diferentes em cardápios distintos.
- Cada cardápio pode selecionar uma oferta diferente do mesmo produto.
- A ordenação continua independente por cardápio.

## 6.5 Mídia

### MediaAsset

Representa um arquivo de mídia pertencente ao restaurante.

Deve distinguir a origem do conteúdo:

- source: mídia recebida do sistema de origem.
- restaurant_upload: mídia enviada pelo restaurante.
- feels_content: conteúdo disponibilizado pelo Feels.

### MediaRendition

Representa versões otimizadas do arquivo original.

Exemplos:

- Thumbnail.
- Imagem otimizada.
- Vídeo otimizado.
- Diferentes resoluções.

### MediaAssignment

Relaciona mídias aos produtos e contextos de apresentação.

Deve permitir uma configuração global e sobrescritas específicas por cardápio.

A sincronização nunca deve sobrescrever mídia criada ou enviada pelo restaurante ou pelo Feels.

---

# 7. Integração OpenDelivery

## 7.1 Estratégia

O OpenDelivery será a primeira integração da plataforma.

A implementação deve ser construída por meio de um adaptador isolado, permitindo que novos fornecedores sejam conectados futuramente sem reescrever o domínio principal.

A V1 deve começar com a versão 1 do protocolo, mantendo a possibilidade de evolução para versões posteriores.

## 7.2 Importação

O Feels deverá importar todos os menus e serviços disponibilizados pelo fornecedor.

A estrutura de origem deverá preservar a relação entre:

- Menu.
- Service.
- Category.
- Item.
- ItemOffer.
- OptionGroup.
- Option.
- Availability.

O sistema não deve assumir que um produto possui apenas uma oferta ou que todas as ofertas têm os mesmos preços e disponibilidades.

## 7.3 Sincronização

Frequência desejada: a cada 15 minutos.

Essa frequência é uma meta operacional, não uma garantia independente das regras do fornecedor.

O protocolo V1 possui parâmetros de TTL que precisam ser respeitados. O relatório técnico identificou um intervalo documentado de 500 a 86.400 segundos.

Recomendação:

- Consultar o TTL informado pela origem.
- Não consultar antes do intervalo permitido.
- Programar a sincronização respeitando o TTL.
- Utilizar o campo lastUpdate para evitar processamento desnecessário.
- Registrar cada execução.
- Garantir que a sincronização seja idempotente.

Uma política inicial recomendada é:

`intervalo efetivo = max(15 minutos, TTL informado)`

A implementação final deverá considerar também os limites de requisição definidos pelo fornecedor.

## 7.4 Produtos removidos

Quando um produto ou oferta deixar de existir em um snapshot completo da origem, o Feels deverá arquivá-lo.

Não deve excluir definitivamente o registro.

**Decisão aceita (oferta escolhida, fundador, 13 de novembro de 2026):** a oferta arquivada ou indisponível oculta o produto na experiência pública daquele cardápio. A sincronização não aponta outra oferta. O painel diferencia os dois estados. No arquivamento, o administrador pode escolher outra oferta ou retirar o produto daquele cardápio. O registro da oferta original permanece. Detalhe no [ADR 0011](../architecture/decisions/0011-administracao-ofertas.md).

Isso preserva:

- Histórico.
- Mídias.
- Apresentações comerciais.
- Referências em cardápios anteriores.

## 7.5 Imagens da origem

URLs de imagens recebidas do fornecedor podem ser temporárias.

Recomendação técnica:

- Baixar a mídia para armazenamento próprio.
- Registrar a origem do arquivo.
- Utilizar checksum, como CRC-32 quando adequado, para evitar downloads repetidos.
- Gerar versões otimizadas.
- Preservar arquivos e referências criadas pelo restaurante ou pelo Feels.

## 7.6 Risco comercial da integração

OpenDelivery é um protocolo, não uma API central única que automaticamente fornece todos os restaurantes.

Cada fornecedor precisa disponibilizar o acesso ao catálogo e permitir que o Feels consuma esses dados.

É necessário validar com o fornecedor do restaurante piloto se ele permite disponibilizar o catálogo para uma aplicação que não recebe pedidos.

Essa validação é um pré-requisito para a implementação real da integração.

---

# 8. Backend e infraestrutura

## 8.1 Backend escolhido: Supabase

O Supabase será a plataforma de backend da V1.

Componentes previstos:

- PostgreSQL para persistência.
- Supabase Auth para autenticação.
- Row Level Security (RLS) para isolamento multi-tenant.
- Supabase Cron para agendamento.
- Supabase Queues ou mecanismo equivalente para processamento assíncrono.
- Vault ou mecanismo seguro equivalente para credenciais e segredos.

A escolha do Supabase deve permitir construir a fundação sem manter infraestrutura própria desnecessária.

## 8.2 Segurança multi-tenant

Todas as entidades relacionadas a restaurantes deverão possuir um vínculo rastreável com restaurant_id, diretamente ou por meio de relações controladas.

As políticas RLS deverão garantir que um usuário só acesse dados dos restaurantes aos quais está associado.

Não confiar apenas em filtros implementados no frontend.

Operações administrativas e sincronizações devem ocorrer em ambiente confiável, utilizando credenciais de serviço somente no backend.

## 8.3 Frontend

Recomendação inicial:

- React.
- TypeScript.
- Vite.
- React Router.

A aplicação deverá separar claramente:

- Área administrativa.
- Experiência pública.

A arquitetura atual do Feels Menu poderá ser aproveitada, evitando reescrever componentes que já funcionam.

O frontend deverá evoluir de uma experiência vinculada a um único restaurante para uma aplicação dinâmica baseada em restaurantSlug e menuSlug.

## 8.4 Mídia e distribuição

Manter o Cloudflare R2 como armazenamento de mídia é uma recomendação técnica.

A arquitetura deverá considerar:

- Upload por URL assinada.
- CDN com domínio próprio.
- Imagens responsivas.
- Vídeos otimizados.
- Geração de thumbnails.
- Limites de tamanho e formato.
- Processamento assíncrono de mídia.

A camada de mídia deverá ser independente do fornecedor de catálogo.

## 8.5 Publicação

**Decisão aceita (C3, fundador, 13 de novembro de 2026):** publicação híbrida, com duas camadas independentes.

### Camada de experiência — versionada

A publicação congela:

- Seleção de produtos.
- Categorias.
- Ordenação.
- Títulos comerciais.
- Descrições comerciais.
- Imagens e vídeos.
- Configurações visuais.

### Camada operacional — atualizada pela sincronização

Os dados operacionais continuam vindo da origem e são atualizados independentemente da publicação:

- Preços.
- Disponibilidade.
- Status dos produtos.
- Arquivamento de produtos removidos.

A experiência pública combina a versão publicada com os dados operacionais mais recentes disponíveis.

Uma atualização de preço ou disponibilidade não exige republicação manual.

### Regras

- A origem continua sendo a fonte da verdade operacional.
- A sincronização não altera a apresentação comercial.
- A publicação não congela preços nem disponibilidade.
- Produtos indisponíveis permanecem ocultos na experiência pública.
- Produtos removidos da origem são arquivados.
- A disponibilidade programada por horário continua fora da V1.

**Decisão aceita (freshness, fundador, 13 de novembro de 2026):** o último snapshot operacional completo e válido pode ser usado até `max_staleness = 2 × effective_sync_interval`, com `effective_sync_interval = max(15 minutos, TTL informado pelo fornecedor)`. TTL acima de uma hora não cria outro teto. A idade conta da última sincronização bem-sucedida e válida, não da última tentativa e não do `lastUpdate` da origem. Dentro do prazo, a experiência pública mostra o cardápio nos estados FRESH e STALE. Fora do prazo, o estado é EXPIRED e o cardápio não é apresentado como atual. Detalhe em [operational-freshness.md](../operations/operational-freshness.md) e no [ADR 0009](../architecture/decisions/0009-operational-freshness.md).

**Decisão aceita (experiência EXPIRED, fundador, 13 de novembro de 2026):** no host do restaurante, em `/` e `/{menuSlug}`, EXPIRED substitui o cardápio. A tela mostra nome, logotipo, o título "Cardápio temporariamente indisponível", o texto "Não conseguimos confirmar os preços e a disponibilidade agora. Volte daqui a pouco." e o botão "Tentar de novo". A mensagem não sugere restaurante fechado. Desktop e mobile compartilham estado, mensagem e ação. A troca é imediata, inclusive durante um reel. Com a página visível, FRESH ou STALE restauram o cardápio. `/hub` não é oferecido como alternativa. Detalhe no [ADR 0010](../architecture/decisions/0010-experiencia-expired.md). O host está no [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md).

**Decisão aceita (entrega por CDN, fundador, 14 de novembro de 2026):** a navegação pública não consulta o banco. A CDN distribui identidade, versão imutável, ponteiro ativo e documento operacional. O ponteiro muda por último. Em EXPIRED, o aplicativo não baixa a versão do cardápio. Cache da versão é imutável. Ponteiro e documento operacional ficam em 60 segundos. Detalhe no [ADR 0014](../architecture/decisions/0014-entrega-cdn.md).

**Decisão aceita (armazenamento e distribuição, fundador, 14 de novembro de 2026):** os quatro documentos ficam num bucket exclusivo do Cloudflare R2 e saem pela CDN da Cloudflare, num subdomínio separado da navegação. A versão tem cache longo. Ponteiro e documento operacional ficam em 60 segundos. A identidade tem cache curto. Identidade, ponteiro e documento operacional podem ser purgados de forma seletiva. O host do restaurante é `{restaurantSlug}.{domínio}`: `/` abre o cardápio padrão, `/{menuSlug}` abre um cardápio específico e `/hub` abre o hub. O nome do domínio continua pendente. A retenção conserva o conjunto maior entre 90 dias e 10 versões, e também a versão ativa, a referenciada e a anterior. EXPIRED não usa só o relógio do aparelho. Esta decisão não aprova a biblioteca de mídia. Detalhe no [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md).

---

# 9. Experiência pública

A experiência pública é o produto que o cliente final do restaurante acessa.

Na V1, ela será um showcase visual.

Não haverá processamento de pedidos dentro do Feels.

A experiência deverá:

- Ser mobile-first.
- Ter carregamento rápido.
- Apresentar categorias e produtos de forma visual.
- Exibir imagens e vídeos otimizados.
- Ocultar produtos indisponíveis.
- Respeitar a organização e a ordenação configuradas no cardápio.
- Abrir diretamente o cardápio padrão pelo link principal, em `{restaurantSlug}.{domínio}/`. O nome do domínio continua pendente.
- Manter o hub em `{restaurantSlug}.{domínio}/hub`, sem obrigar o link principal a passar por ele.
- Permitir acesso direto por `{restaurantSlug}.{domínio}/{menuSlug}`.
- Em EXPIRED, substituir o cardápio em `/` e `/{menuSlug}` do host do restaurante pela indisponibilidade temporária aceita no [ADR 0010](../architecture/decisions/0010-experiencia-expired.md).

O Feels deverá preservar os componentes e funcionalidades da experiência atual sempre que forem compatíveis com a nova arquitetura multi-restaurante.

---

# 10. Roadmap

## Fase 1 — Fundação e documentação

- Consolidar o blueprint.
- Definir arquitetura.
- Criar estrutura de documentação.
- Implantar Spec-Driven Development.
- Definir padrões de código e agentes.
- Estabelecer quality gates.

## Fase 2 — Fundação técnica

- Configurar Supabase.
- Criar modelo de dados.
- Configurar autenticação.
- Implementar multi-tenancy.
- Implementar políticas RLS.
- Criar estrutura administrativa.
- Criar cadastro de restaurantes e usuários.

## Fase 3 — Integração e sincronização

- Implementar adaptador OpenDelivery V1.
- Validar conexão com o fornecedor do Studios Coffee.
- Implementar importação de todos os menus e serviços.
- Importar categorias, produtos, ofertas e opções.
- Implementar sincronização idempotente.
- Implementar histórico e tratamento de erros.
- Implementar arquivamento de registros removidos.

## Fase 4 — Gestão de experiências

- Criar múltiplos cardápios.
- Selecionar ofertas importadas.
- Criar categorias próprias.
- Vincular categorias de origem.
- Implementar apresentação global de produtos.
- Implementar sobrescritas por cardápio.
- Implementar ordenação independente.
- Implementar regras de disponibilidade.

## Fase 5 — Mídia

- Criar biblioteca compartilhada.
- Implementar upload.
- Implementar armazenamento no R2.
- Implementar otimização de imagens e vídeos.
- Implementar associação global e por cardápio.
- Preservar mídias durante sincronizações.

## Fase 6 — Experiência pública

- Implementar resolução por restaurantSlug.
- Implementar resolução por menuSlug.
- Implementar link principal e cardápio padrão.
- Migrar a experiência atual.
- Validar responsividade.
- Validar performance em dispositivos móveis.
- Implementar a publicação híbrida aceita na seção 8.5.

## Fase 7 — Piloto

- Conectar Studios Coffee.
- Validar sincronização real.
- Criar cardápios de experiência.
- Configurar mídias e apresentações.
- Publicar experiência.
- Validar comportamento com usuários reais.
- Corrigir problemas antes da expansão comercial.

---

# 11. Evoluções futuras

## Evolução 2 — Inteligência comercial

- Analytics de navegação.
- Métricas de visualização.
- Tempo de tela.
- Métricas de interação.
- Testes A/B.
- Recomendações de posicionamento.
- Sugestões contextuais.
- Seleção de cardápios por horário e dia.
- Conteúdo educativo em vídeo.

## Evolução 3 — Recompra e relacionamento

- Integração com plataformas de fidelidade.
- Integração com Stampay ou Tappi.
- Cadastro de clientes.
- Cartões digitais para Apple Wallet e Google Wallet.
- Campanhas de relacionamento.
- Segmentação de clientes.
- Estratégias de recompra.

A fidelidade deverá ser integrada por meio de terceiros, sem transformar o Feels em uma plataforma própria de gestão de pontos na primeira etapa.

---

# 12. Qualidade e engenharia

## 12.1 Quality Gates

Recomenda-se implementar verificações automatizadas desde o início:

- TypeScript typecheck.
- Build de produção.
- Testes unitários.
- Testes de integração.
- Smoke tests da experiência pública.
- Testes de isolamento multi-tenant.
- Testes de sincronização idempotente.
- Testes de publicação e rollback, caso adotados.

## 12.2 Testes de interface

O relatório técnico recomenda Playwright com cenários em Chromium e WebKit.

Cobertura inicial sugerida:

- Hub.
- Reels.
- Feed.
- Perfil.
- Navegação entre cardápios.
- Exibição de produtos.
- Comportamento de vídeos.
- Console do navegador.
- Requisições de rede.
- Responsividade mobile.

O projeto atual já utiliza Playwright para auditorias manuais. A adoção de `@playwright/test` como runner automatizado deverá ser uma mudança explícita de dependência, não uma suposição.

## 12.3 CI/CD

Recomendação:

- GitHub Actions para quality gates.
- Deploy de preview na Vercel.
- Produção protegida.
- Testes antes de qualquer publicação.
- Separação de ambientes de desenvolvimento, homologação e produção.

---

# 13. Estrutura de documentação e SDD

O projeto deverá adotar Spec-Driven Development (SDD).

As especificações devem orientar a implementação, em vez de a documentação ser escrita apenas depois do código.

Estrutura sugerida:

- `docs/product/`
- `docs/architecture/`
- `docs/operations/`
- `specs/`
- `agents/`
- `AGENTS.md`
- `.specify/`

O Spec Kit poderá ser utilizado para organizar constituição, especificações, planos e tarefas.

As regras do projeto REA, localizadas no diretório pai, deverão ser preservadas e respeitadas pelos agentes.

Cada feature deverá passar por:

1. Definição do problema.
2. Especificação funcional.
3. Critérios de aceitação.
4. Plano técnico.
5. Tarefas de implementação.
6. Implementação.
7. Testes.
8. Revisão.

---

# 14. Recomendações técnicas prioritárias

As recomendações abaixo devem ser consideradas durante o detalhamento técnico:

1. **Referenciar SourceOffer em ExperienceProduct.** Aceito na v0.5 (C4), com unicidade por produto no cardápio. Deixa de ser apenas recomendação.
2. **Implementar RLS desde a primeira migration.** Multi-tenancy não deve ser acrescentado posteriormente.
3. **Criar adaptador OpenDelivery.** O domínio não deve depender diretamente do formato do protocolo.
4. **Sincronização idempotente.** Reexecuções não podem duplicar registros ou sobrescrever dados comerciais.
5. **Separar mídia por origem.** Conteúdo do restaurante e do Feels não pode ser perdido durante sincronizações.
6. **Arquivar, não excluir.** Preservar histórico e referências quando a origem remover um item.
7. **Respeitar TTL e limites do fornecedor.** A frequência de 15 minutos depende das condições reais da integração.
8. **Manter edição e publicação separadas.** Aceito na v0.5 como publicação híbrida (C3). A camada de experiência é versionada. Preço e disponibilidade não congelam.
9. **Automatizar quality gates.** Evitar regressões na experiência atual durante a migração.
10. **Preservar a aplicação existente.** Reutilizar componentes, mídia, hooks e funcionalidades que já estejam estáveis, refatorando gradualmente.

---

# 15. Decisões pendentes

As decisões finais de produto foram consolidadas. Os itens abaixo ainda precisam ser resolvidos antes ou durante a implementação.

| Tema | O que falta definir | Prioridade |
|---|---|---|
| Fornecedor OpenDelivery | Confirmar qual fornecedor disponibilizará os dados do Studios Coffee | Bloqueante |
| Acesso ao catálogo | Confirmar autorização para consumir o catálogo sem receber pedidos | Bloqueante |
| Credenciais | Confirmar método de autenticação, armazenamento e renovação | Alta |
| Limites e TTL | Confirmar limites reais, TTL e comportamento de atualização do fornecedor | Alta |
| Sandbox | Confirmar disponibilidade de ambiente de testes e dados de exemplo | Alta |
| Identificadores | Validar estabilidade dos IDs de produtos, ofertas e categorias | Alta |
| Identidade do serviço | Definir a chave persistente quando a origem não enviar um id próprio de serviço. Chave composta depende dessa validação | Alta |
| Janelas de disponibilidade | Confirmar os campos reais e a forma de reconciliar e arquivar as janelas | Alta |
| Webhook | Confirmar disponibilidade e necessidade de merchantUpdate | Média |
| Opções de produtos | Definir o nível de suporte visual a grupos e opções na V1 | Média |
| CTA público | Definir quais ações estarão disponíveis no showcase além da navegação pelo cardápio. O botão "Tentar de novo" da tela EXPIRED não fecha esta decisão | Média |
| Nome do domínio | Escolher o domínio. A forma `{restaurantSlug}.{domínio}` e o subdomínio separado dos documentos estão aceitos no [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md) | Média |
| Migração | Definir como o conteúdo atual será migrado para o modelo multi-restaurante | Alta |

## 15.1 Questões que dependem do fornecedor

Antes de iniciar a integração real, obter respostas formais para:

- Qual versão do OpenDelivery é suportada?
- O fornecedor disponibiliza o endpoint de catálogo para aplicações que não recebem pedidos?
- Qual é o modelo comercial e contratual para esse acesso?
- Como são entregues as credenciais?
- Qual é o TTL aplicado?
- Existem limites de requisição?
- Os identificadores externos são estáveis?
- O serviço traz identificador próprio ou a identidade depende de outra chave?
- Quais campos identificam uma janela de disponibilidade?
- As imagens possuem URLs permanentes ou temporárias?
- Existe ambiente sandbox?
- O fornecedor suporta notificações de atualização?

---

# 16. Critérios de sucesso da V1

A V1 estará funcionalmente pronta quando:

1. Um usuário conseguir criar e acessar um restaurante.
2. O isolamento de dados entre restaurantes estiver validado.
3. O restaurante conseguir conectar sua origem OpenDelivery.
4. O Feels importar todos os menus e serviços disponibilizados.
5. Produtos, ofertas e categorias forem sincronizados sem duplicações.
6. Produtos removidos forem arquivados sem perda de mídia e histórico.
7. O restaurante conseguir criar múltiplos cardápios.
8. Cada cardápio permitir seleção e ordenação independente de ofertas.
9. Categorias próprias e sincronizadas puderem coexistir.
10. A apresentação visual puder ser personalizada globalmente e por cardápio.
11. Produtos indisponíveis forem ocultados na experiência pública.
12. O link principal abrir o cardápio padrão.
13. A experiência pública funcionar corretamente em dispositivos móveis.
14. O piloto Studios Coffee conseguir operar a experiência de ponta a ponta.

---

# 17. Diretriz final

O Feels Menu deve ser desenvolvido como uma plataforma de experiência comercial, e não como mais um sistema de gestão de cardápio.

A arquitetura deve preservar a autonomia dos sistemas operacionais, enquanto o Feels assume a responsabilidade pela apresentação, organização e evolução da experiência digital.

**A prioridade da V1 é construir uma fundação multi-tenant confiável, integrar o primeiro fornecedor OpenDelivery e entregar uma experiência pública de alta qualidade para o Studios Coffee.**

Tudo o que não contribui diretamente para esse objetivo deve permanecer no roadmap, evitando complexidade prematura.
