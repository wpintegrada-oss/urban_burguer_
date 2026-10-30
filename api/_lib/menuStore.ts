import type { Document } from "mongodb";
import { getDb } from "./db";
import {
  DEFAULT_ADDONS,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
} from "../../shared/menu";
import { byOrder } from "../../shared/pricing";
import type { Addon, Category, Menu, MenuItem, Settings } from "../../shared/types";

let seededOnce = false;

/**
 * Na primeira vez, copia o cardápio inicial (shared/menu.ts) para o banco.
 * É idempotente ($setOnInsert nunca sobrescreve) e só roda enquanto a marca
 * "seeded" não existir — então apagar produtos depois NÃO os traz de volta.
 */
export async function ensureSeeded(): Promise<void> {
  if (seededOnce) return;
  const db = await getDb();
  const settings = db.collection("settings");

  const existing = await settings.findOne({ _id: "main" as never });
  if (!existing?.seeded) {
    const upserts = (items: { id: string }[]) =>
      items.map((it) => ({
        updateOne: { filter: { id: it.id }, update: { $setOnInsert: { ...it } }, upsert: true },
      }));
    await db.collection("categories").bulkWrite(upserts(DEFAULT_CATEGORIES), { ordered: false });
    await db.collection("addons").bulkWrite(upserts(DEFAULT_ADDONS), { ordered: false });
    await db.collection("products").bulkWrite(upserts(DEFAULT_PRODUCTS), { ordered: false });
    await settings.updateOne(
      { _id: "main" as never },
      { $setOnInsert: { ...DEFAULT_SETTINGS }, $set: { seeded: true } },
      { upsert: true },
    );
  }
  seededOnce = true;
}

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const text = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

export function toCategory(d: Document): Category {
  return {
    id: text(d.id),
    name: text(d.name),
    icon: (text(d.icon, "Flame") || "Flame") as Category["icon"],
    description: text(d.description),
    order: num(d.order, 0),
    active: d.active !== false,
  };
}

export function toAddon(d: Document): Addon {
  return { id: text(d.id), name: text(d.name), price: num(d.price, 0), active: d.active !== false };
}

export function toProduct(d: Document): MenuItem {
  return {
    id: text(d.id),
    categoryId: text(d.categoryId),
    name: text(d.name),
    price: num(d.price, 0),
    description: text(d.description),
    image: text(d.image),
    badge: text(d.badge),
    addons: Array.isArray(d.addons) ? d.addons.map(String) : [],
    promoPrice: typeof d.promoPrice === "number" ? d.promoPrice : null,
    promoUntil: text(d.promoUntil),
    order: num(d.order, 0),
    active: d.active !== false,
  };
}

export function toSettings(d: Document | null): Settings {
  const s: Record<string, unknown> = d ?? {};
  const pick = <K extends keyof Settings>(k: K): Settings[K] =>
    (typeof s[k] === "string" ? s[k] : DEFAULT_SETTINGS[k]) as Settings[K];
  return {
    name: pick("name"),
    tagline: pick("tagline"),
    heroTitle: pick("heroTitle"),
    heroAccent: pick("heroAccent"),
    heroSubtitle: pick("heroSubtitle"),
    heroImage: pick("heroImage"),
    whatsappNumber: pick("whatsappNumber"),
    whatsappDisplay: pick("whatsappDisplay"),
  };
}

/**
 * onlyActive = true  → o que o cliente vê (e o que vale para pedidos).
 * onlyActive = false → tudo, inclusive desativados (painel admin).
 */
export async function loadMenu(onlyActive: boolean): Promise<Menu> {
  await ensureSeeded();
  const db = await getDb();
  const opts = { projection: { _id: 0 } };
  const [catDocs, prodDocs, addonDocs, settingsDoc] = await Promise.all([
    db.collection("categories").find({}, opts).toArray(),
    db.collection("products").find({}, opts).toArray(),
    db.collection("addons").find({}, opts).toArray(),
    db.collection("settings").findOne({ _id: "main" as never }),
  ]);

  let categories = catDocs.map(toCategory);
  let products = prodDocs.map(toProduct);
  let addons = addonDocs.map(toAddon);

  if (onlyActive) {
    categories = categories.filter((c) => c.active);
    const catIds = new Set(categories.map((c) => c.id));
    addons = addons.filter((a) => a.active);
    const addonIds = new Set(addons.map((a) => a.id));
    products = products
      .filter((p) => p.active && catIds.has(p.categoryId))
      .map((p) => ({ ...p, addons: p.addons.filter((id) => addonIds.has(id)) }));
  }

  return {
    categories: categories.sort(byOrder),
    products: products.sort(byOrder),
    addons: addons.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    settings: toSettings(settingsDoc),
  };
}
