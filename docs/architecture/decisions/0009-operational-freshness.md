# ADR 0009 — Operational freshness

- Status: Aceita
- Data: 2026-11-13
- Origem: aprovação explícita do fundador
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)
- Detalhe: [operational-freshness.md](../../operations/operational-freshness.md)

## Decisão

Adotar a alternativa 3: usar o último snapshot operacional bem-sucedido e válido até uma idade máxima.

`effective_sync_interval = max(15 minutos, TTL informado pelo fornecedor)`

`max_staleness = 2 × effective_sync_interval`

TTL acima de uma hora não cria outro limite. A proporção segue. Exemplos: 15 minutos permitem 30; 1 hora permite 2; 24 horas permitem 48.

A idade comparada com esse limite é o tempo desde a última sincronização bem-sucedida e válida. Não é a hora da última tentativa e não é o `lastUpdate` da origem.

Falha, snapshot parcial ou snapshot inválido não substituem o último snapshot completo e válido.

Estados: `FRESH`, `STALE` e `EXPIRED`. A experiência pública mostra o cardápio em FRESH e STALE. Em EXPIRED mostra indisponibilidade temporária, sem apresentar preço ou disponibilidade antigos como atuais.

## Relação com o ADR 0006

O [ADR 0006](0006-publicacao-versionada.md) separa a versão da experiência dos dados operacionais. Este ADR só define por quanto tempo o último snapshot operacional válido pode ser usado. Não altera o que a publicação congela.

## Fora desta decisão

A experiência pública da indisponibilidade temporária está aceita no [ADR 0010](0010-experiencia-expired.md). Esta decisão não a redefine. A entrega por CDN está no [ADR 0014](0014-entrega-cdn.md). A referência de tempo do servidor, no [ADR 0015](0015-armazenamento-distribuicao.md), não altera esta fórmula. O TTL praticado pelo fornecedor do Studios Coffee continua fora.
