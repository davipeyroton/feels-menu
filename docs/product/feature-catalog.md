# Catálogo de funcionalidades

Estados: **EXISTE**, **PARCIAL**, **A CONSTRUIR**, **PROPOSTA FUTURA**.

Fonte de escopo: [Blueprint v0.5](blueprint-v0.5.md). A [v0.4](blueprint-v0.4.md) permanece como histórico. O código foi conferido em 13 de novembro de 2026. Detalhe técnico: [estado atual](../architecture/current-state.md).

## V1

| # | Funcionalidade | Estado | Onde está hoje |
|---|---|---|---|
| 1 | Cadastro e gestão de restaurantes | A CONSTRUIR | Marca fixa no app de um restaurante |
| 2 | Vários usuários por restaurante, permissões iguais | A CONSTRUIR | Não há conta nem autenticação |
| 3 | Integração OpenDelivery | A CONSTRUIR | Não há adaptador nem chamada ao protocolo |
| 4 | Sincronização periódica | A CONSTRUIR | O cardápio entra no bundle por JSON estático |
| 5 | Importar todos os menus e serviços da origem | A CONSTRUIR | A representação está aceita no [ADR 0012](../architecture/decisions/0012-menu-servico-disponibilidade.md). O snapshot atual não tem menu nem service do protocolo |
| 6 | Importar todos os produtos e categorias, inclusive indisponíveis | A CONSTRUIR | O JSON atual só tem o que o scraping encontrou |
| 7 | Vários cardápios de experiência | A CONSTRUIR | Há uma navegação só |
| 8 | Escolher produtos por cardápio | A CONSTRUIR | A regra de uma oferta escolhida por cardápio está aceita no [ADR 0011](../architecture/decisions/0011-administracao-ofertas.md) e ainda não está no código |
| 9 | Personalização visual | PARCIAL | Imagem, vídeo e texto existem no snapshot, sem camada comercial separada |
| 10 | Biblioteca de mídia por restaurante | A CONSTRUIR | Arquivos em `public/` e R2, sem biblioteca nem dono por restaurante |
| 11 | Apresentação global e sobrescrita por cardápio | A CONSTRUIR | — |
| 12 | Organização de categorias e produtos | PARCIAL | Categorias e produtos existem para um restaurante |
| 13 | Ordenação manual independente por cardápio | A CONSTRUIR | A ordem vem do snapshot |
| 14 | Publicação de cardápios | PARCIAL | O deploy publica o app inteiro; não há publicação de cardápio por restaurante |
| 15 | Link público principal | A CONSTRUIR | A URL atual não tem `restaurantSlug` |
| 16 | Cardápio padrão | A CONSTRUIR | — |
| 17 | Experiência pública mobile | PARCIAL | Hub, reels e perfil existem para um restaurante |

Confirmação de produto já registrada: indisponíveis entram na importação e ficam ocultos na experiência pública; o link principal abre o cardápio padrão; cada cardápio persiste uma oferta escolhida e a sincronização não a troca; a origem da categoria de experiência é derivada pelos produtos. Ver [decisions.md](decisions.md).

## O que o app atual já faz

| Funcionalidade | Estado | Nota |
|---|---|---|
| Hub com vídeo de capa | EXISTE | Primeiro painel de `/` quando não há `view` |
| Reels por categoria | EXISTE | `?view=reels`. O topo mostra a categoria em destaque e a seguinte. O filtro real continua separado: Todos mostra a sequência inteira e uma categoria nomeada mostra só os produtos dela |
| Feed em grade e timeline | REMOVIDO | `?view=feed` abre os reels em Todos. O perfil continua usando os componentes de grade para os favoritos |
| Perfil | EXISTE | `?view=profile` |
| Tema claro e escuro | EXISTE | Preferência local |
| Favoritos | EXISTE | `localStorage`, sem conta |
| Wi-Fi (copiar senha) | EXISTE | Dado do snapshot, não da integração |
| Avaliação no Google | EXISTE | Link no snapshot |
| Selo vegano | EXISTE | Lista fixa em código, não o campo de dieta do protocolo |
| Fidelidade e cashback | PARCIAL | Interface presente; envio e verificação são simulados |

Wi-Fi, avaliação no Google e favoritos não estão no escopo nomeado da V1. O destino deles na migração está em aberto: [open-decisions.md](open-decisions.md).

## Fidelidade simulada

**PARCIAL no código. Fora da V1 como produto.** A retirada entra na futura migração da experiência pública. Nenhum arquivo de aplicação é alterado na consolidação documental.

## Fora da V1

Tudo abaixo é **PROPOSTA FUTURA**.

Evolução 2, inteligência comercial: analytics de navegação, visualização, tempo de tela, interação, testes A/B, recomendação de posicionamento, sugestão contextual, cardápio por horário e dia, vídeo educativo.

Evolução 3, recompra e relacionamento: fidelidade de terceiros, Stampay ou Tappi, cadastro de cliente, cartão para Apple Wallet e Google Wallet, campanha, segmentação e recompra. Sem plataforma própria de pontos na primeira etapa.

## Publicação híbrida

**ACEITA** (C3). A V1 publica cardápios com duas camadas. A experiência congela seleção, categorias, ordem, textos comerciais, imagens, vídeos e configuração visual. Preço, disponibilidade, status e arquivamento vêm da sincronização e não exigem republicação. A navegação pública lê a CDN, no [ADR 0014](../architecture/decisions/0014-entrega-cdn.md). O bucket, a CDN e a retenção estão no [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md). O consumo está no [ADR 0016](../architecture/decisions/0016-consumo-documentos-publicos.md). A leitura pública e o cache estão no [ADR 0017](../architecture/decisions/0017-leitura-publica-cache-cors.md). Ver [ADR 0006](../architecture/decisions/0006-publicacao-versionada.md).

O código atual não tem essa publicação. A regra de idade do snapshot operacional está aceita e ainda não está no código. A tela pública de EXPIRED também está aceita, no [ADR 0010](../architecture/decisions/0010-experiencia-expired.md), e ainda não está no código.
