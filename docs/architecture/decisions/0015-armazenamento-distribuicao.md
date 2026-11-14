# ADR 0015 — Armazenamento e distribuição dos documentos públicos

- Status: Aceita
- Data: 2026-11-14
- Origem: aprovação explícita do fundador
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)
- Entrega: [ADR 0014](0014-entrega-cdn.md). Esta decisão escolhe onde os quatro documentos ficam e como chegam ao consumidor. Não altera o conteúdo de cada documento, a ordem do ponteiro nem a freshness.
- Freshness: [ADR 0009](0009-operational-freshness.md), [ADR 0010](0010-experiencia-expired.md) e [ADR 0014](0014-entrega-cdn.md) permanecem. Esta decisão só impede que EXPIRED dependa apenas do relógio do aparelho.

## Decisão

### Armazenamento

Os quatro documentos públicos ficam no Cloudflare R2, num bucket exclusivo.

Esse bucket não recebe imagem nem vídeo da biblioteca de mídia. Esta decisão não aprova o R2 como armazenamento permanente de mídia. O [ADR 0007](0007-midia-r2-cdn.md) continua proposta.

O Supabase continua fonte da verdade da publicação e dos dados operacionais.

### CDN

A Cloudflare distribui esses documentos. O host dos documentos é um subdomínio próprio, separado do host de navegação do aplicativo.

O endereço `r2.dev` não serve esses documentos. JSON entra no cache por regra específica.

- A versão imutável tem cache longo. O endereço muda com o `versionId`.
- `active.json` e `operational.json` têm cache de 60 segundos.
- `identity.json` tem cache curto e é atualizado quando a identidade muda.

A purga seletiva permanece disponível para os documentos substituíveis: identidade, ponteiro e documento operacional. A versão imutável não depende de purga.

### Endereço público

O nome do domínio continua pendente. A forma está aceita.

- `{restaurantSlug}.{domínio}/` abre o cardápio padrão.
- `{restaurantSlug}.{domínio}/{menuSlug}` abre um cardápio específico.
- `{restaurantSlug}.{domínio}/hub` abre o hub.

O restaurante é o host. Nesse host, `/` continua o cardápio padrão e `/hub` continua o hub. O cardápio específico fica em `/{menuSlug}`.

Os documentos da CDN usam outro subdomínio, com os caminhos do ADR 0014.

### Retenção

Permanece o conjunto maior entre as versões dos últimos 90 dias e as últimas 10 versões.

Além disso, nunca se apaga:

- a versão ativa;
- uma versão ainda referenciada;
- a versão anterior, que permanece disponível para rollback mesmo fora dessa janela.

Versão incompleta e sem referência pode ser removida por uma limpeza que confirme a ausência de referência antes de apagar.

### Relógio

A especificação técnica trata a diferença entre o relógio do servidor e o relógio do aparelho.

O cálculo de EXPIRED não depende só do relógio local do consumidor. A especificação usa uma referência de tempo vinda da resposta do servidor e mede o tempo decorrido no aparelho.

A fórmula `max_staleness = 2 × effective_sync_interval`, a tela do ADR 0010 e os documentos do ADR 0014 permanecem.

## Fora desta decisão

O nome do domínio e o nome do subdomínio dos documentos. O plano da zona Cloudflare. A frequência de releitura do aplicativo. O campo ou cabeçalho concreto da referência de tempo, dentro da direção desta decisão. O conteúdo de `/hub` durante EXPIRED. A biblioteca de mídia. O [ADR 0007](0007-midia-r2-cdn.md).
