# Permissões

Fonte de produto: [decisões confirmadas](../../docs/product/decisions.md), seção de permissões. Fonte operacional: governança desta documentação. Agentes não recebem exceção permanente.

Na V1 do produto, membros de um restaurante têm as mesmas permissões funcionais. A matriz abaixo é de agentes e do Davi, não de papéis dentro do restaurante.

| Ação | Agentes especialistas | Chief of Staff | Davi |
|---|---|---|---|
| Ler código | Conforme o charter | Sim | Sim |
| Criar especificação | Conforme o charter | Sim | Sim |
| Modificar código | Só nos arquivos da tarefa e no papel do charter | Coordena, não implementa | Aprova exceção de escopo |
| Executar testes | QA, Frontend, Backend e DevOps, no que o charter permite | Sim | Sim |
| Criar pull request | Engenharia, sempre em rascunho | Sim | Sim |
| Fazer merge | Não | Não | Aprovação |
| Deploy de produção | Não | Não | Aprovação |
| Alterar infraestrutura | DevOps propõe; não aplica nesta etapa | Coordena | Aprovação |
| Alterar dado de produção | Não | Não | Aprovação |
| Migration ou policy de banco | Backend propõe; não aplica sem tarefa aprovada | Coordena | Aprovação |
| Credencial e segredo | Não | Não | Aprovação |
| `specify init` e arquivos do Spec Kit | Não nesta etapa | Não nesta etapa | Aprovação |

Confirmação de ação crítica no produto, quando a função existir, é adicional: excluir restaurante, remover integração, alterar credencial, remover usuário e publicar ou reverter versão, quando aplicável. A confirmação não substitui autenticação nem autorização.

CI, proteção de branch e ambientes não são configurados nesta execução.
