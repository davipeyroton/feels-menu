# ADR 0005 — Um produto por cardápio, via oferta selecionada

- Status: Aceita
- Data: 2026-11-13
- Origem: aprovação explícita do fundador (C4), sobre a recomendação do [Blueprint v0.4](../../product/blueprint-v0.4.md), seções 6.3 e 14
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)

## Decisão

O Feels importa várias ofertas do mesmo produto. Cada cardápio de experiência seleciona uma única oferta para representá-lo.

`ExperienceProduct` referencia `source_offer_id`.

`source_product_id` é derivado da oferta selecionada ou mantido de forma consistente e validável.

A unicidade é:

`UNIQUE (experience_menu_id, source_product_id)`

O modelo exige integridade referencial para impedir que `source_product_id` discorde do produto apontado por `source_offer_id`.

## Consequências

- Um produto aparece uma vez em cada cardápio.
- O mesmo produto pode aparecer em cardápios diferentes, em categorias diferentes, com ofertas diferentes.
- A ordenação continua independente por cardápio.
- As ofertas não selecionadas permanecem no catálogo de origem.

Exemplo aceito: Cappuccino Delivery a R$ 15 e Cappuccino Takeout a R$ 13 coexistem na origem. Um cardápio escolhe só uma.

## Fora desta decisão

Como o admin apresenta as ofertas distintas ao restaurante continua pendente. Ver [open-decisions.md](../../product/open-decisions.md).
