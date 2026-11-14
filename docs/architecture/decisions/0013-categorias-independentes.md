# ADR 0013 — Categorias independentes e origem derivada

- Status: Aceita
- Data: 2026-11-13
- Origem: aprovação explícita do fundador
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)
- Fecha o ponto em aberto do [ADR 0004](0004-categorias-hibridas.md). Não altera a regra de um produto por categoria.
- Publicação: [ADR 0006](0006-publicacao-versionada.md). Oferta escolhida: [ADR 0011](0011-administracao-ofertas.md). Origem: [ADR 0012](0012-menu-servico-disponibilidade.md).

## Decisão

`SourceCategory` e `ExperienceCategory` são independentes. `ExperienceCategory` não tem `source_category_id`. Não há relação N:N nem entidade entre as duas. Categorias próprias continuam permitidas.

A origem de uma categoria de experiência é derivada das ofertas dos produtos colocados nela:

`ExperienceCategory → ExperienceProduct → SourceOffer → SourceCategory`

Uma origem aparece uma vez. Várias origens aparecem como a lista distinta. Categoria própria sem essas ofertas, ou categoria sem produtos, tem origem vazia.

Na criação a partir de uma categoria de origem, o painel pode copiar o nome. O texto copiado passa a ser o nome comercial. A sincronização não o atualiza. Renomear a origem altera só `SourceCategory`.

A categoria de origem arquivada permanece no histórico. Se produtos da categoria de experiência ainda apontam para ofertas dessa origem, o painel calcula o aviso. A categoria e os produtos permanecem. O público segue o estado da oferta escolhida.

A sincronização atualiza a origem. Não altera nome, ordem nem composição da categoria de experiência. Reclassificar o produto na origem muda a informação derivada mostrada no painel. Carga parcial ou inválida não substitui o snapshot válido. Não há escrita nova na camada de experiência.

Um produto continua em uma única categoria por cardápio.

## Consequências

"Cafés da casa" pode mostrar só Cafés. "Destaques" pode mostrar Cafés e Sobremesas. Uma categoria vazia não mostra origem.

O aviso de origem arquivada usa os registros já arquivados. Não depende de coluna nova.

## Fora desta decisão

Layout do aviso no painel. Suporte visual de grupos e opções. `AuditEvent`.
