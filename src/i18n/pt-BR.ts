export const ptBR = {
  theme: {
    switchToLight: "Ativar modo claro",
    switchToDark: "Ativar modo escuro",
  },
  meta: {
    title: "Studios Coffee · São Paulo",
  },
  hub: {
    logoAlt: "Coffee Feelings",
    tagline: "Aqui tem café especial",
    exploreMenu: "Explorar cardápio",
    googleReview: "Avaliar no Google",
    wifi: "Conectar ao Wi-Fi",
    cashback: "Ganhe 2% de cashback",
    loyalty: "Resgate produtos com pontos",
    guestSheetAria: (program: string) => `Cadastro de ${program}`,
    guestCashbackTitle: "Cashback",
    guestLoyaltyTitle: "Fidelidade",
    guestCashbackReward:
      "Em cada compra, 2% do valor volta em saldo para você usar na próxima visita.",
    guestLoyaltyReward:
      "A cada R$ 1 em compras, você ganha 1 ponto para trocar por recompensas aqui no café.",
    guestJoin: "Participar do programa",
    guestName: "Nome",
    guestPhone: "Telefone",
    guestBirthDate: "Data de nascimento",
    guestPhonePlaceholder: "(11) 99999-9999",
    guestSubmit: "Continuar",
    guestSuccessTitle: "Dados recebidos :)",
    guestSuccessBody:
      "Para confirmar seu cadastro, digite abaixo o código recebido no WhatsApp.",
    guestCodeLabel: "Código do WhatsApp",
    guestCodeDigit: (index: number) => `Dígito ${index} de 5`,
    guestCodeConfirmed: "Código confirmado",
    guestCodeInvalid: "Código incorreto",
    guestAddToWallet: "Adicionar à carteira",
    guestPassTierLabel: "Nível",
    guestPassTier: "Casa",
    guestPassHolder: "Titular",
    guestPassNext: "Próximo nível",
    guestPassNextValue: "Faltam R$ 120 para chegar em Reserva",
    guestPassSample: "Amostra",
    guestNameError: "Informe seu nome.",
    guestPhoneError: "Informe um telefone com DDD.",
    guestBirthDateError: "Informe uma data de nascimento válida.",
    wifiModalAria: (brandName: string) => `Wi-Fi ${brandName}`,
    wifiModalTitle: (brandName: string) => `Wi-Fi ${brandName}`,
    wifiNetwork: "Rede",
    wifiPassword: "Senha",
    wifiCopy: "Copiar",
    wifiCopied: "Copiado",
    wifiHint:
      "Copie a senha e conecte nas configurações de Wi-Fi do seu celular. O site não conecta automaticamente.",
    close: "Fechar",
  },
  discover: {
    brandName: "Studios Coffee",
    wifiLabel: "wifi",
    wifiOpenHub: "Abrir boas-vindas e Wi-Fi",
    viewMode: "Modo de visualização",
    viewReels: "Modo reels",
    viewFeed: "Modo feed",
    categories: "Categorias",
    markInterested: "Marcar como interessado",
    viewProduct: (name: string) => `Ver ${name}`,
    exploreMenu: "Explorar cardápio",
    outroTitle: "Tudo o que servimos.",
    outroSubtitle: "São Paulo, Brasil",
    backToFeed: "Voltar ao feed",
    backToProfileGrid: "Voltar ao perfil",
    feedLayout: "Visualização do cardápio no feed",
    feedLayoutGrid: "Grade",
    feedLayoutList: "Lista",
    profileGrid: "Publicações do cardápio",
    reelDialog: (name: string) => `Reel de ${name}`,
    closeImmersiveFromFeed: "Fechar e voltar ao feed",
    closeFeedPostToGrid: "Fechar e voltar à grade",
  },
  categories: {
    quente: "Quente",
    gelado: "Gelado",
    matcha: "Matcha",
    metodos: "Métodos",
    chas: "Chás",
    comer: "Para comer",
    refrescos: "Refrescos",
  },
  products: {
    espresso: {
      name: "Espresso",
      description: "Shot curto, encorpado e aromático.",
    },
    "espresso-duplo": {
      name: "Espresso duplo",
      description: "Dois shots para um café mais intenso.",
    },
    macchiato: {
      name: "Macchiato",
      description: "Espresso marcado com uma camada de leite vaporizado.",
    },
    americano: {
      name: "Americano",
      description: "Espresso alongado com água quente, suave e longo.",
    },
    cappuccino: {
      name: "Cappuccino",
      description: "Espresso, leite vaporizado e espuma cremosa.",
    },
    cortado: {
      name: "Cortado",
      description: "Espresso equilibrado com pouco leite quente.",
    },
    "chocolate-quente": {
      name: "Chocolate quente",
      description: "Chocolate belga derretido no leite vaporizado.",
    },
    latte: {
      name: "Latte",
      description: "Espresso com leite vaporizado, sedoso e confortável.",
    },
    "mocha-quente": {
      name: "Mocha",
      description: "Espresso, chocolate e leite em uma bebida quente.",
    },
    "chai-latte-quente": {
      name: "Chai latte",
      description: "Chai especiado batido com leite vaporizado.",
    },
    "flat-white": {
      name: "Flat white",
      description: "Espresso duplo com microespuma de leite, intenso e liso.",
    },
    "gelado-latte": {
      name: "Latte gelado",
      description: "Espresso e leite frio sobre gelo.",
    },
    "espresso-tonica": {
      name: "Espresso tônica",
      description: "Espresso sobre tônica e gelo, cítrico e refrescante.",
    },
    "chocolate-gelado": {
      name: "Chocolate gelado",
      description: "Chocolate da casa com leite gelado e gelo.",
    },
    "mocha-gelado": {
      name: "Mocha gelado",
      description: "Café, chocolate e leite servidos bem gelados.",
    },
    "cold-brew": {
      name: "Cold brew",
      description: "Extração lenta, servida gelada e suave.",
    },
    "cold-brew-tonica": {
      name: "Cold brew tônica",
      description: "Cold brew com tônica e gelo, leve amargor e gás.",
    },
    "gelado-matcha-latte": {
      name: "Matcha latte",
      description: "Matcha batido com leite gelado.",
    },
    "gelado-chai": {
      name: "Chai gelado",
      description: "Chai especiado com leite frio e gelo.",
    },
    "matcha-latte": {
      name: "Matcha latte",
      description: "Matcha cerimonial whisked com leite vaporizado.",
    },
    "matcha-latte-gelado": {
      name: "Matcha latte gelado",
      description: "Matcha sobre leite gelado, fresco e herbáceo.",
    },
    "matcha-tonica": {
      name: "Matcha tônica",
      description: "Matcha com tônica e gelo, vibrante e leve.",
    },
    "coado-da-casa": {
      name: "Coado da casa",
      description: "Filtro do dia, perfil limpo e aromático.",
    },
    aeropress: {
      name: "Aeropress",
      description: "Pressão suave para uma xícara encorpada e rápida.",
    },
    v60: {
      name: "V60",
      description: "Pour-over manual, destaca notas frutadas e florais.",
    },
    "cha-casa-de-vo": {
      name: "Casa de vó",
      description: "Capim-limão, limão siciliano, laranja, gengibre e menta.",
    },
    "cha-flor-de-noiva": {
      name: "Flor de noiva",
      description: "Oolong de Taiwan com flor de laranjeira e aroma de laranja.",
    },
    "cha-do-mes": {
      name: "Chá do mês",
      description: "Seleção especial — consulte o sabor com a equipe.",
    },
    "queijo-quente": {
      name: "Queijo quente",
      description: "Pão sourdough na chapa com queijo canastra.",
    },
    croissant: {
      name: "Croissant",
      description: "Ricota temperada, abobrinha marinada e rúcula.",
    },
    presunto: {
      name: "Presunto",
      description: "Presunto royal, mostarda e rúcula.",
    },
    "peito-frango-defumado": {
      name: "Peito de frango defumado",
      description: "Gouda, rúcula, picles de pepino e salada de batata com mostarda dijon.",
    },
    "torta-salgada-mix": {
      name: "Torta salgada fatia + mix salada",
      description: "Fatia do dia acompanhada de mix de folhas.",
    },
    "combo-cafe-manha": {
      name: "Combo café-da-manhã",
      description: "Bebida, iogurte com granola e pão sourdough na chapa.",
    },
    "bowl-iogurte-granola": {
      name: "Bowl de iogurte com granola da casa",
      description: "Iogurte cremoso com granola artesanal.",
    },
    refrigerante: {
      name: "Refrigerante",
      description: "Lata gelada, consulte marcas disponíveis.",
    },
    "cha-mate": {
      name: "Chá mate",
      description: "Mate gelado ou natural, conforme disponibilidade.",
    },
    cerveja: {
      name: "Cerveja",
      description: "Seleção gelada — pergunte à equipe.",
    },
    "suco-laranja": {
      name: "Suco de laranja",
      description: "Espremido na hora, doce e fresco.",
    },
    "groselha-punch": {
      name: "Groselha punch",
      description: "Groselha com toque cítrico e gelo.",
    },
    "refresco-hibisco": {
      name: "Refresco de hibisco",
      description: "Hibisco infusionado, levemente adocicado.",
    },
    "ginger-ale-casa": {
      name: "Ginger ale da casa",
      description: "Gengibre fresco, gás suave e final picante.",
    },
  } as Record<string, { name: string; description: string }>,
};

export type ProductTranslationId = keyof typeof ptBR.products;

/** Conversão EUR→BRL só para exibição; ajuste conforme necessário. */
export const EUR_TO_BRL = 6.1;

export function priceInBrl(euroLabel: string | null): string | null {
  if (!euroLabel) return null;
  if (/^\s*R\$\s*/.test(euroLabel)) return euroLabel;
  const match = euroLabel.match(/(\d+),(\d+)\s*€/);
  if (!match) return euroLabel;
  const euros = Number(`${match[1]}.${match[2]}`);
  const brl = euros * EUR_TO_BRL;
  const rounded = Math.max(0, Math.round(brl) - 0.1);
  const [whole, cents] = rounded.toFixed(2).split(".");
  return `R$ ${whole},${cents}`;
}
