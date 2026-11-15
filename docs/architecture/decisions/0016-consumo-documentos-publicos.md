# ADR 0016 — Consumo dos documentos públicos

- Status: Aceita
- Data: 2026-11-14
- Origem: aprovação explícita do fundador
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)
- Entrega: [ADR 0014](0014-entrega-cdn.md) e [ADR 0015](0015-armazenamento-distribuicao.md). Esta decisão define como o aplicativo lê os quatro documentos. Não altera o conteúdo deles, o cache da CDN nem a ordem do ponteiro.
- Freshness: [ADR 0009](0009-operational-freshness.md), [ADR 0010](0010-experiencia-expired.md) e [ADR 0014](0014-entrega-cdn.md) permanecem. A fórmula e os limites não mudam.

## Decisão

### Frequência de releitura

Os 60 segundos de `active.json` e `operational.json` continuam sendo cache da CDN. A consulta do aplicativo é outra camada.

- `operational.json` e `active.json` são consultados na entrada da rota de cardápio, na troca de cardápio, no retorno à aba, na tentativa manual e a cada 60 segundos enquanto a página está visível.
- `versions/{versionId}.json` só é consultado quando o ponteiro apresenta uma versão ainda não carregada. Em EXPIRED, a versão do cardápio não é baixada.
- `identity.json` é consultado na entrada do restaurante e no retorno à aba. Fica fora do ciclo de 60 segundos.

Não há consulta em segundo plano nem notificação. A passagem local para EXPIRED ocorre no instante em que a idade passa de `max_staleness`. Ela não espera o próximo ciclo.

FRESH e STALE continuam mostrando o cardápio.

### Referência temporal

O aplicativo obtém o horário da resposta HTTP:

```text
T0 = Date + Age
agora = T0 + (performance.now() - performance.now() no recebimento)
idade = agora - last_successful_sync_at
```

`Age` ausente vale zero. `performance.now()` mede o tempo decorrido desde o recebimento. O relógio de parede do aparelho não entra nesse cálculo e não serve de fallback.

`last_successful_sync_at` e `max_staleness` continuam vindo de `operational.json`. O aplicativo não recalcula o TTL do fornecedor. EXPIRED continua sendo `idade > max_staleness`.

Se `Date` não vier ou não puder ser lido, a leitura não autoriza preço nem disponibilidade. Nas rotas de cardápio, a tela é a do ADR 0010.

A CDN precisa expor `Date` e `Age` ao JavaScript, porque o aplicativo e os documentos ficam em hosts diferentes. O cabeçalho de CORS é `Access-Control-Expose-Headers` com esses dois nomes. Esta decisão não configura a CDN.

Recarregar a página usa a resposta nova como âncora. A âncora anterior não é reutilizada.

### Hub durante EXPIRED

`/hub` continua rota independente. Durante EXPIRED, mostra somente o nome e o logotipo.

Não mostra cardápio, preço, disponibilidade, reels nem feed. Não redireciona para a tela de EXPIRED. A tela pública de EXPIRED não oferece `/hub` como alternativa.

### Tentativa manual

O botão "Tentar de novo" consulta o endereço normal de `operational.json`. A URL não recebe parâmetro para contornar o cache.

A Cloudflare pode responder com a cópia em cache por até 60 segundos. A tentativa não promete recuperação imediata. Se a resposta continuar EXPIRED, a mesma tela permanece.

## Fora desta decisão

O nome do domínio e o nome do subdomínio dos documentos. O plano da zona Cloudflare. O conteúdo do hub quando o cardápio está FRESH ou STALE. Layout pixel a pixel. A biblioteca de mídia. O [ADR 0007](0007-midia-r2-cdn.md) continua proposta.
