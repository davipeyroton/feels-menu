# Pipeline de mídia

Fonte: [Blueprint v0.4](../product/blueprint-v0.4.md), seções 6.5, 7.5 e 8.4. O armazenamento em R2 com CDN própria é recomendação ([ADR 0007](../architecture/decisions/0007-midia-r2-cdn.md)), não decisão confirmada. O [ADR 0015](../architecture/decisions/0015-armazenamento-distribuicao.md) aceita um bucket R2 só para os documentos públicos e não aprova esta biblioteca.

## O que já está em operação

O procedimento vigente de hosting, headers, faststart e CORS está em [MEDIA.md](../MEDIA.md). Ele descreve o app de um restaurante. Continua valendo até a biblioteca multi-restaurante existir. Não descreve upload por restaurante nem renditions por ativo.

Baselines de vídeo: [performance](../performance/README.md).

## Biblioteca alvo

`MediaAsset` pertence ao restaurante e registra a origem:

- `source`: arquivo baixado da origem. A URL pode expirar; a recomendação é copiar para armazenamento próprio e guardar CRC-32 quando o protocolo enviar.
- `restaurant_upload`: envio do restaurante.
- `feels_content`: conteúdo oferecido pelo Feels.

`MediaRendition` guarda miniatura, imagem otimizada, vídeo otimizado e outras resoluções. O original fica preservado.

`MediaAssignment` liga o ativo à apresentação global ou a um cardápio. A recomendação pendente (C6) é que mídia não seja duplicada dentro de `presentation_override`.

O sync não substitui arquivo nem referência de `restaurant_upload` ou `feels_content`.

## Processamento previsto

Quando a Fase 5 for aprovada para implementação:

- Upload por URL assinada, sem passar o arquivo pelo browser como gravação direta no bucket com chave permanente.
- Limites de tamanho e formato definidos no spec dessa fase. O protocolo V1 cita, para imagem de origem, JPEG, PNG, GIF ou WEBP e menos de 10 MB. Isso é requisito da origem, não o limite final de upload do restaurante.
- Poster e faststart de vídeo reaproveitam a prática já documentada em [MEDIA.md](../MEDIA.md).
- Processamento assíncrono. O runtime ainda está pendente.

## Fora da V1

Vídeo educativo e experimentos de mídia são Evolução 2.
