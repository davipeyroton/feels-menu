# Segurança

Fonte: [Blueprint v0.4](../product/blueprint-v0.4.md), seções 4.2, 6.2 e 8.2, e [decisões confirmadas](../product/decisions.md). Não há policy de banco implementada.

## Isolamento

- Toda entidade de restaurante tem `restaurant_id` direto ou por relação controlada.
- RLS garante que o usuário só acessa restaurantes da sua `RestaurantMembership`.
- Filtro apenas no frontend não é isolamento.
- RLS é o mecanismo previsto de isolamento. Implementar isso desde a primeira migration é recomendação técnica prioritária do blueprint (seção 14), ainda não executada. Nenhuma migration é criada nesta etapa.
- Teste de isolamento faz parte do aceite da Fase 2: o usuário de um restaurante não lê nem grava o outro.

## Credenciais

- Credencial de integração não fica em texto aberto. `IntegrationConnection.credentials_reference` aponta para Vault ou mecanismo equivalente.
- Credencial de serviço do Supabase fica só no backend, em ambiente de sync e administração.
- Agentes não recebem segredo de produção, de R2 nem de Supabase.
- O `.env.production` atual contém a origem pública de mídia, não uma chave. Mesmo assim, agentes não alteram esse arquivo sem aprovação.

## Autorização da V1

Todos os membros do restaurante têm as mesmas permissões funcionais. Confirmado.

Ações que exigem confirmação explícita:

- Excluir restaurante.
- Remover integração.
- Alterar credencial.
- Remover usuário.
- Publicar ou reverter versão, quando essa operação existir.

A confirmação é proteção contra acidente. Ela não substitui autenticação nem autorização.

Histórico de auditoria dessas operações é recomendação técnica. A entidade `AuditEvent` está proposta no [modelo de domínio](domain-model.md) e não está confirmada.

## O que o Feels não faz na V1

- Não grava preço nem disponibilidade de volta na origem.
- Não recebe pedido nem pagamento.
- Não cria programa próprio de fidelidade.
- A experiência pública da V1 não pede cadastro do consumidor. A fidelidade simulada do app atual coleta nome, telefone e data no browser e não envia a lugar nenhum. Ela sai na migração futura da experiência pública, sem mudança de código agora.

## Produção

Deploy, dado de produção, credencial, migration e merge continuam sujeitos a aprovação explícita do Davi. CI e proteção de branch ainda não estão configurados. Ver [ações críticas](../../agents/policies/critical-actions.md).
