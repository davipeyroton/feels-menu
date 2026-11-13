# ADR 0007 — Mídia no R2 com CDN própria

- Status: Proposta
- Data: 2026-11-13
- Fonte: [Blueprint v0.4](../../product/blueprint-v0.4.md), seção 8.4

## Recomendação

Manter Cloudflare R2 como armazenamento de mídia, com upload por URL assinada, CDN em domínio próprio, imagens responsivas, vídeo otimizado, miniaturas, limites de formato e processamento assíncrono. A camada de mídia não depende do fornecedor de catálogo.

## O que já existe

O app atual serve arquivos estáticos por R2, no domínio público `r2.dev` configurado em `.env.production`. Isso não é a biblioteca por restaurante. O procedimento vigente está em [MEDIA.md](../../MEDIA.md).

## Em aberto

Domínio, limites finais e a escolha entre processamento próprio e serviço gerenciado. Ver [pipeline de mídia](../../operations/media-pipeline.md).
