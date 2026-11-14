# ADR 0012 — Menu, serviço e disponibilidade de origem

- Status: Aceita
- Data: 2026-11-13
- Origem: aprovação explícita do fundador (C5)
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)
- Ofertas: [ADR 0011](0011-administracao-ofertas.md). Esta decisão não altera a escolha de oferta.
- Publicação, freshness e EXPIRED: [ADR 0006](0006-publicacao-versionada.md), [ADR 0009](0009-operational-freshness.md) e [ADR 0010](0010-experiencia-expired.md).

## Decisão

`SourceMenu` representa o menu recebido da origem. É distinto de `ExperienceMenu`. Guarda os campos documentados: `id`, `name` e `externalCode`. Cada `SourceCategory` pertence a um `SourceMenu`.

`SourceService` representa o serviço recebido da origem. Os tipos documentados incluem `DELIVERY` e `TAKEOUT`. O serviço aponta um `SourceMenu` por `menuId`. Mais de um serviço pode apontar o mesmo menu. A especificação consultada não documenta um identificador próprio de serviço. O Feels não inventa esse id. Se a identidade persistente depender de chave composta, isso fica para validação com o fornecedor.

`SourceAvailability` guarda as janelas de datas e horários. Só se associa aos donos documentados: categoria ou oferta. O status `AVAILABLE` ou `UNAVAILABLE` permanece no registro dono e não é horário de funcionamento. As janelas não comandam a experiência pública da V1. Campos internos e chaves que a especificação consultada não lista não são inventados. A reconciliação e o arquivamento dessas janelas dependem dos campos reais do fornecedor.

Renomear menu, mudar o `menuId` do serviço ou mover uma oferta de identificador estável para outra categoria ou outro menu atualiza a origem. Não muda a apresentação comercial nem o `source_offer_id`.

Menu, serviço, categoria ou oferta ausente de um snapshot completo e válido é arquivado. A referência permanece. Não há exclusão física. Carga parcial ou inválida não arquiva e não substitui o último snapshot válido. A sincronização não substitui a oferta escolhida.

Registro sem identificador próprio permanece com a identidade pendente quando a origem não trouxer informação suficiente.

`AuditEvent` fica fora desta decisão.

## Consequências

O rótulo da oferta no painel percorre oferta, categoria, menu e serviço, quando a origem enviar esses elos.

O horário de origem fica preservado para uma evolução futura. A V1 pública continua dependendo do estado da oferta escolhida. Não há seleção automática de menu ou serviço por horário.

## Fora desta decisão

Chave persistente do serviço quando não houver id documentado. Campos, reconciliação e arquivamento das janelas de horário. O efeito sobre a categoria de experiência está no [ADR 0013](0013-categorias-independentes.md). `AuditEvent`. Estabilidade dos identificadores no fornecedor do Studios Coffee.
