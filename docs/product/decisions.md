# Decisões confirmadas

Fontes: [Blueprint v0.4](blueprint-v0.4.md), seção 4, e [Blueprint v0.5](blueprint-v0.5.md). A v0.5 é a referência vigente. A v0.4 permanece como histórico.

Decisões C2, C3 e C4: aprovação explícita do fundador em 13 de novembro de 2026.

Estas decisões são requisitos. Recomendação que não está nesta página não é requisito.

| Tema | Decisão final | Origem |
|---|---|---|
| Pedidos na V1 | Showcase: o Feels apresenta o cardápio, sem receber pedidos | Blueprint v0.4, seção 4 |
| Link principal | Abre diretamente o cardápio padrão | Blueprint v0.4, seção 4; detalhado em C2 |
| Permissões | Todos os usuários têm permissões iguais, com confirmação para ações críticas | Blueprint v0.4, seção 4 |
| Categorias | Modelo híbrido: categorias sincronizadas e categorias próprias | Blueprint v0.4, seção 4 |
| Produto em múltiplas categorias | Não. Um produto aparece em apenas uma categoria por cardápio | Blueprint v0.4, seção 4 |
| Produtos indisponíveis | Importar, mas ocultar na experiência pública | Blueprint v0.4, seção 4 |
| Menus e serviços OpenDelivery | Importar todos. `SourceMenu`, `SourceService` e `SourceAvailability` representam a origem | Fundador, 13 de novembro de 2026; C5 |
| Restaurante piloto | Studios Coffee | Blueprint v0.4, seção 4 |
| Backend | Supabase | Blueprint v0.4, seção 4 |
| Rotas públicas (C2) | No host `{restaurantSlug}.{domínio}`, `/` é o cardápio padrão, `/hub` é o hub e `/{menuSlug}` abre um cardápio específico. O nome do domínio continua pendente | Fundador, 13 e 14 de novembro de 2026 |
| Publicação (C3) | Híbrida: experiência versionada e operação atualizada pela sincronização | Fundador, 13 de novembro de 2026 |
| Oferta no cardápio (C4) | Uma oferta por produto em cada cardápio; unicidade por `experience_menu_id` e `source_product_id` | Fundador, 13 de novembro de 2026 |
| Ofertas no painel | Escolha explícita por cardápio; a sincronização não troca a oferta escolhida | Fundador, 13 de novembro de 2026 |
| Freshness operacional | Último snapshot válido até `2 × effective_sync_interval` | Fundador, 13 de novembro de 2026 |
| Experiência EXPIRED | Nas rotas de cardápio, indisponibilidade temporária com nome, logotipo e "Tentar de novo" | Fundador, 13 de novembro de 2026 |
| Categorias independentes | Origem da categoria de experiência derivada pelos produtos, sem `source_category_id` | Fundador, 13 de novembro de 2026 |
| Entrega por CDN | Quatro documentos públicos. A navegação não consulta o banco. A CDN não altera preço nem freshness | Fundador, 14 de novembro de 2026 |
| Documentos públicos | Bucket R2 exclusivo, CDN Cloudflare, subdomínio por restaurante e retenção de 90 dias ou 10 versões | Fundador, 14 de novembro de 2026 |

## Link público (C2)

Cada restaurante tem um link principal. Esse link abre diretamente o cardápio padrão.

Rotas conceituais da C2:

- `/` — cardápio padrão do restaurante.
- `/hub` — hub institucional e de descoberta.
- `/:restaurantSlug/:menuSlug` — acesso direto a um cardápio específico, na forma anterior à escolha do host.

O endereço aceito em 14 de novembro de 2026 coloca o restaurante no host. `{restaurantSlug}.{domínio}/` abre o cardápio padrão. `{restaurantSlug}.{domínio}/{menuSlug}` abre um cardápio específico. `{restaurantSlug}.{domínio}/hub` abre o hub. O nome do domínio continua pendente. Registro no [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md).

O hub continua no produto. Não é a página inicial obrigatória do link principal.

O código atual ainda abre o hub em `/` quando não há `view`. A migração entra na especificação futura da experiência pública. O código não muda nesta documentação.

## Publicação híbrida (C3)

A camada de experiência é versionada e congela seleção de produtos, categorias, ordenação, títulos comerciais, descrições comerciais, imagens, vídeos e configurações visuais.

A camada operacional vem da origem e é atualizada pela sincronização, sem republicação manual: preços, disponibilidade, status e arquivamento.

A experiência pública combina a versão publicada com os dados operacionais mais recentes disponíveis.

A origem continua sendo a fonte da verdade operacional. A sincronização não altera a apresentação comercial. A publicação não congela preços nem disponibilidade. Indisponíveis ficam ocultos. Removidos da origem são arquivados. Disponibilidade por horário continua fora da V1.

Registro: [ADR 0006](../architecture/decisions/0006-publicacao-versionada.md).

## Freshness operacional

Aprovada pelo fundador em 13 de novembro de 2026. Não altera a publicação híbrida.

`effective_sync_interval = max(15 minutos, TTL informado pelo fornecedor)`

`max_staleness = 2 × effective_sync_interval`

TTL acima de uma hora não cria outro teto. A idade é o tempo desde a última sincronização bem-sucedida e válida. Falha, carga parcial ou carga inválida não substituem esse snapshot. Estados: FRESH, STALE e EXPIRED. A experiência pública mostra o cardápio em FRESH e STALE. Em EXPIRED mostra indisponibilidade temporária, sem preço nem disponibilidade antigos como se fossem atuais.

Registro: [ADR 0009](../architecture/decisions/0009-operational-freshness.md) e [operational-freshness.md](../operations/operational-freshness.md).

## Experiência pública em EXPIRED

Aprovada pelo fundador em 13 de novembro de 2026. Não altera a fórmula do ADR 0009 nem a publicação híbrida.

No host do restaurante, em `/` e `/{menuSlug}`, EXPIRED substitui reels, feed, categorias, produtos, preços e disponibilidade. A tela mostra nome, logotipo, o título "Cardápio temporariamente indisponível", o texto "Não conseguimos confirmar os preços e a disponibilidade agora. Volte daqui a pouco." e o botão "Tentar de novo".

O botão relê o estado. Se continuar EXPIRED, a mesma tela permanece. Não há telefone, WhatsApp, link externo nem link para `/hub`. Desktop e mobile compartilham estado, mensagem e ação. A substituição é imediata, inclusive durante um reel. Com a página visível, FRESH ou STALE restauram o cardápio. Não há notificação nem recuperação em segundo plano.

Registro: [ADR 0010](../architecture/decisions/0010-experiencia-expired.md).

## Um produto por cardápio (C4)

Várias ofertas do mesmo produto são importadas e preservadas. Cada cardápio seleciona uma só para aquele produto.

Exemplo: Cappuccino Delivery a R$ 15 e Cappuccino Takeout a R$ 13. As duas ficam na origem. Um cardápio escolhe uma.

Unicidade: `UNIQUE (experience_menu_id, source_product_id)`.

`ExperienceProduct` referencia `source_offer_id`. `source_product_id` deriva da oferta selecionada ou permanece consistente e validável. A integridade referencial impede divergência entre os dois.

O mesmo produto pode estar em outro cardápio, em outra categoria, com outra oferta e com outra ordem.

Registro: [ADR 0005](../architecture/decisions/0005-experience-product-source-offer.md).

## Administração de ofertas

Aprovada pelo fundador em 13 de novembro de 2026. Não altera a C4 nem a publicação híbrida.

Com uma oferta, o sistema pode selecioná-la e persiste `source_offer_id`. Com várias, o administrador escolhe antes de incluir o produto naquele cardápio. A escolha não afeta outro cardápio.

A sincronização atualiza preço, disponibilidade, status e arquivamento. Ela não muda o `source_offer_id`. Oferta nova fica no catálogo e não entra sozinha num cardápio. Preço do mesmo identificador externo muda sem republicação.

Oferta escolhida indisponível ou arquivada oculta o produto naquele cardápio, mesmo que outra oferta do mesmo produto continue disponível. O painel diferencia os dois estados. No arquivamento, o administrador pode escolher outra oferta ou retirar o produto. O registro arquivado permanece.

O preço público é o `value` da oferta selecionada. `originalValue` fica armazenado e não implica preço riscado. FRESH e STALE usam o último snapshot válido. EXPIRED segue o [ADR 0010](../architecture/decisions/0010-experiencia-expired.md).

O painel identifica a oferta por serviço de origem, menu de origem, preço atual e status, quando esses dados existirem. Não inventa nome para a oferta. Menu, serviço e janela de horário estão no [ADR 0012](../architecture/decisions/0012-menu-servico-disponibilidade.md).

## Menu, serviço e disponibilidade de origem (C5)

Aprovada pelo fundador em 13 de novembro de 2026. Não altera a escolha de oferta nem a publicação híbrida.

`SourceMenu` é o menu da origem e não é o cardápio do Feels. Guarda `id`, `name` e `externalCode`. Cada categoria de origem pertence a um menu.

`SourceService` aponta um menu por `menuId`. Os tipos documentados incluem `DELIVERY` e `TAKEOUT`. Mais de um serviço pode apontar o mesmo menu. Sem id próprio na especificação consultada, o Feels não inventa um. Chave composta fica para o fornecedor.

`SourceAvailability` guarda janelas de datas e horários da categoria ou da oferta. O status fica no dono. As janelas não comandam a experiência pública da V1. A reconciliação dessas janelas depende dos campos reais.

Ausência num snapshot completo e válido arquiva menu, serviço, categoria e oferta, sem apagar o histórico e sem trocar `source_offer_id`. Carga parcial ou inválida não arquiva. `AuditEvent` não faz parte desta decisão.

Registro: [ADR 0012](../architecture/decisions/0012-menu-servico-disponibilidade.md).

Registro: [ADR 0011](../architecture/decisions/0011-administracao-ofertas.md).

## Permissões

Todos os membros de um restaurante têm as mesmas permissões funcionais na V1.

Ações críticas exigem confirmação explícita:

- Exclusão de restaurante.
- Remoção de integração.
- Alteração de credenciais.
- Remoção de usuários.
- Publicação ou reversão de versões, quando aplicável.

A confirmação não substitui autenticação nem autorização. Registrar essas operações em histórico de auditoria é **recomendação técnica**, não decisão confirmada.

## Categorias

O modelo aceita categorias de origem e categorias de experiência, independentes. Categorias próprias continuam permitidas. Um produto pertence a apenas uma categoria dentro de cada cardápio.

`ExperienceCategory` não possui `source_category_id`. A origem é derivada por `ExperienceCategory → ExperienceProduct → SourceOffer → SourceCategory`. Uma categoria sem produtos, ou sem ofertas de origem, tem origem vazia.

O nome copiado na criação é o nome comercial. A sincronização atualiza só `SourceCategory` e não altera nome, ordem nem composição da categoria de experiência. Origem arquivada permanece no histórico. O painel calcula o aviso quando algum produto ainda aponta para ela. A categoria e os produtos permanecem. O público segue a oferta escolhida.

Registro: [ADR 0004](../architecture/decisions/0004-categorias-hibridas.md) e [ADR 0013](../architecture/decisions/0013-categorias-independentes.md).

## Entrega por CDN

Aprovada pelo fundador em 14 de novembro de 2026. Não altera a publicação híbrida nem o relógio da freshness.

A navegação pública lê quatro documentos: `identity.json`, `versions/{versionId}.json`, `active.json` e `operational.json`. O Supabase continua fonte da verdade. A CDN distribui. O ponteiro ativo muda por último, depois da versão conferida. Falha de publicação mantém a versão anterior.

O aplicativo lê o documento operacional antes da versão. Em EXPIRED, não baixa o cardápio. A passagem a EXPIRED ocorre no instante em que o prazo acaba. A recuperação depende de nova leitura operacional. Cache da versão é imutável. Ponteiro e documento operacional ficam em 60 segundos. Esses 60 segundos não são a frequência de releitura do aplicativo.

Se a sincronização válida no Supabase não atualizar o documento operacional, o documento anterior permanece, o painel registra a falha e a publicação é tentada de novo. A hora dessa tentativa não substitui o relógio da freshness.

Registro: [ADR 0014](../architecture/decisions/0014-entrega-cdn.md).

## Armazenamento e distribuição

Aprovado pelo fundador em 14 de novembro de 2026. Não altera a publicação híbrida, os quatro documentos nem a fórmula da freshness.

Os documentos públicos ficam num bucket exclusivo do Cloudflare R2. A Cloudflare os distribui num subdomínio separado da navegação. JSON tem regra de cache própria. A versão imutável tem cache longo. `active.json` e `operational.json` ficam em 60 segundos. `identity.json` tem cache curto. Identidade, ponteiro e documento operacional podem ser purgados de forma seletiva.

O restaurante é o host `{restaurantSlug}.{domínio}`. O nome do domínio continua pendente.

A retenção conserva o conjunto maior entre os últimos 90 dias e as últimas 10 versões. A versão ativa, a versão referenciada e a versão anterior para rollback permanecem mesmo fora dessa janela. Versão incompleta e sem referência só sai depois de uma limpeza que confirme a ausência de referência.

A especificação técnica não calcula EXPIRED só com o relógio do aparelho. Usa uma referência de tempo da resposta do servidor e o tempo decorrido no aparelho. Os ADRs 0009, 0010 e 0014 permanecem.

Esta decisão não aprova o R2 como biblioteca de mídia. O [ADR 0007](../architecture/decisions/0007-midia-r2-cdn.md) continua proposta.

Registro: [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md).

## Disponibilidade

Todos os produtos são importados, inclusive os indisponíveis na origem. Indisponíveis não aparecem na experiência pública. Disponibilidade continua no sistema de origem. O Feels não edita disponibilidade operacional. Mudança de disponibilidade não exige republicação.

## Também confirmado no blueprint, fora da tabela

- O Feels não envia alteração operacional de volta ao OpenDelivery.
- Não há programa próprio de fidelidade na V1.
- A primeira integração de protocolo é OpenDelivery, versão 1, com adaptador isolado e caminho para versões posteriores.
- Credenciais não ficam em texto aberto.
- Produto ou oferta ausente num snapshot completo é arquivado, não apagado.
- Multi-tenancy desde a fundação, com RLS. O usuário só acessa restaurantes aos quais está associado. Filtro só no frontend não basta. Credencial de serviço fica no backend.
- Componentes previstos do Supabase: PostgreSQL, Supabase Auth, RLS, Supabase Cron, Supabase Queues ou mecanismo equivalente, Vault ou mecanismo seguro equivalente.

## O que não está confirmado

- Cloudflare R2 como armazenamento permanente de imagens e vídeos. O bucket dos documentos públicos está aceito e não cobre a biblioteca de mídia.
- O nome do domínio. A forma `{restaurantSlug}.{domínio}` está aceita.
- React, TypeScript, Vite e React Router como recomendação inicial de frontend. O app atual já usa essa stack.
- Quality gates, GitHub Actions, preview na Vercel e separação dev, homologação e produção.
- Baixar imagem da origem e usar CRC-32.

A lista completa do que ainda falta decidir está em [open-decisions.md](open-decisions.md).
