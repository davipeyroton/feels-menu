# Decisões em aberto

Referência vigente: [Blueprint v0.5](blueprint-v0.5.md). A [v0.4](blueprint-v0.4.md) permanece como histórico. Decisões aceitas: [decisions.md](decisions.md).

Dono padrão: Davi, até delegação explícita. Itens de fornecedor também dependem de resposta externa. O fornecedor OpenDelivery do Studios Coffee não está validado.

Nada nesta página é requisito confirmado.

## Aceitas e retiradas da lista de pendências

| ID | Decisão | Origem | Registro |
|---|---|---|---|
| C2 | O link principal abre o cardápio padrão. `/` é esse cardápio. `/hub` é o hub. A forma do host está no [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md). O código atual ainda não faz isso | Fundador, 13 de novembro de 2026 | [decisions.md](decisions.md) |
| C3 | Publicação híbrida: experiência versionada e operação atualizada pela sincronização | Fundador, 13 de novembro de 2026 | [ADR 0006](../architecture/decisions/0006-publicacao-versionada.md) |
| C4 | Um produto, uma oferta selecionada, por cardápio. `UNIQUE (experience_menu_id, source_product_id)` | Fundador, 13 de novembro de 2026 | [ADR 0005](../architecture/decisions/0005-experience-product-source-offer.md) |
| Ofertas no painel | Escolha por cardápio, sem troca automática na sincronização; oferta indisponível ou arquivada oculta o produto naquele cardápio | Fundador, 13 de novembro de 2026 | [ADR 0011](../architecture/decisions/0011-administracao-ofertas.md) |
| C7 | A data de publicação pertence à versão da camada de experiência. O cardápio aponta a versão ativa | Consequência da C3 aceita | [domain-model.md](../architecture/domain-model.md) |
| C10 | Evolução 2 é inteligência comercial. Evolução 3 é recompra | Blueprint v0.4 | [roadmap.md](roadmap.md) |
| Freshness | Último snapshot válido até `2 × max(15 minutos, TTL)`. Sem teto extra se o TTL passar de uma hora | Fundador, 13 de novembro de 2026 | [ADR 0009](../architecture/decisions/0009-operational-freshness.md) |
| Experiência EXPIRED | Nas rotas de cardápio, nome, logotipo, mensagem de indisponibilidade temporária e o botão "Tentar de novo" | Fundador, 13 de novembro de 2026 | [ADR 0010](../architecture/decisions/0010-experiencia-expired.md) |
| C5 | `SourceMenu`, `SourceService` e `SourceAvailability`. Horário de origem não comanda a experiência pública da V1. `AuditEvent` fica de fora | Fundador, 13 de novembro de 2026 | [ADR 0012](../architecture/decisions/0012-menu-servico-disponibilidade.md) |
| Categorias independentes | Origem derivada pelos produtos. Sem `source_category_id` e sem relação N:N | Fundador, 13 de novembro de 2026 | [ADR 0013](../architecture/decisions/0013-categorias-independentes.md) |
| Entrega por CDN | Quatro documentos. Navegação sem consulta ao banco. Ponteiro por último. Cache de 60 segundos no ponteiro e no documento operacional | Fundador, 14 de novembro de 2026 | [ADR 0014](../architecture/decisions/0014-entrega-cdn.md) |
| Documentos públicos | Bucket R2 exclusivo, CDN Cloudflare, host por restaurante e retenção de 90 dias ou 10 versões. O nome do domínio continua pendente | Fundador, 14 de novembro de 2026 | [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md) |
| Consumo dos documentos | Releitura visível a cada 60 segundos, idade por `Date` e `Age`, hub em EXPIRED só com nome e logotipo | Fundador, 14 de novembro de 2026 | [ADR 0016](../architecture/decisions/0016-consumo-documentos-publicos.md) |
| Leitura, cache e CORS | Custom Domain, token só no backend, cache de 60 segundos na identidade, GET normal no botão e CORS sem `PUT` nem `DELETE` | Fundador, 14 de novembro de 2026 | [ADR 0017](../architecture/decisions/0017-leitura-publica-cache-cors.md) |

## Pendências do blueprint

| Tema | O que falta definir | Prioridade | Dono |
|---|---|---|---|
| Fornecedor OpenDelivery | Qual fornecedor disponibiliza os dados do Studios Coffee | Bloqueante | Davi e fornecedor |
| Acesso ao catálogo | Autorização para consumir o catálogo sem receber pedidos | Bloqueante | Davi e fornecedor |
| Credenciais | Método de autenticação, armazenamento e renovação | Alta | Davi e fornecedor |
| Limites e TTL | Limites reais, TTL e comportamento de atualização | Alta | Fornecedor |
| Sandbox | Ambiente de testes e dados de exemplo | Alta | Fornecedor |
| Identificadores | Estabilidade dos IDs de produtos, ofertas e categorias | Alta | Fornecedor |
| Identidade do serviço | Chave persistente quando a origem não envia id próprio. Chave composta depende dessa validação | Alta | Fornecedor |
| Janelas de disponibilidade | Campos reais, reconciliação e arquivamento das janelas | Alta | Fornecedor |
| Webhook | Disponibilidade e necessidade de `merchantUpdate` | Média | Fornecedor |
| Opções de produtos | Nível de suporte visual a grupos e opções na V1 | Média | Davi |
| CTA público | Ações do showcase além de navegar o cardápio. O botão "Tentar de novo" da tela EXPIRED não fecha esta decisão | Média | Davi |
| Migração | Como o conteúdo atual entra no modelo multi-restaurante | Alta | Davi |

## Freshness operacional

Aceita. O histórico das alternativas 1 a 4 permanece em [operational-freshness.md](../operations/operational-freshness.md) apenas como contexto anterior à aprovação. A regra vigente é a alternativa 3, com `max_staleness = 2 × effective_sync_interval`.

A experiência pública de EXPIRED está aceita no [ADR 0010](../architecture/decisions/0010-experiencia-expired.md). Isso não reabre a fórmula. A releitura, a referência `Date` e `Age` e o hub durante EXPIRED estão no [ADR 0016](../architecture/decisions/0016-consumo-documentos-publicos.md).

## Perguntas formais ao fornecedor

Antes da integração real:

- Qual versão do OpenDelivery é suportada?
- O endpoint de catálogo existe para uma aplicação que não recebe pedidos?
- Qual é o modelo comercial e contratual desse acesso?
- Como as credenciais são entregues?
- Qual TTL é aplicado?
- Há limite de requisição?
- Os identificadores externos são estáveis?
- O serviço traz identificador próprio ou a identidade depende de outra chave?
- Quais campos identificam uma janela de disponibilidade?
- As URLs de imagem são permanentes ou temporárias?
- Existe sandbox?
- Há notificação de atualização?

## Conflitos que continuam pendentes

| ID | Conflito | Recomendação | Status |
|---|---|---|---|
| C1 | O blueprint manda preservar as regras do `AGENTS.md` pai. Esse arquivo descreve o produto REA, com comandos e paths que não existem aqui | Listar no `AGENTS.md` do Feels o que se aplica e o que não se aplica, sem editar o pai. [ADR 0008](../architecture/decisions/0008-aplicabilidade-regras-rea.md) | PENDENTE |
| AuditEvent | O blueprint não nomeia auditoria como entidade. A C5 não a inclui | Continua recomendação técnica, sem tabela nem mecanismo nesta decisão | PENDENTE |
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
| Prova de Date, Age e CORS | Os nove testes do [ADR 0017](../architecture/decisions/0017-leitura-publica-cache-cors.md) antes de implementar o cálculo de freshness. A fórmula do ADR 0016 não muda se a prova falhar | PENDENTE de execução |
| Conteúdo do hub saudável | O que `/hub` mostra quando o cardápio está FRESH ou STALE. Durante EXPIRED, a rota mostra só nome e logotipo, no [ADR 0016](../architecture/decisions/0016-consumo-documentos-publicos.md) | PENDENTE |
| Runtime do worker de sync e mídia | Validar limite de Edge Functions antes de escolher worker externo | PENDENTE |
| Armazenamento de mídia | Manter R2 | PENDENTE; recomendado |
| Estrutura do repositório | Monorepo com apps e pacotes | PENDENTE |
| Login e convite | Não escolhido | PENDENTE |
| Região e plano Supabase | Região `sa-east-1` sugerida; PITR depende do plano | PENDENTE |
| Observabilidade | Não escolhida | PENDENTE |
| Nome do domínio | A forma `{restaurantSlug}.{domínio}`, com `/`, `/{menuSlug}` e `/hub`, está aceita. O nome do domínio e o do subdomínio dos documentos não estão escolhidos | PENDENTE |
| `@playwright/test` | Adoção explícita de dependência, não feita | PENDENTE |
| CI e proteção de branch | Atividade futura, fora desta execução | PENDENTE |
