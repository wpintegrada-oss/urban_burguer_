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
