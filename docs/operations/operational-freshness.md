# Dado operacional desatualizado

- Status: aceita
- Data: 13 de novembro de 2026
- Origem: aprovação explícita do fundador. Alternativa 3, com a idade máxima definida nesta página
- Referência de produto: [Blueprint v0.5](../product/blueprint-v0.5.md)
- Registro: [ADR 0009](../architecture/decisions/0009-operational-freshness.md). A tela pública de EXPIRED está no [ADR 0010](../architecture/decisions/0010-experiencia-expired.md).

A publicação híbrida continua a do [ADR 0006](../architecture/decisions/0006-publicacao-versionada.md). Esta página só define até quando o último snapshot operacional válido pode ser mostrado.

## Regra

`effective_sync_interval = max(15 minutos, TTL informado pelo fornecedor)`

`max_staleness = 2 × effective_sync_interval`

Se o TTL do fornecedor for maior que uma hora, a proporção continua. Não há outro teto.

| Intervalo efetivo | Idade máxima |
|---|---|
| 15 minutos | 30 minutos |
| 30 minutos | 60 minutos |
| 1 hora | 2 horas |
| 6 horas | 12 horas |
| 24 horas | 48 horas |

O TTL mínimo documentado no protocolo V1 é 500 segundos. Nesse caso o intervalo efetivo continua 15 minutos, porque 15 minutos é o piso da fórmula.

## O que entra na idade

A idade do snapshot usado na experiência pública é o tempo desde a última sincronização bem-sucedida e válida. Uma tentativa com falha não substitui o snapshot anterior e não zera essa idade.

Quatro marcas, sem misturar:

- **Última tentativa.** Qualquer execução, inclusive a que falhou.
- **Última sincronização bem-sucedida.** A última execução que concluiu com um snapshot completo e válido. Uma leitura completa que confirma o mesmo documento, sem mudança de `lastUpdate`, conta como sucesso: o snapshot anterior permanece e a idade passa a contar dessa confirmação.
- **`lastUpdate` da origem,** quando a origem envia. É o instante em que o fornecedor diz que o documento mudou. Não é a idade do cardápio público e não prova que o conteúdo é recente.
- **Idade do snapshot público.** Tempo desde a última sincronização bem-sucedida e válida. É essa idade que se compara com `max_staleness`.

TTL é o intervalo mínimo para consultar de novo. Não é garantia de que o fornecedor atualizou o cardápio. Uma consulta concluída sem erro também não prova que o conteúdo da origem é recente.

Sincronização parcial ou inválida não substitui o último snapshot completo e válido e não atualiza a hora da última sincronização bem-sucedida.

## Comportamento

- Falha isolada não tira o cardápio do ar na hora.
- Dentro da idade máxima, a experiência pública usa o último snapshot válido.
- Passada a idade máxima, o cardápio não pode ser apresentado como atual. Preço e disponibilidade antigos não aparecem como se fossem atuais.
- A origem continua sendo a fonte da verdade operacional.
- A sincronização continua sem alterar a apresentação comercial.

## Estados

- **FRESH.** Snapshot válido dentro do prazo, sem falha relevante na última execução.
- **STALE.** Houve falha ou atraso, e o último snapshot válido ainda está dentro do prazo.
- **EXPIRED.** A idade do último snapshot válido passou de `max_staleness`.

A experiência pública mostra o cardápio em FRESH e em STALE. Em EXPIRED, as rotas de cardápio mostram a indisponibilidade temporária aceita no [ADR 0010](../architecture/decisions/0010-experiencia-expired.md). Preço e disponibilidade antigos não aparecem como atuais.

O painel administrativo precisa mostrar:

- Estado da integração.
- Data e hora da última sincronização bem-sucedida.
- Idade atual do snapshot.
- Idade máxima permitida.
- Motivo da falha, quando houver.

## Experiência pública em EXPIRED

Aceita pelo fundador em 13 de novembro de 2026. O registro completo está no [ADR 0010](../architecture/decisions/0010-experiencia-expired.md). Esta página não redefine a idade máxima.

Nas rotas `/` e `/{menuSlug}` do host do restaurante, o cardápio sai por inteiro. A tela mostra o nome, o logotipo, o título "Cardápio temporariamente indisponível" e o texto "Não conseguimos confirmar os preços e a disponibilidade agora. Volte daqui a pouco." O único botão é "Tentar de novo", que relê o estado. Se continuar EXPIRED, a mesma tela permanece.

Não há código de erro, detalhe de sincronização, endereço, horário, Wi-Fi, avaliação, telefone, WhatsApp ou link externo. `/hub` não é oferecido como alternativa. Desktop e mobile compartilham estado, mensagem e ação.

A troca para EXPIRED substitui na hora o cardápio aberto, inclusive um reel. Com a página visível, FRESH ou STALE restauram o cardápio. Não há notificação nem recuperação em segundo plano. A releitura está no [ADR 0016](../architecture/decisions/0016-consumo-documentos-publicos.md).

## O que esta decisão não fecha

O transporte da versão publicada está aceito no [ADR 0014](../architecture/decisions/0014-entrega-cdn.md). O armazenamento e a CDN estão no [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md). A releitura, o cálculo com `Date` e `Age` e o hub durante EXPIRED estão no [ADR 0016](../architecture/decisions/0016-consumo-documentos-publicos.md). A fórmula desta página permanece. O TTL real do fornecedor do Studios Coffee continua desconhecido. Os 60 segundos do documento operacional são cache da CDN, não o ciclo de consulta do aplicativo.

## Contexto anterior

Antes da aprovação, quatro alternativas estavam em aberto. A alternativa 3 foi a escolhida. As outras não valem:

1. Interromper a exibição pública na primeira falha.
2. Manter o último dado conhecido sem prazo.
3. Manter o último dado conhecido até uma idade máxima. Aceita, com a fórmula desta página.
4. Manter o último dado conhecido com aviso visível para quem vê o cardápio. Não aceita. Esse aviso, sobre dado antigo ainda exibido, não faz parte da decisão. A tela que substitui o cardápio está no [ADR 0010](../architecture/decisions/0010-experiencia-expired.md). O admin, sim, mostra o estado.
