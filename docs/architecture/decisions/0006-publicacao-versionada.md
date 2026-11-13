# ADR 0006 — Publicação híbrida

- Status: Aceita
- Data: 2026-11-13
- Origem: aprovação explícita do fundador (C3), sobre a recomendação do [Blueprint v0.4](../../product/blueprint-v0.4.md), seções 8.5 e 14
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)

## Decisão

A publicação tem duas camadas independentes.

A camada de experiência é versionada e congela:

- Seleção de produtos.
- Categorias.
- Ordenação.
- Títulos comerciais.
- Descrições comerciais.
- Imagens e vídeos.
- Configurações visuais.

A camada operacional continua vindo da origem e é atualizada pela sincronização, sem republicação manual:

- Preços.
- Disponibilidade.
- Status dos produtos.
- Arquivamento de produtos removidos.

A experiência pública combina a versão publicada com os dados operacionais mais recentes disponíveis.

## Regras

- A origem continua sendo a fonte da verdade operacional.
- A sincronização não altera a apresentação comercial.
- A publicação não congela preços nem disponibilidade.
- Produtos indisponíveis permanecem ocultos na experiência pública.
- Produtos removidos da origem são arquivados.
- A disponibilidade programada por horário continua fora da V1.

## Fora desta decisão

O comportamento quando a sincronização falhar ou os dados operacionais estiverem desatualizados não está decidido. Alternativas e uma recomendação não aprovada estão em [operational-freshness.md](../../operations/operational-freshness.md).

Como a versão chega ao cliente (CDN ou leitura do banco) também continua pendente.
