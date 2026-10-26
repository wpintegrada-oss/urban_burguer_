import { ADDON_BY_ID, ITEM_BY_ID } from "./menu";

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Preço unitário = item + adicionais válidos para o item. Retorna null se algo for inválido. */
export function unitPriceOf(itemId: string, addonIds: string[]): number | null {
  const item = ITEM_BY_ID[itemId];
  if (!item) return null;
  let total = item.price;
  for (const id of addonIds) {
    const addon = ADDON_BY_ID[id];
    if (!addon || !item.addons.includes(id)) return null;
    total += addon.price;
  }
  return round2(total);
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
