# ADR 0010 — Experiência pública de indisponibilidade temporária

- Status: Aceita
- Data: 2026-11-13
- Origem: aprovação explícita do fundador
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)
- Idade do snapshot: [ADR 0009](0009-operational-freshness.md). Esta decisão não altera essa política.
- Publicação: [ADR 0006](0006-publicacao-versionada.md). Esta decisão não altera a publicação híbrida.

## Decisão

Quando o estado operacional é EXPIRED, as rotas `/` e `/:restaurantSlug/:menuSlug` substituem o cardápio por uma tela de indisponibilidade temporária.

A tela mostra somente:

- Nome do restaurante.
- Logotipo.
- Título: "Cardápio temporariamente indisponível".
- Texto: "Não conseguimos confirmar os preços e a disponibilidade agora. Volte daqui a pouco."
- Um botão: "Tentar de novo".

Não entram código de erro, detalhe de sincronização, endereço, horário, Wi-Fi, avaliação do Google, preço, disponibilidade, reels, feed, categorias ou produtos. A mensagem não diz que o restaurante está fechado ou sem produtos.

O botão faz uma nova leitura do estado operacional. Se o estado continuar EXPIRED, a mesma tela permanece. Não há telefone, WhatsApp, link externo nem link para `/hub`.

Desktop e mobile usam o mesmo estado, a mesma mensagem e a mesma ação. O layout se adapta ao dispositivo.

Se o cardápio aberto passar a EXPIRED, a tela substitui a experiência na hora, inclusive um reel em reprodução. O relógio é a última sincronização bem-sucedida e válida, comparada com `max_staleness`. O `lastUpdate` da origem não conta.

Com a página visível, uma nova leitura restaura o cardápio quando o estado voltar a FRESH ou STALE. Não há notificação nem recuperação em segundo plano.

`/hub` continua uma rota independente. Esta decisão não o oferece como alternativa.

## Consequências

A leitura do estado operacional precisa existir sem entregar o snapshot vencido à tela pública.

A frequência dessas leituras fica para a especificação técnica e respeita os limites do fornecedor.

O botão "Tentar de novo" não fecha o CTA geral do showcase.

## Fora desta decisão

Layout pixel a pixel. Frequência de releitura do aplicativo, distinta do cache da CDN. Conteúdo de `/hub` enquanto o cardápio está EXPIRED. A entrega por CDN está no [ADR 0014](0014-entrega-cdn.md). O host do restaurante está no [ADR 0015](0015-armazenamento-distribuicao.md) e não altera esta tela. A fórmula de idade do ADR 0009.
