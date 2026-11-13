# Sincronização

Fonte: [Blueprint v0.5](../product/blueprint-v0.5.md). A [v0.4](../product/blueprint-v0.4.md) permanece como histórico. Estado: especificação operacional. Não há worker, cron nem fila implementados.

O fornecedor do Studios Coffee não está validado. Limites reais e TTL praticado são desconhecidos.

## Meta e teto

A meta desejada é 15 minutos. Não é garantia independente do fornecedor.

O protocolo V1 documenta `TTL` entre 500 e 86.400 segundos. A política recomendada é:

`intervalo efetivo = max(15 minutos, TTL informado)`

Não consultar antes do intervalo permitido. Usar `lastUpdate` para evitar processamento quando a origem não mudou. Registrar cada execução em `SyncRun`. Problemas vão para `SyncIssue`.

## Passos de uma execução

1. Selecionar conexões cujo intervalo efetivo venceu.
2. Garantir uma execução por conexão. Uma repetição concorrente não entra.
3. Ler o documento completo do estabelecimento. Na V1 do protocolo isso é `GET /v1/merchant`, sem paginação.
4. Se `lastUpdate` for igual ao da última execução concluída, encerrar sem regravar o catálogo e registrar o pulo.
5. Fazer upsert de menus, serviços, categorias, produtos, ofertas, grupos, opções e disponibilidades.
6. Arquivar registros de origem que existiam e não vieram neste snapshot completo. Não apagar a linha.
7. Não escrever em `ProductPresentation`, `ExperienceProduct` nem em mídia `restaurant_upload` ou `feels_content`.
8. Enfileirar download de imagem de origem só quando a URL for nova ou o CRC-32 mudar. Download é recomendação técnica. Ver [pipeline de mídia](media-pipeline.md).
9. Gravar contagens e o resumo de erro no `SyncRun`.

## Idempotência

Repetir a mesma carga não cria segunda linha para o mesmo identificador externo. A chave recomendada é conexão, tipo de entidade e id externo. Se o fornecedor regenerar ids, a reconciliação por código externo do PDV fica como hipótese, não como comportamento confirmado. A estabilidade dos ids está pendente.

## Arquivamento

Produto ou oferta ausente no snapshot completo recebe marca de arquivamento. Histórico, mídia, apresentação e referências de cardápio permanecem. Reaparecer com o mesmo id externo tira o arquivamento.

O que a experiência pública e o admin mostram depois do arquivamento está pendente, com uma regra já confirmada: indisponível não aparece na experiência pública.

## O que esta política não faz

- Não envia dado de volta ao OpenDelivery.
- Não altera preço nem disponibilidade no Feels como edição operacional. Esses campos só mudam porque a origem mudou.
- Não assume webhook. `merchantUpdate` é pergunta ao fornecedor.

A publicação híbrida já está aceita. Este fluxo atualiza só a camada operacional. Não regrava a versão da experiência. O que a experiência pública faz se esta execução falhar ou o dado ficar velho está pendente em [operational-freshness.md](operational-freshness.md).
