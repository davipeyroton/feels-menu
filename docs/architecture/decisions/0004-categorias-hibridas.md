# ADR 0004 — Categorias híbridas e um produto por categoria

- Status: Aceita
- Data: 2026-11-13
- Fonte: [Blueprint v0.4](../../product/blueprint-v0.4.md), seção 4.3

## Decisão

O modelo aceita categorias importadas, categorias criadas no Feels e categorias de experiência com vínculo opcional à origem. Categorias de origem permanecem para sincronização e rastreabilidade.

Um produto aparece em apenas uma categoria dentro de cada cardápio de experiência.

## Em aberto

O efeito de renomear ou remover a categoria de origem está aceito no [ADR 0013](0013-categorias-independentes.md). A origem da categoria de experiência é derivada pelos produtos. Não há `source_category_id`. Esta decisão não altera a regra de um produto por categoria.

A conciliação com várias ofertas do mesmo item foi aceita na C4: uma oferta por produto em cada cardápio. Ver [ADR 0005](0005-experience-product-source-offer.md).
