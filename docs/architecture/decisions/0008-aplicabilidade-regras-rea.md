# ADR 0008 — Aplicabilidade das regras do diretório pai

- Status: Proposta
- Data: 2026-11-13
- Fonte: [Blueprint v0.4](../../product/blueprint-v0.4.md), seção 13; arquivo pai `../AGENTS.md` em relação à raiz deste repositório, quando o checkout está dentro de `rea-test/`

## Contexto

O blueprint diz que as regras do projeto REA, no diretório pai, devem ser preservadas e respeitadas. Esse arquivo descreve outro produto. Vários comandos e paths não existem no Feels Menu. Conflito C1.

## Proposta

Não editar o arquivo pai. O [AGENTS.md](../../../AGENTS.md) deste repositório lista o que se aplica e o que não se aplica. Regras de evidência, commit, PR com dono humano e integração fail-closed continuam valendo. Regras de Ghidra, scripts npm do REA e Turborepo não se aplicam aqui.

Enquanto este ADR estiver como proposta, a lista do `AGENTS.md` do Feels é a orientação operacional. Aceitar ou rejeitar a proposta não autoriza alterar o arquivo pai.
