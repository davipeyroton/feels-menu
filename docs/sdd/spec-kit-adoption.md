# Adoção do Spec Kit

Status desta etapa: planejamento. `specify init` não foi executado. Não há `.specify/` nem `.cursor/skills`.

## Ferramenta já presente na máquina

Verificado em 13 de novembro de 2026, sem instalar nada:

- `specify` CLI 1.0.13, via uv, com Python 3.14 no ambiente da ferramenta.
- A integração `cursor-agent` existe no pacote instalado. O fluxo no IDE não exige o CLI do Cursor. O comando `cursor-agent` também está instalado nesta máquina; isso não autoriza workflow com aprovação automática.

Flags reais de `specify init` nessa versão: `--here`, `--force`, `--integration`, `--integration-options`, `--script`, `--non-interactive`, `--preset`, `--extension`, `--ignore-agent-tools`.

`--events` não é flag do `init`. É opção da integração, passada em `--integration-options`.

## Comando previsto, ainda não autorizado

Quando houver aprovação explícita e a árvore de trabalho estiver limpa, numa branch dedicada:

```bash
specify init --here --force --integration cursor-agent --script sh --integration-options="--events false"
specify integration status
```

Arquivos que esse comando deve gerar, segundo o pacote 1.0.13:

- `.specify/` com templates, scripts shell e memória.
- `.cursor/skills/speckit-*/SKILL.md`.
- `.cursor/hooks.json`, se os eventos não forem desligados. O comando acima pede para desligar.
- Possivelmente `.cursor/rules/specify-rules.mdc`, se a extensão de contexto de agente entrar.

O comando não reescreve `src/` nem o `AGENTS.md`. O risco de sobrescrita é baixo porque `.specify/` e `.cursor/` não existem. `--force` ainda exige revisão do diff antes de qualquer commit.

Não usar workflow que chame `cursor-agent` com `--trust`, `--approve-mcps` ou `--force` nesta fase.

## Fluxo por feature, depois da inicialização

No chat do Cursor, uma etapa por vez:

1. `/speckit-constitution` com o texto aprovado a partir de [constitution-draft.md](constitution-draft.md).
2. `/speckit-specify`
3. `/speckit-clarify`
4. `/speckit-plan`
5. `/speckit-tasks`
6. `/speckit-analyze`
7. `/speckit-implement`
8. `/speckit-converge`, repetido até `Converged`.

Cada spec também segue a lista do blueprint: problema, especificação, aceite, plano, tarefas, implementação, testes e revisão. Conformidade: [blueprint-compliance.md](../../agents/policies/blueprint-compliance.md).

## Organização proposta dos specs

Ainda não criados. Ficam em `specs/` quando o Spec Kit for inicializado.

| Spec | Objetivo | Bloqueio |
|---|---|---|
| `001-quality-gates` | Typecheck, build e smoke Playwright em WebKit e Chromium na app atual; CI em GitHub | Adoção explícita de `@playwright/test`. CI é atividade futura, fora desta documentação |
| `002-platform-foundation` | Supabase de desenvolvimento, Auth, restaurante, membership, RLS e testes de isolamento | Aprovação para criar projeto e migration |
| `003-opendelivery-adapter-v1` | Parser e mapeamento contra a especificação pública e fixtures | Não exige o fornecedor do piloto |
| `004-catalog-sync` | Conexão, cofre, intervalo por TTL, idempotência, histórico e arquivamento | Conexão real bloqueada pelo fornecedor |
| `005-experience-menus` | Cardápios, categorias híbridas, uma oferta por produto, ordem, apresentação e cardápio padrão | Depende do modelo da Fase 2. Unicidade `UNIQUE (experience_menu_id, source_product_id)` |
| `006-media-library` | Upload, renditions, atribuição e preservação no sync | ADR 0007 ainda é proposta |
| `007-publication` | Publicação híbrida aceita: versão da experiência e camada operacional | Política de dado desatualizado fica de fora até aprovação |
| `008-public-experience-multitenant` | Rotas aceitas (`/`, `/hub`, `/:restaurantSlug/:menuSlug`), ocultar indisponível, migrar a UI atual e remover a fidelidade simulada | Não alterar o código antes desta spec. O código atual ainda abre o hub em `/` |
| `009-pilot-studios-coffee` | Conteúdo do piloto e conexão real | Fornecedor validado |

Quality gates, GitHub Actions e proteção de branch pertencem ao spec 001 e à fase de infraestrutura futura. Não são configurados junto com esta documentação.
