# Feels Menu — instruções para agentes

Este arquivo vale para o repositório Feels Menu. Ele não substitui e não altera o `AGENTS.md` do diretório pai.

## Fontes, nesta ordem

1. [Blueprint v0.5](docs/product/blueprint-v0.5.md) e [decisões confirmadas](docs/product/decisions.md). A [v0.4](docs/product/blueprint-v0.4.md) é histórico e não prevalece sobre a v0.5. Não mude o significado das decisões aceitas.
2. [Decisões em aberto](docs/product/open-decisions.md). O que está pendente não vira requisito.
3. Documentação de arquitetura, operação e agentes neste repositório.
4. Especificações em `specs/`, quando existirem. Nesta etapa elas ainda não existem.
5. Regras aplicáveis do [AGENTS.md do diretório pai](../AGENTS.md), listadas abaixo.

O arquivo pai fica em `../AGENTS.md` quando este repositório está dentro de `rea-test/`. Ele não faz parte do git do Feels Menu. Leia-o quando estiver presente. Não o edite.

Uma recomendação marcada **[RECOMENDADA]** não é decisão confirmada. C2, C3, C4 e C5 estão aceitas, assim como a freshness operacional: último snapshot válido até `2 × effective_sync_interval` ([ADR 0009](docs/architecture/decisions/0009-operational-freshness.md)). A tela pública de EXPIRED está aceita no [ADR 0010](docs/architecture/decisions/0010-experiencia-expired.md). A administração de ofertas está aceita no [ADR 0011](docs/architecture/decisions/0011-administracao-ofertas.md). Menu, serviço e disponibilidade de origem estão aceitos no [ADR 0012](docs/architecture/decisions/0012-menu-servico-disponibilidade.md). Categorias independentes, com origem derivada pelos produtos, estão aceitas no [ADR 0013](docs/architecture/decisions/0013-categorias-independentes.md). A entrega da experiência publicada por CDN está aceita no [ADR 0014](docs/architecture/decisions/0014-entrega-cdn.md). O bucket exclusivo, a CDN Cloudflare, o host por restaurante e a retenção estão aceitos no [ADR 0015](docs/architecture/decisions/0015-armazenamento-distribuicao.md). O consumo desses documentos está aceito no [ADR 0016](docs/architecture/decisions/0016-consumo-documentos-publicos.md). A leitura pública, o cache de 60 segundos da identidade e o CORS estão aceitos no [ADR 0017](docs/architecture/decisions/0017-leitura-publica-cache-cors.md). O ADR 0007 continua proposta.

## O que este produto é

O Feels Menu é uma plataforma SaaS multi-restaurante. O sistema de origem administra o cardápio operacional. O Feels administra a experiência comercial.

- Piloto: Studios Coffee. O fornecedor OpenDelivery desse piloto **não está validado**.
- Backend da V1: Supabase. Confirmado.
- Integração inicial: OpenDelivery, somente leitura, por adaptador isolado.
- A V1 é showcase: apresenta o cardápio e não recebe pedidos.

O código atual é um frontend estático de um único restaurante. Não descreva multi-tenant, API, banco ou OpenDelivery como se já existissem. O estado verificado está em [current-state.md](docs/architecture/current-state.md).

## O que não fazer sem aprovação explícita do Davi

- Deploy, alteração de produção, de dados de produção ou de credenciais.
- Merge para a branch principal.
- Migrations, criação de projeto Supabase ou mudança de infraestrutura.
- `specify init`, instalação de ferramentas ou geração de arquivos do Spec Kit.
- Commit e push, salvo pedido explícito.
- Editar preço, disponibilidade ou qualquer dado operacional como se o Feels fosse a fonte da verdade.
- Enviar alterações de volta ao OpenDelivery.
- Remover a fidelidade simulada do código fora da futura migração da experiência pública. O comportamento atual permanece até essa migração.

Ações críticas de produto, quando a funcionalidade existir, exigem confirmação explícita: exclusão de restaurante, remoção de integração, alteração de credenciais, remoção de usuários e publicação ou reversão de versões, quando aplicável. A confirmação não substitui autenticação nem autorização.

## Comandos reais deste repositório

Não existem `npm run check:pr`, `npm run check:fast`, `npm run test:local` nem `npm run build:cached` aqui.

- `npm run dev` — Vite.
- `npm run build` — `vite build`. Não executa checagem de tipos.
- `npm run preview` — preview do build.
- `npm run snapshot` — regenera `data/menu-snapshot.json` por scraping. Não é a integração OpenDelivery.
- `npm run audit:mobile`, `npm run audit:reels-baseline`, `npm run audit:r2-headers` — auditorias manuais.
- `npm run media:posters` — posters de vídeo; exige ffmpeg.
- Testes do publisher R2: `python3 scripts/test_publish_r2_videos.py`. Não publique no R2 sem aprovação.

## Definição de pronto

Uma tarefa só está pronta com evidência do que foi executado: comando, saída e, quando a mudança for visível, verificação da interface. Não declare medição, teste ou reprodução que não tenha ocorrido. Diff fora dos arquivos da tarefa precisa ser explicado.

Quality gates, CI e proteção de branch são trabalho futuro. Não os configure nesta etapa de documentação.

## Regras do diretório pai

O arquivo pai permanece íntegro. A lista abaixo só declara aplicabilidade ao Feels Menu, para um agente não executar comandos ou editar paths que não existem aqui.

### Aplicáveis

- Separar observação, derivação, inferência e desconhecido. Não tratar desconhecido como ausente ou confirmado.
- Não integrar capacidade enquanto escopo, autoridade, efeito colateral ou verificação obrigatória continuarem sem resposta. Proposta e protótipo não autorizam integração. Vale em especial para o OpenDelivery do piloto.
- Mudança de configuração é aditiva e idempotente, com backup. Não instalar nem atualizar software não relacionado.
- Preservar a escolha de quem chamou e a evidência local (saída, URL, caminho, digest, metadados). Redigir credencial de transporte e valor marcado como sensível. Não inferir segredo pelo nome. Não gravar o ambiente só porque um processo filho o herdou.
- Dependências apontam para dentro: domínio e contratos, adaptadores, workflows, por último a borda. Código específico de fornecedor não entra no domínio. Cada interpretação tem um dono; quem consome usa o fato já interpretado por esse dono.
- Separar prova de posse, validade, editabilidade e prontidão. Dado malformado ainda pode ser removível com segurança.
- Corrigir a representação que produz o erro antes de remendar quem consome. Normalizar uma vez na fronteira. Remover representação substituída depois de verificar quem usa.
- Ao corrigir bug ou responder revisão, olhar a fronteira que produz o fato e quem consome. Explicar causa, correção estrutural, validação e o que ficou pendente.
- Preservar fato parcial e o motivo da falha. Separar identidade de texto de exibição. Caminho absoluto, URL de arquivo e caminho HTTP não são a mesma coisa.
- Performance: correção, resposta útil, proveniência, escolha de quem chamou e limite de recurso vêm antes de otimização. Medir tarefa representativa e comparar antes e depois quando a mudança afetar custo. Separar execução fria e quente. Não afirmar custo não medido.
- Conventional Commits no assunto e no título de PR. Mudança incompatível leva `!` ou rodapé `BREAKING CHANGE:`.
- Relato curto, com a menor evidência útil. Separar resultado observado, raciocínio derivado da fonte, hipótese e verificação proposta. Não alegar reprodução ou medição não feita. Informação insuficiente fica explícita.
- PR: um humano revisa e é dono do diff. O agente não declara revisão humana no lugar dele. O PR fica em rascunho até o humano declarar prontidão inicial. Pushes seguintes não anulam essa declaração. O corpo descreve problema, resultado observável, abordagem e evidência. Só relate verificação que rodou de fato.
- Não commitar binário, credencial, `dist/`, `node_modules/` nem artefato local de planejamento.

### Não aplicáveis a este repositório

Estas regras descrevem o produto REA ou arquivos que não existem aqui. Ignore o procedimento, sem apagar nem reescrever o arquivo pai.

- Produto, provedores e fluxos de engenharia reversa, incluindo Ghidra, IDA, Hopper e `rea setup`.
- Paths e documentos do REA: `docs/architecture.mermaid`, `docs/tool-design.md`, `docs/testing.md`, `CONTRIBUTING.md`, `README.md#choosing-a-deep-analysis-provider`, `.nvmrc`, `package.json#packageManager`, `src/process/`.
- Scripts npm do REA: `build:cached`, `test:local`, `test:focused`, `check:fast`, `docs:check`, `check:pr`.
- Saídas geradas do REA: `docs/public/product-catalog.json`, `docs/verification/managed-conformance-*.json`, `skills/`, `.agents/skills/reverse-engineer-anything/`, `.cache/mcp-tool-catalog.json`.
- Álgebra de erro e `Result` no formato do REA, supervisão de processo por PID e regressões de ciclo de vida de ferramenta de análise.
- Validação de JSON Schema após conversão de SDK de catálogo de ferramentas.
- Bloco gerenciado do Turborepo. Este repositório não usa Turborepo. Não crie `turbo.json` para satisfazer essa regra.

O registro desta aplicabilidade está no [ADR 0008](docs/architecture/decisions/0008-aplicabilidade-regras-rea.md), com status **proposta**. A lista acima é a orientação operacional até essa proposta ser aceita ou rejeitada. Ela não edita o arquivo pai.

## Onde continuar

- Produto: [visão](docs/product/vision.md), [estratégia](docs/product/strategy.md), [catálogo](docs/product/feature-catalog.md), [roadmap](docs/product/roadmap.md).
- Arquitetura: [visão geral](docs/architecture/system-overview.md), [domínio](docs/architecture/domain-model.md), [OpenDelivery](docs/architecture/integration-opendelivery.md), [segurança](docs/architecture/security.md).
- Operação: [sincronização](docs/operations/synchronization.md), [mídia](docs/operations/media-pipeline.md), [deploy](docs/operations/deployment.md).
- Agentes: [charters](agents/charters/chief-of-staff.md), [permissões](agents/policies/permissions.md), [conformidade](agents/policies/blueprint-compliance.md).
- SDD: [adoção do Spec Kit](docs/sdd/spec-kit-adoption.md), [rascunho de constituição](docs/sdd/constitution-draft.md). O Spec Kit **não** foi inicializado.
