import { ITEM_BY_ID, ADDON_BY_ID, PAYMENT_METHODS } from "../../shared/menu";
import { round2, unitPriceOf } from "../../shared/pricing";
import type { CreateOrderInput, Order, OrderLine, PaymentMethod } from "../../shared/types";

type Result = { ok: true; value: Omit<Order, "id" | "status" | "createdAt" | "updatedAt"> } | { ok: false; error: string };

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Valida o corpo do pedido e RECALCULA todos os preços a partir do cardápio do servidor. */
export function validateOrder(body: unknown): Result {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Corpo inválido" };
  const b = body as Partial<CreateOrderInput>;

  const name = str(b.customer?.name, 80);
  const phone = str(b.customer?.phone, 30);
  const digits = phone.replace(/\D/g, "");
  if (name.length < 2) return { ok: false, error: "Informe seu nome" };
  if (digits.length < 10 || digits.length > 13) return { ok: false, error: "Telefone inválido" };

  const street = str(b.address?.street, 120);
  const number = str(b.address?.number, 20);
  const neighborhood = str(b.address?.neighborhood, 80);
  const complement = str(b.address?.complement, 120);
  if (!street || !number || !neighborhood) {
    return { ok: false, error: "Preencha rua, número e bairro" };
  }

  const method = b.payment?.method as PaymentMethod | undefined;
  if (!method || !PAYMENT_METHODS.some((p) => p.id === method)) {
    return { ok: false, error: "Forma de pagamento inválida" };
  }
  const changeFor = method === "dinheiro" ? str(b.payment?.changeFor, 40) : "";

  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 50) {
    return { ok: false, error: "Carrinho vazio ou grande demais" };
  }

  const lines: OrderLine[] = [];
  for (const raw of b.items) {
    const item = ITEM_BY_ID[String(raw?.itemId)];
    if (!item) return { ok: false, error: "Item inexistente no cardápio" };
    const qty = Number(raw.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return { ok: false, error: "Quantidade inválida" };
    }
    const addonIds = Array.isArray(raw.addonIds) ? [...new Set(raw.addonIds.map(String))] : [];
    const unit = unitPriceOf(item.id, addonIds);
    if (unit === null) return { ok: false, error: `Adicional inválido para ${item.name}` };
    lines.push({
      itemId: item.id,
      name: item.name,
      qty,
      unitPrice: unit,
      addons: addonIds.map((id) => ({ id, name: ADDON_BY_ID[id].name, price: ADDON_BY_ID[id].price })),
      obs: str(raw.obs, 200),
      lineTotal: round2(unit * qty),
    });
  }

  return {
    ok: true,
    value: {
      customer: { name, phone },
      address: { street, number, neighborhood, complement },
      payment: { method, changeFor },
      notes: str(b.notes, 300),
      items: lines,
      total: round2(lines.reduce((s, l) => s + l.lineTotal, 0)),
    },
  };
}
