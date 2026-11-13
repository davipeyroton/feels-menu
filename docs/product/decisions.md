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
| Menus e serviços OpenDelivery | Importar todos | Blueprint v0.4, seção 4 |
| Restaurante piloto | Studios Coffee | Blueprint v0.4, seção 4 |
| Backend | Supabase | Blueprint v0.4, seção 4 |
| Rotas públicas (C2) | `/` é o cardápio padrão; `/hub` é o hub; `/:restaurantSlug/:menuSlug` abre um cardápio específico | Fundador, 13 de novembro de 2026 |
| Publicação (C3) | Híbrida: experiência versionada e operação atualizada pela sincronização | Fundador, 13 de novembro de 2026 |
| Oferta no cardápio (C4) | Uma oferta por produto em cada cardápio; unicidade por `experience_menu_id` e `source_product_id` | Fundador, 13 de novembro de 2026 |

## Link público (C2)

Cada restaurante tem um link principal. Esse link abre diretamente o cardápio padrão.

Rotas conceituais:

- `/` — cardápio padrão do restaurante.
- `/hub` — hub institucional e de descoberta.
- `/:restaurantSlug/:menuSlug` — acesso direto a um cardápio específico.

O hub continua no produto. Não é a página inicial obrigatória do link principal.

O código atual ainda abre o hub em `/` quando não há `view`. A migração entra na especificação futura da experiência pública. O código não muda nesta documentação.

## Publicação híbrida (C3)

A camada de experiência é versionada e congela seleção de produtos, categorias, ordenação, títulos comerciais, descrições comerciais, imagens, vídeos e configurações visuais.

A camada operacional vem da origem e é atualizada pela sincronização, sem republicação manual: preços, disponibilidade, status e arquivamento.

A experiência pública combina a versão publicada com os dados operacionais mais recentes disponíveis.

A origem continua sendo a fonte da verdade operacional. A sincronização não altera a apresentação comercial. A publicação não congela preços nem disponibilidade. Indisponíveis ficam ocultos. Removidos da origem são arquivados. Disponibilidade por horário continua fora da V1.

Registro: [ADR 0006](../architecture/decisions/0006-publicacao-versionada.md).

O que fazer se a sincronização falhar ou o dado operacional estiver velho **não** está decidido. Ver [operational-freshness.md](../operations/operational-freshness.md).

## Um produto por cardápio (C4)

Várias ofertas do mesmo produto são importadas e preservadas. Cada cardápio seleciona uma só para aquele produto.

Exemplo: Cappuccino Delivery a R$ 15 e Cappuccino Takeout a R$ 13. As duas ficam na origem. Um cardápio escolhe uma.

Unicidade: `UNIQUE (experience_menu_id, source_product_id)`.

`ExperienceProduct` referencia `source_offer_id`. `source_product_id` deriva da oferta selecionada ou permanece consistente e validável. A integridade referencial impede divergência entre os dois.

O mesmo produto pode estar em outro cardápio, em outra categoria, com outra oferta e com outra ordem.

Registro: [ADR 0005](../architecture/decisions/0005-experience-product-source-offer.md).

Como o admin mostra as várias ofertas continua pendente.

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

O modelo aceita categorias importadas, categorias criadas no Feels e categorias de experiência com vínculo opcional à categoria de origem.

Categorias de origem permanecem para sincronização e rastreabilidade. Categorias próprias existem para organização comercial.

Um produto pertence a apenas uma categoria dentro de cada cardápio de experiência. A regra C4 torna isso uma consequência de aparecer uma vez no cardápio.

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

- Cloudflare R2 e CDN com domínio próprio.
- React, TypeScript, Vite e React Router como recomendação inicial de frontend. O app atual já usa essa stack.
- Quality gates, GitHub Actions, preview na Vercel e separação dev, homologação e produção.
- Política `intervalo efetivo = max(15 minutos, TTL informado)`.
- Baixar imagem da origem e usar CRC-32.
- Política de dado operacional desatualizado.
- Apresentação das várias ofertas no admin.

A lista completa do que ainda falta decidir está em [open-decisions.md](open-decisions.md).
