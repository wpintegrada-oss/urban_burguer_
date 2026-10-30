export type OrderStatus =
  | "recebido"
  | "preparando"
  | "saiu_entrega"
  | "entregue"
  | "cancelado";

export type PaymentMethod = "pix" | "cartao_credito" | "cartao_debito" | "dinheiro";

export interface OrderLineAddon {
  id: string;
  name: string;
  price: number;
}

export interface OrderLine {
  itemId: string;
  name: string;
  qty: number;
  unitPrice: number; // preço do item + adicionais, por unidade
  addons: OrderLineAddon[];
  obs: string;
  lineTotal: number;
}

export interface Order {
  id: string; // ex.: "UB-7K3Q"
  status: OrderStatus;
  customer: { name: string; phone: string };
  address: { street: string; number: string; neighborhood: string; complement: string };
  payment: { method: PaymentMethod; changeFor: string };
  notes: string;
  items: OrderLine[];
  total: number;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
}

/** Versão pública (rastreio): sem telefone nem endereço. */
export interface PublicOrder {
  id: string;
  status: OrderStatus;
  firstName: string;
  paymentMethod: PaymentMethod;
  items: OrderLine[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  customer: { name: string; phone: string };
  address: { street: string; number: string; neighborhood: string; complement?: string };
  payment: { method: PaymentMethod; changeFor?: string };
  notes?: string;
  items: { itemId: string; qty: number; addonIds: string[]; obs?: string }[];
}

// ── Cardápio editável (guardado no banco) ───────────────────────────────────

export type IconName =
  | "Flame"
  | "Award"
  | "UtensilsCrossed"
  | "Sparkles"
  | "Layers"
  | "Boxes"
  | "Zap"
  | "GlassWater";

export const ICON_NAMES: IconName[] = [
  "Flame",
  "Award",
  "UtensilsCrossed",
  "Sparkles",
  "Layers",
  "Boxes",
  "Zap",
  "GlassWater",
];

export interface Category {
  id: string;
  name: string;
  icon: IconName;
  description: string;
  order: number;
  active: boolean;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  badge: string; // vazio = sem selo
  addons: string[]; // ids de adicionais
  promoPrice: number | null; // preço promocional (null = sem promoção)
  promoUntil: string; // "AAAA-MM-DD" último dia da promoção; vazio = sem data final
  order: number;
  active: boolean;
}

export interface Settings {
  name: string;
  tagline: string;
  heroTitle: string;
  heroAccent: string;
  heroSubtitle: string;
  heroImage: string;
  whatsappNumber: string; // só dígitos, com 55, ex.: 5586998166138
  whatsappDisplay: string;
  instagram: string; // só o usuário, sem @ (ex.: urbanburguer)
  hours: string; // horário de funcionamento, texto livre (pode ter várias linhas)
}

export interface Menu {
  categories: Category[];
  products: MenuItem[];
  addons: Addon[];
  settings: Settings;
}

/** O que a API entrega ao site: o cardápio + a data de hoje (fuso de São Paulo), para as promoções valerem igual no servidor e na tela. */
export interface PublicMenu extends Menu {
  today: string;
}
