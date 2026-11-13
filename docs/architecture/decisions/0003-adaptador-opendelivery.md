# ADR 0003 — Adaptador OpenDelivery V1

- Status: Aceita
- Data: 2026-11-13
- Fonte: [Blueprint v0.4](../../product/blueprint-v0.4.md), seções 5.2 e 7.1

## Decisão

A primeira integração usa a versão 1 do OpenDelivery, atrás de um adaptador. O domínio não depende do formato do protocolo. Versões posteriores entram por outro adaptador, sem reescrever a experiência.

A V1 importa todos os menus e serviços disponibilizados. Não assume uma única oferta nem preços iguais entre ofertas.

## Limite

Aceitar o adaptador não valida o fornecedor do Studios Coffee. A conexão real continua bloqueada até as respostas da seção 15.1 do blueprint. Ver [integração](../integration-opendelivery.md).
