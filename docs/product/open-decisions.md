# Decisões em aberto

Referência vigente: [Blueprint v0.5](blueprint-v0.5.md). A [v0.4](blueprint-v0.4.md) permanece como histórico. Decisões aceitas: [decisions.md](decisions.md).

Dono padrão: Davi, até delegação explícita. Itens de fornecedor também dependem de resposta externa. O fornecedor OpenDelivery do Studios Coffee não está validado.

Nada nesta página é requisito confirmado.

## Aceitas e retiradas da lista de pendências

| ID | Decisão | Origem | Registro |
|---|---|---|---|
| C2 | O link principal abre o cardápio padrão. `/` é esse cardápio. `/hub` é o hub. `/:restaurantSlug/:menuSlug` abre um cardápio específico. O código atual ainda não faz isso | Fundador, 13 de novembro de 2026 | [decisions.md](decisions.md) |
| C3 | Publicação híbrida: experiência versionada e operação atualizada pela sincronização | Fundador, 13 de novembro de 2026 | [ADR 0006](../architecture/decisions/0006-publicacao-versionada.md) |
| C4 | Um produto, uma oferta selecionada, por cardápio. `UNIQUE (experience_menu_id, source_product_id)` | Fundador, 13 de novembro de 2026 | [ADR 0005](../architecture/decisions/0005-experience-product-source-offer.md) |
| C7 | A data de publicação pertence à versão da camada de experiência. O cardápio aponta a versão ativa | Consequência da C3 aceita | [domain-model.md](../architecture/domain-model.md) |
| C10 | Evolução 2 é inteligência comercial. Evolução 3 é recompra | Blueprint v0.4 | [roadmap.md](roadmap.md) |

## Pendências do blueprint

| Tema | O que falta definir | Prioridade | Dono |
|---|---|---|---|
| Fornecedor OpenDelivery | Qual fornecedor disponibiliza os dados do Studios Coffee | Bloqueante | Davi e fornecedor |
| Acesso ao catálogo | Autorização para consumir o catálogo sem receber pedidos | Bloqueante | Davi e fornecedor |
| Credenciais | Método de autenticação, armazenamento e renovação | Alta | Davi e fornecedor |
| Limites e TTL | Limites reais, TTL e comportamento de atualização | Alta | Fornecedor |
| Sandbox | Ambiente de testes e dados de exemplo | Alta | Fornecedor |
| Identificadores | Estabilidade dos IDs de produtos, ofertas e categorias | Alta | Fornecedor |
| Webhook | Disponibilidade e necessidade de `merchantUpdate` | Média | Fornecedor |
| Múltiplas ofertas | Como apresentar ofertas distintas do mesmo item no admin. A seleção no cardápio já está aceita (C4) | Alta | Davi |
| Opções de produtos | Nível de suporte visual a grupos e opções na V1 | Média | Davi |
| Categorias híbridas | O que acontece quando a categoria de origem é renomeada ou removida | Média | Davi |
| Produto em cardápios | O que acontece quando uma oferta é arquivada na origem | Média | Davi |
| Dado operacional desatualizado | Comportamento quando a sincronização falha ou o dado operacional fica velho. A publicação híbrida já está aceita | Média | Davi |
| CTA público | Ações do showcase além de navegar o cardápio | Média | Davi |
| Migração | Como o conteúdo atual entra no modelo multi-restaurante | Alta | Davi |

## Dado operacional desatualizado

Documento separado: [operational-freshness.md](../operations/operational-freshness.md).

Alternativas registradas, nenhuma aprovada:

1. Interromper a exibição pública assim que a sincronização falhar.
2. Manter o último dado conhecido, sem prazo e sem aviso.
3. Manter o último dado conhecido até uma idade máxima e, depois, deixar de apresentar o cardápio como atual.
4. Manter o último dado conhecido com aviso visível para quem vê o cardápio.

Recomendação para aprovação futura, não decidida: a alternativa 3. O prazo não foi escolhido.

## Perguntas formais ao fornecedor

Antes da integração real:

- Qual versão do OpenDelivery é suportada?
- O endpoint de catálogo existe para uma aplicação que não recebe pedidos?
- Qual é o modelo comercial e contratual desse acesso?
- Como as credenciais são entregues?
- Qual TTL é aplicado?
- Há limite de requisição?
- Os identificadores externos são estáveis?
- As URLs de imagem são permanentes ou temporárias?
- Existe sandbox?
- Há notificação de atualização?

## Conflitos que continuam pendentes

| ID | Conflito | Recomendação | Status |
|---|---|---|---|
| C1 | O blueprint manda preservar as regras do `AGENTS.md` pai. Esse arquivo descreve o produto REA, com comandos e paths que não existem aqui | Listar no `AGENTS.md` do Feels o que se aplica e o que não se aplica, sem editar o pai. [ADR 0008](../architecture/decisions/0008-aplicabilidade-regras-rea.md) | PENDENTE |
| C5 | O blueprint exige preservar Menu, Service e Availability, mas a lista de entidades da seção 5.2 não os nomeia. Auditoria também não é entidade. A versão da experiência deixou de ser recomendação: a C3 a exige | `SourceMenu`, `SourceService`, `SourceAvailability` e `AuditEvent` continuam recomendação. A versão publicada da experiência está aceita | PENDENTE para as quatro entidades recomendadas |
| C6 | `presentation_override` e `MediaAssignment` podem divergir sobre quem guarda a mídia do cardápio | `presentation_override` só para texto; mídia só por `MediaAssignment` | PENDENTE |
| C8 | `feels_content` é conteúdo do Feels, mas a biblioteca é do restaurante | Catálogo global somente leitura, com atribuição por restaurante | PENDENTE |
| C9 | A interface de fidelidade simula confirmação. A V1 não tem fidelidade própria | Remover na migração da experiência pública. Código intocado agora | PENDENTE de implementação futura |
| C11 | Ambientes: o blueprint pede desenvolvimento, homologação e produção. A quantidade de projetos Supabase e o custo não estão definidos | Três ambientes, um projeto Supabase por ambiente, sujeito a custo | PENDENTE |
| C12 | A validação do fornecedor é bloqueante para a integração real e ainda não tem resposta | Começar o contato em paralelo. A conexão real só entra com resposta | PENDENTE de execução externa |
| C13 | O cardápio atual foi obtido por scraping de `francisco.sipfloweb.com`. Isso não identifica o fornecedor OpenDelivery | Não tratar esse site como o fornecedor validado | PENDENTE |
| C14 | `src/pages/HubPage.tsx` não está ligado a nenhuma rota | Registrar como código não usado. Sem alteração agora | PENDENTE de limpeza futura |

## Pendências técnicas de detalhamento

| Tema | Recomendação atual | Status |
|---|---|---|
| Entrega da experiência pública | Documento publicado em CDN, sem consulta direta ao banco. A publicação híbrida não escolhe o transporte | PENDENTE |
| Runtime do worker de sync e mídia | Validar limite de Edge Functions antes de escolher worker externo | PENDENTE |
| Armazenamento de mídia | Manter R2 | PENDENTE; recomendado |
| Estrutura do repositório | Monorepo com apps e pacotes | PENDENTE |
| Login e convite | Não escolhido | PENDENTE |
| Região e plano Supabase | Região `sa-east-1` sugerida; PITR depende do plano | PENDENTE |
| Observabilidade | Não escolhida | PENDENTE |
| Domínio público | As rotas conceituais estão aceitas. O domínio que hospeda `/` não está escolhido | PENDENTE |
| `@playwright/test` | Adoção explícita de dependência, não feita | PENDENTE |
| CI e proteção de branch | Atividade futura, fora desta execução | PENDENTE |
