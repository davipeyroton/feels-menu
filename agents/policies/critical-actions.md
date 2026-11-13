# Ações críticas

Nenhum agente executa sozinho.

## Do produto, quando a função existir

Confirmado no blueprint. Exige confirmação explícita, além de autenticação e autorização:

- Excluir restaurante.
- Remover integração.
- Alterar credencial.
- Remover usuário.
- Publicar ou reverter versão, quando essa operação existir.

Registrar auditoria dessas operações é recomendação, não decisão confirmada.

## Da operação deste repositório

Exige aprovação explícita do Davi em mensagem ou no mecanismo de review, nunca só no chat de um agente:

- Deploy e qualquer escrita em produção, incluindo Vercel e R2.
- Alterar dado de produção.
- Criar ou aplicar migration, policy de RLS ou projeto Supabase.
- Merge na branch principal.
- `specify init`, instalação de ferramenta e geração de arquivo de configuração do Spec Kit.
- Commit e push, salvo pedido explícito.
- Adicionar dependência, inclusive `@playwright/test`.
- Remover a fidelidade simulada do código. Isso pertence à futura migração da experiência pública.

## O que agentes não concluem sem evidência

- Tarefa pronta sem comando e saída.
- Isolamento entre restaurantes sem teste que mostre a tentativa negada.
- Sync idempotente sem segunda execução comparada.
- Fornecedor do Studios Coffee validado sem resposta formal registrada.

CI e proteção de branch reduzem parte desse risco e ainda não estão configurados. Até lá, a aprovação humana é o controle.
