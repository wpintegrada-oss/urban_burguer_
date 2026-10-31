import type {
  Addon,
  Category,
  IconName,
  Menu,
  MenuItem,
  OrderStatus,
  PaymentMethod,
  Settings,
} from "./types";

export type { Addon, Category, MenuItem } from "./types";

// ──────────────────────────────────────────────────────────────────────────
// CARDÁPIO INICIAL. Estes dados só são usados para preencher o banco na
// primeira vez que o site abre (e como reserva se o servidor estiver fora).
// Depois disso, tudo é editado pelo painel /admin — não precisa mexer aqui.
// ──────────────────────────────────────────────────────────────────────────

const IMG = {
  burgerA: "https://images.pexels.com/photos/18987002/pexels-photo-18987002.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  burgerB: "https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  burgerC: "https://images.unsplash.com/photo-1788601405398-e8a4d3a6d7c9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwYnVyZ2VyJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzkyNTA2NTM5fDA&ixlib=rb-4.1.0&q=85",
  friesBasket: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxjcmlzcHklMjBmcmVuY2glMjBmcmllcyUyMGRhcmt8ZW58MHx8fHwxNzkyNTA2NTQzfDA&ixlib=rb-4.1.0&q=85",
  friesLoaded: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxjcmlzcHklMjBmcmVuY2glMjBmcmllcyUyMGRhcmt8ZW58MHx8fHwxNzkyNTA2NTQzfDA&ixlib=rb-4.1.0&q=85",
  can: "https://images.pexels.com/photos/4113653/pexels-photo-4113653.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  colaIce: "https://images.pexels.com/photos/33469209/pexels-photo-33469209.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
};

export const DEFAULT_SETTINGS: Settings = {
  name: "Urban Burguer",
  tagline: "Hamburgueria Artesanal",
  heroTitle: "Burgers feitos na chapa,",
  heroAccent: "entregues quentes.",
  heroSubtitle:
    "Peça online seus burgers, combos, porções e batatas recheadas. Entrega rápida e confirmação pelo WhatsApp.",
  heroImage: IMG.burgerA,
  whatsappNumber: "5586998166138",
  whatsappDisplay: "(86) 99816-6138",
  instagram: "urbanburguer__the",
  hours: "",
  pixKey: "",
  pixQr: "",
};

const cat = (id: string, name: string, icon: IconName, description: string): Omit<Category, "order" | "active"> => ({
  id,
  name,
  icon,
  description,
});

export const DEFAULT_CATEGORIES: Category[] = [
  cat("especiais", "Especiais", "Flame", "Burgers artesanais exclusivos com blend premium e molhos especiais da casa"),
  cat("classicos", "Clássicos", "Award", "Receitas icônicas consagradas com sabor inconfundível"),
  cat("tradicionais", "Tradicionais", "UtensilsCrossed", "Os favoritos de sempre preparados com carinho e agilidade"),
  cat("combos-especiais", "Combos Especiais", "Sparkles", "Burger Especial + Batata Frita Crocante + Bebida Gelada"),
  cat("combos-tradicionais", "Combos Tradicionais", "Layers", "Burger Tradicional + Acompanhamento + Refrigerante"),
  cat("porcoes", "Porções", "Boxes", "Petiscos perfeitos para compartilhar ou saborear sozinho"),
  cat("batatas-recheadas", "Batatas Recheadas", "Zap", "Batatas rústicas com cheddar cremoso, bacon crocante e muito mais"),
  cat("bebidas", "Bebidas", "GlassWater", "Refrigerantes, sucos, cervejas e águas bem geladas"),
].map((c, i) => ({ ...c, order: (i + 1) * 10, active: true }));

const addon = (id: string, name: string, price: number): Addon => ({ id, name, price, active: true });

export const DEFAULT_ADDONS: Addon[] = [
  addon("carne-extra", "Blend Extra 150g", 9.0),
  addon("bacon-extra", "Bacon Artesanal Extra", 5.0),
  addon("cheddar-extra", "Cheddar Cremoso Extra", 4.5),
  addon("queijo-gouda-extra", "Queijo Gouda Fatiado", 5.5),
  addon("ovo", "Ovo Frito na Chapa", 3.0),
  addon("cebola-caramelizada", "Cebola Caramelizada", 3.5),
  addon("maionese-defumada", "Pote Maionese Defumada (50ml)", 3.5),
  addon("molho-alho", "Pote Molho Especial de Alho (50ml)", 3.5),
  addon("bacon-na-batata", "Turbinar com Bacon na Batata", 4.0),
  addon("cheddar-na-batata", "Turbinar com Cheddar na Batata", 4.0),
  // Adicionais citados nos itens mas que não estavam no catálogo original.
  // Nomes e PREÇOS provisórios — ajuste pelo painel (aba Adicionais).
  addon("molho-especial", "Pote Molho Especial da Casa (50ml)", 3.5),
  addon("molho-defumado", "Pote Molho Defumado (50ml)", 3.5),
  addon("queijo-extra", "Queijo Prato Extra", 4.0),
  addon("cebola-roxa", "Cebola Roxa", 2.5),
  addon("maionese-verde", "Pote Maionese Verde (50ml)", 3.5),
  addon("turbinar-refrigerante", "Turbinar o Refrigerante", 3.0),
  addon("dobro-de-bacon", "Dobro de Bacon", 5.0),
  addon("molho-extra-alho", "Molho de Alho Extra (50ml)", 3.5),
  addon("molho-extra-barbecue", "Molho Barbecue Extra (50ml)", 3.5),
];

type RawItem = Omit<MenuItem, "order" | "active" | "badge" | "promoPrice" | "promoUntil"> & { badge?: string };

const RAW_ITEMS: RawItem[] = [
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

export const DEFAULT_PRODUCTS: MenuItem[] = RAW_ITEMS.map((p, i) => ({
  ...p,
  badge: p.badge ?? "",
  promoPrice: null,
  promoUntil: "",
  order: (i + 1) * 10,
  active: true,
}));

export const DEFAULT_MENU: Menu = {
  categories: DEFAULT_CATEGORIES,
  products: DEFAULT_PRODUCTS,
  addons: DEFAULT_ADDONS,
  settings: DEFAULT_SETTINGS,
};

// ──────────────────────────────────────────────────────────────────────────
// Partes fixas (não editáveis pelo painel)
// ──────────────────────────────────────────────────────────────────────────

export const PAYMENT_METHODS: { id: PaymentMethod; name: string; desc: string; icon: "QrCode" | "CreditCard" | "Banknote" }[] = [
  { id: "pix", name: "PIX (Instantâneo)", desc: "QR code e chave no pedido", icon: "QrCode" },
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
