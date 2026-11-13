<!-- Documento-fonte da versão 0.4. O texto abaixo não foi reescrito. A referência vigente é blueprint-v0.5.md. -->

**Histórico:** este arquivo preserva o Blueprint 0.4. A referência vigente é o [Blueprint v0.5](blueprint-v0.5.md).

# Feels Menu — Product & Technical Blueprint

**Versão:** 0.4
**Status:** Blueprint aprovado para iniciar o detalhamento técnico
**Produto:** Feels Menu
**Piloto:** Studios Coffee
**Backend:** Supabase
**Integração inicial:** OpenDelivery

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

Os demais cardápios poderão ter URLs próprias, permitindo acesso direto a experiências específicas.

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
- Categorias de experiência vinculadas opcionalmente às categorias de origem.

As categorias de origem devem permanecer preservadas para fins de sincronização e rastreabilidade.

As categorias próprias devem permitir liberdade de organização comercial.

Um produto poderá pertencer a apenas uma categoria dentro de cada cardápio de experiência.

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

Representa uma categoria recebida do sistema externo.

### SourceProduct

Representa o produto original.

### SourceOffer

Representa uma oferta comercial do produto, incluindo informações que podem variar por menu ou serviço.

**Decisão técnica recomendada:** ExperienceProduct deve referenciar SourceOffer, e não somente SourceProduct.

Isso é importante porque um mesmo item pode possuir diferentes ofertas, categorias, preços ou disponibilidades dependendo do contexto de origem.

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

Representa uma categoria dentro de um cardápio.

Pode ser criada no Feels ou vinculada a uma categoria de origem.

Campos sugeridos:

- id
- experience_menu_id
- source_category_id (nullable)
- name
- position
- origin_type

### ExperienceProduct

Representa a presença de uma oferta em um cardápio.

Campos sugeridos:

- id
- experience_menu_id
- experience_category_id
- source_offer_id
- position
- visibility
- presentation_override
- created_at
- updated_at

A restrição de domínio deve impedir que o mesmo produto/oferta seja adicionado em mais de uma categoria no mesmo cardápio.

A mesma oferta poderá aparecer em cardápios diferentes.

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

Recomendação: publicar versões imutáveis dos cardápios.

Cada publicação deverá gerar uma versão identificável, permitindo:

- Recuperação de uma versão anterior.
- Rollback.
- Rastreabilidade.
- Separação entre edição e publicação.

A estratégia de publicação versionada deverá ser validada no detalhamento técnico da V1.

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
- Abrir diretamente o cardápio padrão pelo link principal.

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
- Implementar publicação versionada, caso aprovada no detalhamento.

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

1. **Referenciar SourceOffer em ExperienceProduct.** Evita ambiguidades quando um item possui ofertas distintas.
2. **Implementar RLS desde a primeira migration.** Multi-tenancy não deve ser acrescentado posteriormente.
3. **Criar adaptador OpenDelivery.** O domínio não deve depender diretamente do formato do protocolo.
4. **Sincronização idempotente.** Reexecuções não podem duplicar registros ou sobrescrever dados comerciais.
5. **Separar mídia por origem.** Conteúdo do restaurante e do Feels não pode ser perdido durante sincronizações.
6. **Arquivar, não excluir.** Preservar histórico e referências quando a origem remover um item.
7. **Respeitar TTL e limites do fornecedor.** A frequência de 15 minutos depende das condições reais da integração.
8. **Manter edição e publicação separadas.** Considerar versões imutáveis e rollback.
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
| Webhook | Confirmar disponibilidade e necessidade de merchantUpdate | Média |
| Múltiplas ofertas | Definir como apresentar ofertas distintas do mesmo item ao usuário administrativo | Alta |
| Opções de produtos | Definir o nível de suporte visual a grupos e opções na V1 | Média |
| Categorias híbridas | Definir regras de sincronização quando uma categoria de origem for renomeada ou removida | Média |
| Produto em cardápios | Definir o comportamento quando uma oferta for arquivada na origem | Média |
| Publicação | Aprovar estratégia de versões imutáveis e rollback | Média |
| CTA público | Definir quais ações estarão disponíveis no showcase além da navegação pelo cardápio | Média |
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
