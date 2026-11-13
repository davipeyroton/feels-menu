# Estratégia

Fonte: [Blueprint v0.4](blueprint-v0.4.md), seções 1, 3 e 17.

## Proposta de valor

Permitir que o restaurante apresente os produtos de forma mais atraente, organize experiências comerciais diferentes e evolua a forma como o cliente descobre e consome.

A V1 não mede conversão. Analytics, recompra e testes A/B ficam nas evoluções 2 e 3. A arquitetura reserva identidade estável de restaurante, produto de origem, oferta e cardápio para essa medição futura, sem construir a medição agora.

## V1

Conectar restaurantes ao OpenDelivery e transformar os dados importados em experiências digitais personalizáveis.

O resultado para o cliente final é um showcase visual, mobile-first, sem pedido e sem checkout. O link principal abre o cardápio padrão em `/`. O hub fica em `/hub`. Um cardápio específico abre em `/:restaurantSlug/:menuSlug`. O código atual ainda não usa essas rotas.

O piloto é o Studios Coffee. A integração real depende de validação com o fornecedor. Essa validação não está feita.

## Fora da V1

Permanecem no roadmap, sem implementação agora:

- Pedidos, checkout e gestão operacional do cardápio.
- Alterar preço ou disponibilidade na origem.
- Fidelidade própria, Stampay e Tappi.
- Analytics, conversão, recompra, testes A/B e recomendações.
- Cardápio automático por dia ou horário.
- Vídeo educativo e sugestões automáticas de merchandising.

## Fidelidade simulada no app atual

O app atual mostra cadastro de cashback e fidelidade. As funções não chamam serviço nenhum: qualquer código de cinco dígitos é aceito. Isso contradiz a V1, que não tem programa próprio de fidelidade.

A remoção faz parte da futura migração da experiência pública. O código atual não muda nesta etapa de documentação. Ver [catálogo](feature-catalog.md) e o spec previsto `008-public-experience-multitenant` em [adoção do Spec Kit](../sdd/spec-kit-adoption.md).

## Prioridade

Fundação multi-tenant confiável, primeira integração OpenDelivery e experiência pública de alta qualidade para o Studios Coffee. O que não contribui para isso fica no roadmap.
