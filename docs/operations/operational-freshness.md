# Dado operacional desatualizado

Status: **pendente**. Não é decisão. A publicação híbrida já está aceita no [ADR 0006](../architecture/decisions/0006-publicacao-versionada.md). Este arquivo só registra o que ainda falta aprovar.

## O que já vale

Preço, disponibilidade, status e arquivamento vêm da última sincronização bem-sucedida e não exigem republicação. A origem é a fonte da verdade operacional.

## O que não está definido

O que a experiência pública faz quando a sincronização falha ou quando esses dados ficam velhos. Nenhuma idade máxima foi escolhida.

## Alternativas

1. **Interromper na hora.** Se a última sincronização bem-sucedida não for a mais recente tentativa, o cardápio público não é exibido. Preço nenhum aparece como atual.
2. **Último dado conhecido, sem prazo.** A experiência continua com o último snapshot operacional bem-sucedido, por tempo indefinido, sem aviso.
3. **Último dado conhecido até uma idade máxima.** A experiência usa o último snapshot bem-sucedido enquanto ele estiver dentro de um prazo ainda não definido. Depois disso, o cardápio deixa de ser apresentado como atual.
4. **Último dado conhecido, com aviso visível.** Igual à alternativa 2, com uma indicação para quem está vendo o cardápio de que o dado pode estar velho.

## Recomendação para aprovação futura

A alternativa 3. Ela evita esconder o cardápio num intervalo curto e evita mostrar preço antigo sem limite. O prazo não faz parte desta recomendação e precisa ser decidido junto com a política.

Esta recomendação não está aprovada. Não implementar até haver decisão explícita.
