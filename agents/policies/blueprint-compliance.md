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
12. O link principal, se a mudança for a experiência pública, abre o cardápio padrão em `/`? O hub fica em `/hub`?
13. A fidelidade simulada só é removida no spec `008-public-experience-multitenant`?
14. A publicação híbrida, se a mudança for publicação, congela só a camada de experiência e deixa preço, disponibilidade, status e arquivamento com a sincronização? A política de dado desatualizado não foi tratada como decidida?
15. Um produto entra uma vez por cardápio, com `source_offer_id` consistente com `source_product_id`?
16. O fornecedor do Studios Coffee não foi dado como validado?
17. A evidência de pronto está em [definition-of-done.md](definition-of-done.md)?

Conflitos C1 a C14 estão em [open-decisions.md](../../docs/product/open-decisions.md). Não os resolva no código sem registro da decisão.
