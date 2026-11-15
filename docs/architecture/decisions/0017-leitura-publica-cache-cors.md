# ADR 0017 — Leitura pública, cache e CORS dos documentos

- Status: Aceita
- Data: 2026-11-14
- Origem: aprovação explícita do fundador
- Referência vigente: [Blueprint v0.5](../../product/blueprint-v0.5.md)
- Entrega: [ADR 0014](0014-entrega-cdn.md), [ADR 0015](0015-armazenamento-distribuicao.md) e [ADR 0016](0016-consumo-documentos-publicos.md). Esta decisão precisa o acesso, o cache e o CORS. Não altera a fórmula `Date + Age` nem os limites de freshness.

## Decisão

### Acesso

Os quatro documentos públicos ficam num bucket exclusivo do Cloudflare R2.

A leitura pública usa um Custom Domain. O endereço `r2.dev` fica desligado.

Quem conhece a URL de um objeto consegue lê-lo. Isso inclui uma versão já gravada e ainda não apontada por `active.json`. A raiz do domínio não lista o bucket.

Escrita e exclusão passam só pela API S3 autenticada. O token tem a permissão Object Read & Write, limitada a esse bucket. A credencial fica só no backend. Não entra no navegador nem no repositório.

Esta arquitetura inicial não usa Worker.

### Cache

- `identity.json`: `Cache-Control: public, max-age=60`. Depois de uma gravação bem-sucedida, a URL é purgada.
- `active.json` e `operational.json`: 60 segundos.
- `versions/{versionId}.json`: cache longo, como no ADR 0015.

O botão "Tentar de novo" faz um GET da mesma URL de `operational.json`, com o cache padrão do navegador. A URL não recebe parâmetro. A requisição não usa `cache: 'no-cache'`, `cache: 'reload'`, bypass nem revalidação forçada na Cloudflare.

A Cloudflare pode responder com a cópia em cache por até 60 segundos. A tentativa não promete recuperação imediata. O ciclo de consulta do ADR 0016 permanece.

### CORS

O bucket permite `GET` e `HEAD` a partir do domínio da aplicação e dos subdomínios de restaurante. A forma prevista é `https://*.{domínio}`. O nome do domínio continua pendente.

Origem de desenvolvimento local só entra quando for necessária, com a porta específica.

`PUT` e `DELETE` não são permitidos ao navegador.

`Date` e `Age` entram em `ExposeHeaders`.

Mudança de CORS é seguida de purga dos objetos afetados. O padrão com curinga não está provado diante de várias origens em cache. Os testes abaixo precedem a implementação do cálculo de freshness.

### Prova antes do cálculo

Antes de implementar o cálculo de idade:

1. Em `MISS`, ler `Date`, `Age` e `cf-cache-status`.
2. Em `HIT`, ler os mesmos campos.
3. Repetir o `HIT` alguns segundos depois e comparar os valores.
4. Confirmar que `Date + Age` é o instante da resposta.
5. Observar o caso em que `Age` não vem.
6. Confirmar que o JavaScript lê `Date` e `Age`.
7. Repetir com subdomínios de restaurantes diferentes.
8. Confirmar que uma origem não recebe cabeçalho CORS preso a outra origem.
9. Alterar o CORS, purgar o cache e repetir.

A fórmula do ADR 0016 não muda nesta decisão. Se a prova mostrar incompatibilidade, o problema é apresentado e nenhuma mudança da fórmula segue sem aprovação.

## Fora desta decisão

O nome do domínio e o rótulo do host dos documentos. O plano da zona Cloudflare. Quem executa a publicação. Slug imutável. O conteúdo de `/hub` em FRESH e STALE. A biblioteca de mídia. O [ADR 0007](0007-midia-r2-cdn.md) continua proposta.
