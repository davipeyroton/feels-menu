# Conformidade com o blueprint

Todo spec e todo pull request de implementação responde sim ou não, com ponteiro para o arquivo. "Não se aplica" precisa de uma frase.

1. A mudança evita transformar o Feels em fonte da verdade de preço ou disponibilidade?
2. A mudança evita enviar dado operacional de volta ao OpenDelivery?
3. A mudança evita pedido, checkout e fidelidade própria na V1?
4. Se cria tabela de tenant, há `restaurant_id` rastreável e RLS previsto na mesma entrega? RLS desde a primeira migration é recomendação prioritária, não opcional esquecida.
5. Se importa catálogo, importa todos os menus e serviços, inclusive item indisponível?
6. A experiência pública oculta indisponível?
7. Um produto continua em uma única categoria por cardápio?
8. Ordem e seleção de um cardápio deixam os outros intactos?
9. O sync deixa de escrever em apresentação comercial e em mídia `restaurant_upload` ou `feels_content`?
10. Ausência no snapshot completo arquiva, em vez de apagar?
11. Credencial fica fora de texto aberto e fora do diff?
12. O link principal, se a mudança for a experiência pública, abre o cardápio padrão em `/` no host `{restaurantSlug}.{domínio}` do [ADR 0015](../../docs/architecture/decisions/0015-armazenamento-distribuicao.md)? O hub fica em `/hub` e o cardápio específico em `/{menuSlug}`?
13. A fidelidade simulada só é removida no spec `008-public-experience-multitenant`?
14. A publicação híbrida, se a mudança for publicação, congela só a camada de experiência e deixa preço, disponibilidade, status e arquivamento com a sincronização? A idade operacional respeita `max_staleness = 2 × effective_sync_interval`, contada da última sincronização bem-sucedida e válida, sem teto extra quando o TTL passa de uma hora? Em EXPIRED, as rotas de cardápio seguem o [ADR 0010](../../docs/architecture/decisions/0010-experiencia-expired.md) e não baixam a versão do cardápio? A navegação pública usa os documentos do [ADR 0014](../../docs/architecture/decisions/0014-entrega-cdn.md), sem consulta direta ao banco? Esses documentos ficam no bucket exclusivo do [ADR 0015](../../docs/architecture/decisions/0015-armazenamento-distribuicao.md), separados da biblioteca de mídia? A retenção preserva a versão ativa, a referenciada e a anterior?
15. Um produto entra uma vez por cardápio, com `source_offer_id` consistente com `source_product_id`? A sincronização deixa esse id como o administrador escolheu? O preço público é o `value` dessa oferta, e oferta indisponível ou arquivada oculta o produto naquele cardápio sem substituição automática?
16. O fornecedor do Studios Coffee não foi dado como validado?
17. A evidência de pronto está em [definition-of-done.md](definition-of-done.md)?

Conflitos C1 a C14 estão em [open-decisions.md](../../docs/product/open-decisions.md). Não os resolva no código sem registro da decisão.
