# ADR 0001 — Origem como fonte da verdade operacional

- Status: Aceita
- Data: 2026-11-13
- Fonte: [Blueprint v0.4](../../product/blueprint-v0.4.md), seções 1.1 e 2.1

## Decisão

Sistemas externos respondem por produto, categoria, oferta, preço, disponibilidade e demais dados operacionais do protocolo. O OpenDelivery é a primeira fonte. O Feels guarda uma cópia sincronizada e não envia alteração operacional de volta.

O Feels administra a experiência comercial: imagem, vídeo, título, descrição, organização, ordenação e destaques.

## Consequência

Preço e disponibilidade não têm edição operacional no Feels. A V1 não recebe pedidos e não cria fidelidade própria.
