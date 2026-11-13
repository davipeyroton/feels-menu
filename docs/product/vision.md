# Visão

Fonte: [Blueprint v0.5](blueprint-v0.5.md). As seções 1 e 2 vêm da v0.4 e não mudaram. Decisões confirmadas: [decisions.md](decisions.md). A [v0.4](blueprint-v0.4.md) permanece como histórico.

## Produto

O Feels Menu é uma plataforma SaaS multi-restaurante. Ele transforma cardápios operacionais existentes em experiências digitais visuais, envolventes e orientadas à conversão.

Não substitui sistema de gestão, PDV nem plataforma de delivery. É a camada de experiência e merchandising sobre dados operacionais que já existem.

## Posicionamento

**O sistema de origem administra o cardápio operacional. O Feels administra a experiência comercial.**

O Feels deve:

- Conectar-se a sistemas de cardápio existentes.
- Importar e sincronizar produtos, categorias, preços e disponibilidade.
- Permitir múltiplos cardápios digitais.
- Personalizar a apresentação visual dos produtos.
- Permitir organização e ordenação independentes por cardápio.
- Entregar uma experiência pública otimizada para celular.

O Feels não deve:

- Substituir o sistema de gestão do restaurante.
- Tornar-se a fonte da verdade de preços e disponibilidade.
- Enviar alterações operacionais de volta ao OpenDelivery.
- Gerenciar pedidos na primeira versão.
- Criar um sistema próprio de fidelidade na primeira versão.

## Princípios

1. **Fonte da verdade operacional.** Sistemas externos respondem por produto, categoria, oferta, preço, disponibilidade e demais dados do protocolo. O OpenDelivery é a primeira integração. O Feels guarda uma representação interna sincronizada.
2. **Separação entre operação e apresentação.** O Feels altera imagem, vídeo, título comercial, descrição comercial, organização, ordenação e destaques. Não altera o dado operacional de origem.
3. **Multi-tenancy desde a fundação.** Vários restaurantes, usuários e integrações, sem misturar dados entre organizações.
4. **Experiências independentes.** O mesmo restaurante tem cardápios com organização, seleção e apresentação próprias.
5. **Evolução incremental.** A V1 entrega a fundação. Não antecipa o que ainda não precisa existir.

## Estado atual

O código publicado hoje é a experiência de um restaurante, o Studios Coffee. Essa experiência é a base a preservar quando for compatível com multi-restaurante. Ela ainda não implementa esta visão. Ver [estado atual](../architecture/current-state.md).
