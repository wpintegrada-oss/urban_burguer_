import type { Addon, Category, Menu, MenuItem, PublicMenu } from "./types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Data de hoje no fuso de São Paulo, no formato AAAA-MM-DD. */
export function todayBR(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

type PromoFields = Pick<MenuItem, "price" | "promoPrice" | "promoUntil">;

/** A promoção vale se tem preço promocional menor que o normal e a data final (se houver) ainda não passou. */
export function isPromoActive(item: PromoFields, today: string = todayBR()): boolean {
  const p = item.promoPrice;
  if (p === null || p === undefined) return false;
  if (!(p > 0 && p < item.price)) return false;
  return !item.promoUntil || today <= item.promoUntil;
}

export function effectivePrice(item: PromoFields, today: string = todayBR()): number {
  return isPromoActive(item, today) ? (item.promoPrice as number) : item.price;
}

export function percentOff(item: PromoFields): number {
  if (item.promoPrice === null || item.price <= 0) return 0;
  return Math.round((1 - item.promoPrice / item.price) * 100);
}

/** Índices por id, já com a data de hoje. No servidor e no site são montados só com o que está ATIVO. */
export interface MenuIndex {
  today: string;
  itemById: Record<string, MenuItem>;
  addonById: Record<string, Addon>;
  categoryById: Record<string, Category>;
}

export function indexMenu(
  menu: { categories: Category[]; products: MenuItem[]; addons: Addon[] },
  today: string = todayBR(),
): MenuIndex {
  return {
    today,
    itemById: Object.fromEntries(menu.products.map((p) => [p.id, p])),
    addonById: Object.fromEntries(menu.addons.map((a) => [a.id, a])),
    categoryById: Object.fromEntries(menu.categories.map((c) => [c.id, c])),
  };
}

export const EMPTY_INDEX: MenuIndex = { today: "", itemById: {}, addonById: {}, categoryById: {} };

/** Preço unitário = item (com promoção, se valer) + adicionais válidos para o item. null se algo for inválido. */
export function unitPriceOf(index: MenuIndex, itemId: string, addonIds: string[]): number | null {
  const item = index.itemById[itemId];
  if (!item) return null;
  let total = effectivePrice(item, index.today);
  for (const id of addonIds) {
    const addon = index.addonById[id];
    if (!addon || !item.addons.includes(id)) return null;
    total += addon.price;
  }
  return round2(total);
}

/** O que o cliente enxerga: só categorias, produtos e adicionais ATIVOS. */
export function toPublicMenu(menu: Menu, today: string): PublicMenu {
  const categories = menu.categories.filter((c) => c.active);
  const categoryIds = new Set(categories.map((c) => c.id));
  const addons = menu.addons.filter((a) => a.active);
  const addonIds = new Set(addons.map((a) => a.id));
  const products = menu.products
    .filter((p) => p.active && categoryIds.has(p.categoryId))
    .map((p) => ({ ...p, addons: p.addons.filter((id) => addonIds.has(id)) }));
  return { categories, products, addons, settings: menu.settings, today };
}

export const byOrder = <T extends { order: number; name: string }>(a: T, b: T) =>
  a.order - b.order || a.name.localeCompare(b.name, "pt-BR");
