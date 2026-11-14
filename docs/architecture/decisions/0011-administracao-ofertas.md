# ADR 0011 — Administração de múltiplas ofertas

- Status: Aceita
- Data: 2026-11-13
- Origem: aprovação explícita do fundador
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)
- Seleção no cardápio: [ADR 0005](0005-experience-product-source-offer.md). Esta decisão não altera essa regra.
- Publicação: [ADR 0006](0006-publicacao-versionada.md). Freshness: [ADR 0009](0009-operational-freshness.md). Tela EXPIRED: [ADR 0010](0010-experiencia-expired.md).

## Decisão

Cada aparição de um produto num cardápio aponta uma oferta de origem. A escolha vale só para aquele cardápio.

Quando existe uma oferta, o sistema pode selecioná-la e persiste o `source_offer_id`. Quando existem várias, o produto só entra naquele cardápio depois que o administrador escolhe uma.

A restrição continua `UNIQUE (experience_menu_id, source_product_id)`. Não há entidade nova para variação comercial.

A sincronização atualiza preço, disponibilidade, status e arquivamento da oferta. Ela não altera o `source_offer_id` escolhido. Uma oferta nova fica no catálogo do produto e não entra em cardápio nenhum. Mudança de preço no mesmo identificador externo atualiza o preço sem republicação.

Oferta escolhida indisponível oculta o produto na experiência pública daquele cardápio. O mesmo vale se ela for arquivada ou sumir de um snapshot completo. Outra oferta do mesmo produto não a substitui. O painel diferencia indisponibilidade de arquivamento. No arquivamento, o administrador pode escolher outra oferta ou retirar o produto daquele cardápio. O registro arquivado da oferta original permanece.

O consumidor vê um produto por cardápio. O preço exibido é o `value` da oferta selecionada. `originalValue` fica armazenado e não implica preço riscado. Em FRESH e STALE vale o último snapshot válido. Em EXPIRED vale o ADR 0010.

No painel, a oferta é identificada pelos dados disponíveis: serviço de origem, menu de origem, preço atual e status operacional. Sem nome na origem, o Feels não inventa um.

## Consequências

O Cappuccino pode usar a oferta Takeout a R$ 13 num cardápio e a oferta Delivery a R$ 15 em outro. Cada cardápio mostra um produto e um preço.

A relação com serviço e menu de origem só rotula a oferta quando a origem a enviar. Esses registros estão aceitos no [ADR 0012](0012-menu-servico-disponibilidade.md). Esta decisão não os redefine.

## Fora desta decisão

Estabilidade dos identificadores no fornecedor do Studios Coffee. Suporte visual de grupos e opções. Preço riscado a partir de `originalValue`. Histórico de trocas de oferta além do registro arquivado. O ciclo da categoria de experiência está no [ADR 0013](0013-categorias-independentes.md).
