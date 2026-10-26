import type { OrderStatus, PaymentMethod } from "./types";

// ──────────────────────────────────────────────────────────────────────────
// EDITE AQUI: cardápio, adicionais e dados da loja. O site e a API leem
// este mesmo arquivo (a API recalcula os preços no servidor).
// ──────────────────────────────────────────────────────────────────────────

export const STORE = {
  name: "Urban Burguer",
  tagline: "Hamburgueria Artesanal",
  whatsappNumber: "5586998166138",
  whatsappDisplay: "(86) 99816-6138",
};

export interface Category {
  id: string;
  name: string;
  icon: "Flame" | "Award" | "UtensilsCrossed" | "Sparkles" | "Layers" | "Boxes" | "Zap" | "GlassWater";
  description: string;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  badge?: string;
  addons: string[];
}

export const CATEGORIES: Category[] = [
  { id: "especiais", name: "Especiais", icon: "Flame", description: "Burgers artesanais exclusivos com blend premium e molhos especiais da casa" },
  { id: "classicos", name: "Clássicos", icon: "Award", description: "Receitas icônicas consagradas com sabor inconfundível" },
  { id: "tradicionais", name: "Tradicionais", icon: "UtensilsCrossed", description: "Os favoritos de sempre preparados com carinho e agilidade" },
  { id: "combos-especiais", name: "Combos Especiais", icon: "Sparkles", description: "Burger Especial + Batata Frita Crocante + Bebida Gelada" },
  { id: "combos-tradicionais", name: "Combos Tradicionais", icon: "Layers", description: "Burger Tradicional + Acompanhamento + Refrigerante" },
  { id: "porcoes", name: "Porções", icon: "Boxes", description: "Petiscos perfeitos para compartilhar ou saborear sozinho" },
  { id: "batatas-recheadas", name: "Batatas Recheadas", icon: "Zap", description: "Batatas rústicas com cheddar cremoso, bacon crocante e muito mais" },
  { id: "bebidas", name: "Bebidas", icon: "GlassWater", description: "Refrigerantes, sucos, cervejas e águas bem geladas" },
];

export const ADDONS: Addon[] = [
  { id: "carne-extra", name: "Blend Extra 150g", price: 9.0 },
  { id: "bacon-extra", name: "Bacon Artesanal Extra", price: 5.0 },
  { id: "cheddar-extra", name: "Cheddar Cremoso Extra", price: 4.5 },
  { id: "queijo-gouda-extra", name: "Queijo Gouda Fatiado", price: 5.5 },
  { id: "ovo", name: "Ovo Frito na Chapa", price: 3.0 },
  { id: "cebola-caramelizada", name: "Cebola Caramelizada", price: 3.5 },
  { id: "maionese-defumada", name: "Pote Maionese Defumada (50ml)", price: 3.5 },
  { id: "molho-alho", name: "Pote Molho Especial de Alho (50ml)", price: 3.5 },
  { id: "bacon-na-batata", name: "Turbinar com Bacon na Batata", price: 4.0 },
  { id: "cheddar-na-batata", name: "Turbinar com Cheddar na Batata", price: 4.0 },
  // Adicionais citados nos itens mas que não estavam no catálogo original.
  // Nomes e PREÇOS abaixo são provisórios — confira com a loja.
  { id: "molho-especial", name: "Pote Molho Especial da Casa (50ml)", price: 3.5 },
  { id: "molho-defumado", name: "Pote Molho Defumado (50ml)", price: 3.5 },
  { id: "queijo-extra", name: "Queijo Prato Extra", price: 4.0 },
  { id: "cebola-roxa", name: "Cebola Roxa", price: 2.5 },
  { id: "maionese-verde", name: "Pote Maionese Verde (50ml)", price: 3.5 },
  { id: "turbinar-refrigerante", name: "Turbinar o Refrigerante", price: 3.0 },
  { id: "dobro-de-bacon", name: "Dobro de Bacon", price: 5.0 },
  { id: "molho-extra-alho", name: "Molho de Alho Extra (50ml)", price: 3.5 },
  { id: "molho-extra-barbecue", name: "Molho Barbecue Extra (50ml)", price: 3.5 },
];

const IMG = {
  burgerA: "https://images.pexels.com/photos/18987002/pexels-photo-18987002.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  burgerB: "https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  burgerC: "https://images.unsplash.com/photo-1788601405398-e8a4d3a6d7c9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwYnVyZ2VyJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzkyNTA2NTM5fDA&ixlib=rb-4.1.0&q=85",
  friesBasket: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxjcmlzcHklMjBmcmVuY2glMjBmcmllcyUyMGRhcmt8ZW58MHx8fHwxNzkyNTA2NTQzfDA&ixlib=rb-4.1.0&q=85",
  friesLoaded: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxjcmlzcHklMjBmcmVuY2glMjBmcmllcyUyMGRhcmt8ZW58MHx8fHwxNzkyNTA2NTQzfDA&ixlib=rb-4.1.0&q=85",
  can: "https://images.pexels.com/photos/4113653/pexels-photo-4113653.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  colaIce: "https://images.pexels.com/photos/33469209/pexels-photo-33469209.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
};

export const HERO_IMAGE = IMG.burgerA;

export const ITEMS: MenuItem[] = [
  {
    id: "esp-urban-monster",
    categoryId: "especiais",
    name: "Urban Monster",
    price: 38.0,
    description: "Pão brioche tostado na manteiga, 2x smash burgers 150g, queijo cheddar duplo derretido, bacon artesanal crocante, cebola caramelizada e maionese defumada da casa.",
    image: IMG.burgerA,
    badge: "Mais Pedido",
    addons: ["carne-extra", "bacon-extra", "cheddar-extra", "ovo", "molho-especial"],
  },
  {
    id: "esp-bacon-blaze",
    categoryId: "especiais",
    name: "Bacon Blaze",
    price: 34.0,
    description: "Pão australiano, blend 180g grelhado no fogo, geleia de bacon picante, queijo gouda e crisp de cebola.",
    image: IMG.burgerB,
    badge: "Chef Especial",
    addons: ["carne-extra", "bacon-extra", "queijo-gouda-extra", "molho-defumado"],
  },
  {
    id: "clas-cheeseburger",
    categoryId: "classicos",
    name: "Classic Cheddar",
    price: 26.0,
    description: "Pão com gergelim, blend 140g, dobro de cheddar cremoso, picles artesanal e molho barbecue.",
    image: IMG.burgerA,
    addons: ["bacon-extra", "cebola-roxa", "maionese-verde"],
  },
  {
    id: "trad-x-salada",
    categoryId: "tradicionais",
    name: "X-Salada Tradicional",
    price: 22.0,
    description: "Pão de hambúrguer macio, carne artesanal 120g, queijo prato derretido, alface fresca, tomate e maionese artesanal.",
    image: IMG.burgerC,
    addons: ["ovo", "bacon-extra", "queijo-extra"],
  },
  {
    id: "combo-monster-fritas-refri",
    categoryId: "combos-especiais",
    name: "Combo Urban Monster",
    price: 48.0,
    description: "1x Urban Monster + 1x Batata Frita Individual Crocante + 1x Refrigerante Lata 350ml.",
    image: IMG.burgerA,
    badge: "Combo Campeão",
    addons: ["bacon-na-batata", "cheddar-na-batata", "turbinar-refrigerante"],
  },
  {
    id: "combo-classic-tarde",
    categoryId: "combos-tradicionais",
    name: "Combo Classic Duplo",
    price: 38.0,
    description: "1x Classic Cheddar + 1x Porção de Fritas + 1x Suco ou Refrigerante.",
    image: IMG.burgerB,
    addons: ["bacon-extra", "cheddar-extra"],
  },
  {
    id: "porcao-batata-rustica",
    categoryId: "porcoes",
    name: "Batata Rústica da Casa",
    price: 22.0,
    description: "Batatas cortadas à mão com alecrim e sal grosso, acompanha molho de alho tostado e maionese de páprica.",
    image: IMG.friesBasket,
    addons: ["molho-extra-alho", "molho-extra-barbecue"],
  },
  {
    id: "batata-cheddar-bacon",
    categoryId: "batatas-recheadas",
    name: "Batata Recheada Vulcão",
    price: 28.0,
    description: "Grande porção de batatas fritas cobertas por cascata de queijo cheddar cremoso e cubos de bacon dourados crocantes.",
    image: IMG.friesLoaded,
    badge: "Mais Pedida",
    addons: ["dobro-de-bacon", "cheddar-extra"],
  },
  {
    id: "bebida-coca-gelada",
    categoryId: "bebidas",
    name: "Coca-Cola Lata 350ml",
    price: 6.5,
    description: "Lata geladíssima (Normal ou Zero Açúcar). Informe a preferência nas observações.",
    image: IMG.can,
    addons: [],
  },
  {
    id: "bebida-guarana-antartica",
    categoryId: "bebidas",
    name: "Guaraná Antarctica 350ml",
    price: 6.5,
    description: "Lata gelada para acompanhar seu lanche.",
    image: IMG.colaIce,
    addons: [],
  },
];

export const ADDON_BY_ID: Record<string, Addon> = Object.fromEntries(ADDONS.map((a) => [a.id, a]));
export const ITEM_BY_ID: Record<string, MenuItem> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const PAYMENT_METHODS: { id: PaymentMethod; name: string; desc: string; icon: "QrCode" | "CreditCard" | "Banknote" }[] = [
  { id: "pix", name: "PIX (Instantâneo)", desc: "Chave PIX enviada no WhatsApp", icon: "QrCode" },
  { id: "cartao_credito", name: "Cartão de Crédito", desc: "Maquininha na entrega", icon: "CreditCard" },
  { id: "cartao_debito", name: "Cartão de Débito", desc: "Maquininha na entrega", icon: "CreditCard" },
  { id: "dinheiro", name: "Dinheiro", desc: "Informe se precisa de troco", icon: "Banknote" },
];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  dinheiro: "Dinheiro",
};

export const STATUS_STEPS: { id: OrderStatus; label: string; badge: string }[] = [
  { id: "recebido", label: "Pedido Recebido", badge: "bg-yellow-500 text-black" },
  { id: "preparando", label: "Na Chapa / Preparando", badge: "bg-orange-500 text-white" },
  { id: "saiu_entrega", label: "Saiu para Entrega", badge: "bg-blue-500 text-white" },
  { id: "entregue", label: "Entregue", badge: "bg-emerald-500 text-white" },
  { id: "cancelado", label: "Cancelado", badge: "bg-red-500 text-white" },
];

export const STATUS_IDS: OrderStatus[] = STATUS_STEPS.map((s) => s.id);
