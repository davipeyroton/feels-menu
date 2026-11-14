# Sincronização

Fonte: [Blueprint v0.5](../product/blueprint-v0.5.md). A [v0.4](../product/blueprint-v0.4.md) permanece como histórico. Estado: especificação operacional. Não há worker, cron nem fila implementados.

O fornecedor do Studios Coffee não está validado. Limites reais e TTL praticado são desconhecidos.

## Meta e teto

A meta desejada é 15 minutos. Não é garantia independente do fornecedor.

O protocolo V1 documenta `TTL` entre 500 e 86.400 segundos. A fórmula abaixo está aceita como definição do intervalo da política de freshness ([ADR 0009](../architecture/decisions/0009-operational-freshness.md)):

`effective_sync_interval = max(15 minutos, TTL informado)`

Não consultar antes desse intervalo. O TTL limita a consulta. Ele não garante que o fornecedor tenha alterado o cardápio. Usar `lastUpdate` para evitar reprocessar um documento que não mudou. Registrar cada execução em `SyncRun`. Problemas vão para `SyncIssue`.

## Passos de uma execução

1. Selecionar conexões cujo intervalo efetivo venceu.
2. Garantir uma execução por conexão. Uma repetição concorrente não entra.
3. Ler o documento completo do estabelecimento. Na V1 do protocolo isso é `GET /v1/merchant`, sem paginação.
4. Se a leitura for completa e válida e o `lastUpdate` for igual ao do último snapshot válido, não regravar o catálogo. Essa confirmação é uma sincronização bem-sucedida: a idade pública passa a contar dela. O `lastUpdate` fica registrado à parte e não é essa idade.
5. Fazer upsert de menus, serviços, categorias, produtos, ofertas, grupos, opções e disponibilidades.
6. Arquivar registros de origem que existiam e não vieram neste snapshot completo. Não apagar a linha.
7. Não escrever em `ProductPresentation`, `ExperienceCategory`, `ExperienceProduct` nem em mídia `restaurant_upload` ou `feels_content`. Não alterar `source_offer_id`.
8. Enfileirar download de imagem de origem só quando a URL for nova ou o CRC-32 mudar. Download é recomendação técnica. Ver [pipeline de mídia](media-pipeline.md).
9. Gravar contagens e o resumo de erro no `SyncRun`.

## Idempotência

Repetir a mesma carga não cria segunda linha para o mesmo identificador externo. A chave recomendada é conexão, tipo de entidade e id externo. Se o fornecedor regenerar ids, a reconciliação por código externo do PDV fica como hipótese, não como comportamento confirmado. A estabilidade dos ids está pendente.

## Arquivamento

Produto ou oferta ausente no snapshot completo e válido recebe marca de arquivamento. O mesmo vale para menu, serviço e categoria de origem. Histórico, mídia, apresentação e referências de cardápio permanecem. Reaparecer com o mesmo id externo tira o arquivamento. Registro sem id próprio não ganha identidade inventada.

Oferta escolhida indisponível ou arquivada oculta o produto na experiência pública daquele cardápio. A sincronização não aponta outra oferta. O painel diferencia indisponibilidade de arquivamento. Detalhe no [ADR 0011](../architecture/decisions/0011-administracao-ofertas.md) e no [ADR 0012](../architecture/decisions/0012-menu-servico-disponibilidade.md). A janela de horário não comanda essa exibição. A reconciliação dessas janelas depende dos campos reais do fornecedor. A categoria de experiência não é reescrita. Sua origem é derivada pelos produtos, no [ADR 0013](../architecture/decisions/0013-categorias-independentes.md).

## O que esta política não faz

- Não envia dado de volta ao OpenDelivery.
- Não altera preço nem disponibilidade no Feels como edição operacional. Esses campos só mudam porque a origem mudou.
- Não assume webhook. `merchantUpdate` é pergunta ao fornecedor.

A publicação híbrida já está aceita. Este fluxo atualiza só a camada operacional. Não regrava a versão da experiência.

Falha, carga parcial ou carga inválida não substituem o último snapshot completo e válido e não atualizam a hora da última sincronização bem-sucedida. A experiência pública segue [operational-freshness.md](operational-freshness.md): `max_staleness = 2 × effective_sync_interval`. TTL maior que uma hora não cria outro teto.
