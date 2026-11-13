# Integração OpenDelivery

Fonte de produto: [Blueprint v0.4](../product/blueprint-v0.4.md), seção 7. Fonte de protocolo consultada em 13 de novembro de 2026:

- OpenAPI v1.7.1 em `Abrasel-Nacional/opendelivery` (`openapi.yaml`).
- Guia de menus V2 em `https://docs.opendelivery.com.br/protocol/menu/`.
- Repositório `Abrasel-Nacional/opendelivery-v2`.

O fornecedor do Studios Coffee não foi consultado. Nada abaixo afirma que esse fornecedor implementa o protocolo, libera acesso sem pedidos ou aceita consulta a cada 15 minutos.

## Protocolo e fornecedor

OpenDelivery não hospeda uma API central com todos os restaurantes. O Software Service (PDV ou gestor) expõe os dados do estabelecimento. O Feels, na V1, faria o papel de quem lê o catálogo, sem receber pedidos.

Cada fornecedor precisa autorizar esse acesso. Modelo comercial, credencial e limites são do fornecedor. A validação é pré-requisito da integração real e está bloqueante em [open-decisions.md](../product/open-decisions.md).

O scraping de `francisco.sipfloweb.com` que gerou `data/menu-snapshot.json` não é evidência do fornecedor.

## Versão

Decisão de arquitetura confirmada no blueprint: começar pela versão 1, com adaptador isolado, deixando caminho para versões posteriores. [ADR 0003](decisions/0003-adaptador-opendelivery.md).

A V2.0.0-rc está em validação pública e pode mudar. Ela troca o webhook monolítico por snapshot e CRUD. Não é a base da V1.

## O que a V1 do protocolo documenta

Fatos da especificação v1.7.1. Não são capacidades do fornecedor do piloto.

### Leitura do catálogo

`GET /v1/merchant` é hospedado pelo Software Service. A URL é única por estabelecimento. O caminho terminando em `/merchant` é recomendado, não obrigatório. A resposta cobre um único estabelecimento: dados básicos, serviços e cardápios.

Autenticação desse GET: a especificação diz que **apiKey é opcional** e que é preciso confirmar com quem hospeda o endpoint. OAuth2 (`POST /oauth/token`, client credentials, escopo `od.all`) protege rotas hospedadas por quem consome pedidos e atualizações, como `merchantStatus` e `merchantOnboarding`.

Não há paginação. O documento vem inteiro.

### Atualização

O objeto `Merchant` exige `lastUpdate` e `TTL`. `TTL` é inteiro em segundos, mínimo 500 e máximo 86.400. A especificação diz para consultar de novo quando o TTL expira.

Webhook V1: `POST /merchantUpdate`, hospedado por quem consome, é opcional. O Software Service avisa que houve mudança. Sem resposta 200, o reenvio segue a política desse Software Service.

A V2 diz que não há webhook de delta de catálogo no MVP. Não assumir webhook para o piloto.

A especificação V1 não publica limite de requisição por fornecedor.

### Modelo de cardápio

Relações que o Feels deve preservar, sem assumir uma oferta única nem preços iguais:

- Menu: `id`, `name`, `externalCode`, lista de categorias. Precisa estar ligado a um Service (`DELIVERY` ou `TAKEOUT`) por `menuId` para a aplicação de pedidos exibir.
- Category: `id`, `index`, `name`, `description`, `externalCode`, `status`, imagem, disponibilidades e ofertas.
- Item: `id`, `name` (até 150 caracteres), `description`, `externalCode`, `status`, imagem, informação nutricional (inclui dieta, com valor `VEGAN`), unidade e EAN.
- ItemOffer: `id`, `itemId`, `index`, `status`, `price` (`value`, `originalValue`, `currency`), disponibilidades e grupos de opção.
- OptionGroup: `id`, `index`, `name`, `status`, mínimo, máximo, `priceMethod` (`SUM`, `MAX` ou `AVG`) e opções.
- Option: `id`, `itemId`, `index`, `status`, preço e máximo.
- Availability: datas e horários. `status` `AVAILABLE` ou `UNAVAILABLE` é indisponibilidade inesperada, não horário de funcionamento.

Imagem: `URL` e `CRC-32`. JPEG, PNG, GIF ou WEBP, menos de 10 MB. A imagem simples também exige largura e altura entre 320 e 1144 px. A especificação avisa que a URL pode deixar de valer e que o cliente deve baixar o arquivo. O CRC-32 serve para saber se o arquivo mudou.

Não há, no GET completo, um evento separado de remoção. Sumir do documento é o sinal de remoção na V1.

## Mapeamento para o domínio Feels

| Protocolo V1 | Domínio Feels | Nota |
|---|---|---|
| URL do merchant, apiKey se houver, `id` | `IntegrationConnection` | Segredo no cofre |
| `basicInfo` | Referência do restaurante | Não substitui a marca configurada no Feels |
| Menu | `SourceMenu` recomendado | Não vira `ExperienceMenu` |
| Service | `SourceService` recomendado | Importar todos, decisão confirmada |
| Category | `SourceCategory` | Preservar mesmo sem uso no cardápio |
| Item | `SourceProduct` | Identidade do produto |
| ItemOffer | `SourceOffer` | Preço e disponibilidade da oferta |
| OptionGroup / Option | `SourceOptionGroup` / `SourceOption` | Suporte visual na V1 ainda pendente |
| Availability | `SourceAvailability` recomendado | Uso por horário é Evolução 2 |
| Image | `MediaAsset` com origem `source` | Download é recomendação técnica |

`ExperienceMenu` é cardápio criado no Feels. Não é o Menu do protocolo.

## Sincronização

Meta desejada: 15 minutos. É meta operacional, não garantia contra a regra do fornecedor.

Política **recomendada** no blueprint:

`intervalo efetivo = max(15 minutos, TTL informado)`

Também recomendado: não consultar antes do intervalo permitido; usar `lastUpdate` para não reprocessar; registrar cada execução; sync idempotente. A implementação ainda considera os limites reais do fornecedor, que a especificação não fixa.

Produto ou oferta ausente num snapshot completo é arquivado, não apagado. Decisão confirmada.

Imagens: baixar, registrar origem, usar CRC-32 quando existir, gerar versões e preservar mídia do restaurante e do Feels. Isso é recomendação técnica do blueprint.

Detalhe operacional: [sincronização](../operations/synchronization.md).

## Perguntas que continuam sem resposta

As dez perguntas da seção 15.1 do blueprint. Nenhuma foi respondida para o Studios Coffee.
