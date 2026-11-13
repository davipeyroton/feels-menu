# Definição de pronto

Uma tarefa está pronta quando todos os itens abaixo são verdadeiros.

1. O spec ou a demanda cita a decisão confirmada ou marca a pendência. Requisito inventado não conta.
2. O diff fica nos arquivos listados na tarefa. Fora disso, há explicação e aprovação.
3. Nenhum arquivo de produção, credencial, migration ou workflow foi alterado, salvo tarefa que o Davi aprovou para isso.
4. A evidência está no pull request: comando executado e saída. Mudança visível inclui verificação da interface, não só screenshot isolado.
5. QA registrou veredito por critério. `partial` e `failed` não fecham a tarefa.
6. O relatório não alega teste, medição ou reprodução que não aconteceu.
7. Se a mudança toca vídeo, feed ou reels, a comparação com `docs/performance/` foi feita ou declarada como não executada.
8. O pull request permanece em rascunho até o Davi declarar prontidão. O agente não marca revisão humana no lugar dele.

Nesta etapa de documentação, pronto significa: só arquivos `.md`, links internos válidos, C2, C3 e C4 registradas como aceitas, a política de dado operacional desatualizado ainda pendente, e `git status` sem código de aplicação.

Ausência de CI não autoriza declarar quality gate verde. O gate ainda não existe.
