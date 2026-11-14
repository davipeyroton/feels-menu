# ADR 0014 — Entrega da experiência publicada via CDN

- Status: Aceita
- Data: 2026-11-14
- Origem: aprovação explícita do fundador
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)
- Publicação: [ADR 0006](0006-publicacao-versionada.md). Esta decisão não altera o que a publicação congela.
- Freshness e EXPIRED: [ADR 0009](0009-operational-freshness.md) e [ADR 0010](0010-experiencia-expired.md).

## Decisão

A experiência publicada chega ao consumidor por CDN. A navegação pública não consulta o banco.

O Supabase continua fonte da verdade da publicação e dos dados operacionais. O armazenamento guarda os documentos. A CDN os distribui. Ela não decide freshness e não modifica preço.

Quatro documentos, no endereço público ainda não escolhido:

- `/{restaurantSlug}/identity.json` — nome e logotipo.
- `/{restaurantSlug}/menus/{menuSlug}/versions/{versionId}.json` — versão imutável da experiência, sem preço vivo.
- `/{restaurantSlug}/menus/{menuSlug}/active.json` — ponteiro da versão ativa daquele cardápio.
- `/{restaurantSlug}/operational.json` — projeção com `value`, status, arquivamento, `last_successful_sync_at` e `max_staleness`.

Cada publicação gera um `versionId` novo. O arquivo da versão é imutável. Ele precisa existir e passar na verificação de integridade antes da ativação. O ponteiro é atualizado por último. Se a publicação falha, a versão anterior continua ativa. Versões anteriores permanecem. Rollback é apontar o ponteiro para uma versão já validada, com confirmação de ação crítica.

O aplicativo lê `operational.json` antes da versão do cardápio. Em EXPIRED, não baixa essa versão. A identidade continua disponível para a tela do ADR 0010. A idade usa `last_successful_sync_at` e `max_staleness`. A passagem para EXPIRED ocorre no aplicativo no instante em que o prazo acaba, mesmo sem nova requisição. A recuperação depende de uma nova leitura operacional em FRESH ou STALE. "Tentar de novo" relê na hora.

Cache: versão imutável, identificada pela versão. Ponteiro e documento operacional, 60 segundos. Identidade, cache curto, atualizado quando a marca muda. Os 60 segundos são política da CDN. Não garantem que o aplicativo perceba a recuperação nesse intervalo. A frequência de releitura do aplicativo fica para a especificação técnica.

Se a sincronização válida termina no Supabase e a troca do documento operacional falha, o documento antigo não conta como atualizado. O último documento publicado permanece. O painel registra a falha de entrega. A publicação do documento é tentada de novo. A hora dessa tentativa não substitui o relógio da freshness. Se o documento disponível passa do prazo, o aplicativo mostra EXPIRED e não trata preço nem disponibilidade antigos como atuais.

A sincronização não grava versão nem ponteiro. A publicação não grava o documento operacional.

`/hub` não entra nesta entrega.

## Fora desta decisão

O armazenamento, a CDN, a forma do endereço e a retenção estão aceitos no [ADR 0015](0015-armazenamento-distribuicao.md). Esta decisão não os redefine. O nome do domínio e a frequência de releitura do aplicativo continuam fora. O [ADR 0007](0007-midia-r2-cdn.md) continua proposta.
