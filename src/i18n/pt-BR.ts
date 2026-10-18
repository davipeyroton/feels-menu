export const ptBR = {
  theme: {
    switchToLight: "Ativar modo claro",
    switchToDark: "Ativar modo escuro",
  },
  meta: {
    title: "Francisco · Porto — Boas-vindas",
  },
  hub: {
    tagline: "Café, focaccia e boa companhia.",
    exploreMenu: "Explorar cardápio",
    googleReview: "Avaliar no Google",
    wifi: "Conectar ao Wi-Fi",
    wifiModalAria: "Wi-Fi Francisco",
    wifiModalTitle: "Wi-Fi Francisco",
    wifiNetwork: "Rede",
    wifiPassword: "Senha",
    wifiCopy: "Copiar",
    wifiCopied: "Copiado",
    wifiHint:
      "Copie a senha e conecte nas configurações de Wi-Fi do seu celular. O site não conecta automaticamente.",
    close: "Fechar",
  },
  discover: {
    wifiLabel: "Wi-Fi",
    wifiOpenHub: "Abrir boas-vindas e Wi-Fi",
    viewMode: "Modo de visualização",
    viewReels: "Modo reels",
    viewFeed: "Modo feed",
    categories: "Categorias",
    markInterested: "Marcar como interessado",
    viewProduct: (name: string) => `Ver ${name}`,
    exploreMenu: "Explorar cardápio",
    outroTitle: "Tudo o que servimos.",
    outroSubtitle: "Porto, Portugal",
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
    focaccias: "Focaccias",
    specials: "Especiais",
    coffee: "Café",
    cold: "Bebidas geladas",
    "no-coffee": "Sem café",
    drinks: "Bebidas",
  },
  products: {
    "roasted-bell-pepper-eggplants": {
      name: "Pimentão e berinjela assados",
      description:
        "Pimentões assados, berinjela, pickles e pesto de tomate seco.",
    },
    mortadella: {
      name: "Mortadela",
      description:
        "Mortadela, pesto, stracciatella, amendoim caramelizado e rúcula. Contém porco.",
    },
    "spicy-chorizo": {
      name: "Chouriço picante",
      description:
        "Chouriço picante, purê de batata, pimentões assados, stracciatella e óleo de pimenta.",
    },
    "pulled-pork-barbecue": {
      name: "Pulled pork barbecue",
      description: "Pulled pork barbecue, stracciatella, pickles e rúcula.",
    },
    pepperoni: {
      name: "Pepperoni",
      description:
        "Pepperoni, creme de Taleggio, pickles, rúcula e molho de mel picante.",
    },
    "iced-strawberry-matcha": {
      name: "Matcha gelado com morango",
      description: "Matcha cerimonial sobre leite gelado e morango fresco.",
    },
    "cold-brew-tonic-oj": {
      name: "Cold brew com tônica e laranja",
      description: "Cold brew e tônica, com suco de laranja fresco.",
    },
    espresso: {
      name: "Espresso",
      description: "Uma extração curta e intensa do nosso espresso da casa.",
    },
    americano: {
      name: "Americano",
      description: "Espresso alongado com água quente.",
    },
    "batch-brew": {
      name: "Café filtrado",
      description: "Café filtrado em lote, limpo e leve.",
    },
    "espresso-milk-small": {
      name: "Espresso com leite — Pequeno",
      description: "Espresso e leite vaporizado, tamanho pequeno.",
    },
    "espresso-milk-medium": {
      name: "Espresso com leite — Médio",
      description: "Espresso e leite vaporizado, tamanho médio.",
    },
    "espresso-milk-large": {
      name: "Espresso com leite — Grande",
      description: "Espresso e leite vaporizado, tamanho grande.",
    },
    "iced-americano": {
      name: "Americano gelado",
      description: "Espresso sobre gelo e água fria.",
    },
    "iced-latte": {
      name: "Latte gelado",
      description: "Espresso e leite gelado com bastante gelo.",
    },
    "cold-brew": {
      name: "Cold brew",
      description: "Extraído por horas, servido gelado e suave.",
    },
    "espresso-tonic": {
      name: "Espresso tônica",
      description: "Espresso sobre tônica e gelo — amargo, vibrante e com gás.",
    },
    "matcha-latte": {
      name: "Matcha latte",
      description: "Matcha batido com leite vaporizado.",
    },
    "iced-matcha-latte": {
      name: "Matcha latte gelado",
      description: "Matcha batido sobre leite gelado e gelo.",
    },
    "chai-latte": {
      name: "Chai latte",
      description: "Chai especiado com leite vaporizado.",
    },
    "iced-chai-latte": {
      name: "Chai latte gelado",
      description: "Chai especiado sobre leite gelado e gelo.",
    },
    "matcha-lemonade": {
      name: "Limonada de matcha",
      description: "Matcha e limonada da casa sobre gelo.",
    },
    teas: {
      name: "Chás",
      description: "Pergunte à equipe a seleção do dia.",
    },
    water: {
      name: "Água",
      description: "Água mineral sem gás.",
    },
    "sparkling-water": {
      name: "Água com gás",
      description: "Água mineral com gás.",
    },
    "coca-cola": {
      name: "Coca-Cola / Zero",
      description: "Clássica ou Zero, bem gelada.",
    },
    kombuchas: {
      name: "Kombuchas",
      description: "Seleção rotativa. Pergunte à equipe.",
    },
    "cold-brew-negroni": {
      name: "Negroni de cold brew",
      description: "Cold brew, Campari e Martini.",
    },
    "espresso-martini": {
      name: "Espresso martini",
      description: "Vodka, espresso duplo e licor de café.",
    },
    beers: {
      name: "Cervejas",
      description: "Pergunte à equipe.",
    },
    wines: {
      name: "Vinhos",
      description: "Pergunte à equipe.",
    },
  } as Record<string, { name: string; description: string }>,
};

export type ProductTranslationId = keyof typeof ptBR.products;

/** Conversão EUR→BRL só para exibição; ajuste conforme necessário. */
export const EUR_TO_BRL = 6.1;

export function priceInBrl(euroLabel: string | null): string | null {
  if (!euroLabel) return null;
  const match = euroLabel.match(/(\d+),(\d+)\s*€/);
  if (!match) return euroLabel;
  const euros = Number(`${match[1]}.${match[2]}`);
  const brl = euros * EUR_TO_BRL;
  const rounded = Math.max(0, Math.round(brl) - 0.1);
  const [whole, cents] = rounded.toFixed(2).split(".");
  return `R$ ${whole},${cents}`;
}
