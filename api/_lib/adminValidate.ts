import { ICON_NAMES } from "../../shared/types";
import type { Addon, Category, IconName, MenuItem, Settings } from "../../shared/types";
import { round2 } from "../../shared/pricing";

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

type Body = Record<string, unknown>;
const asBody = (b: unknown): Body => (typeof b === "object" && b !== null ? (b as Body) : {});

/** Aceita 12.5, "12,50" ou "12.50". Retorna null se não for um valor válido. */
export function money(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 9999 ? round2(n) : null;
}

function order(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-9999, Math.min(9999, Math.round(n))) : 0;
}

/** Foto: vazia, link https, ou arquivo enviado pelo painel (/api/image?id=...). */
function image(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (s === "") return "";
  if (s.length > 2000) return null;
  if (/^\/api\/image\?id=[a-z0-9]{8,32}$/.test(s)) return s;
  if (/^https:\/\/\S+$/.test(s)) return s;
  return null;
}

function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function parseProduct(
  raw: unknown,
  ctx: { categoryIds: Set<string>; addonIds: Set<string> },
): Parsed<Omit<MenuItem, "id">> {
  const b = asBody(raw);
  const name = str(b.name, 80);
  if (name.length < 1) return fail("Informe o nome do produto");

  const price = money(b.price);
  if (price === null) return fail("Valor inválido");

  const categoryId = str(b.categoryId, 80);
  if (!ctx.categoryIds.has(categoryId)) return fail("Escolha uma categoria");

  const img = image(b.image);
  if (img === null) return fail("Foto inválida: use o botão de enviar ou um link que comece com https://");

  let promoPrice: number | null = null;
  const rawPromo = b.promoPrice;
  if (rawPromo !== null && rawPromo !== undefined && String(rawPromo).trim() !== "") {
    promoPrice = money(rawPromo);
    if (promoPrice === null) return fail("Preço promocional inválido");
    if (promoPrice >= price) return fail("O preço promocional precisa ser menor que o preço normal");
  }

  const promoUntil = str(b.promoUntil, 10);
  if (promoUntil !== "" && !validDate(promoUntil)) return fail("Data final da promoção inválida");

  const addonList = Array.isArray(b.addons) ? [...new Set(b.addons.map(String))] : [];
  if (addonList.some((id) => !ctx.addonIds.has(id))) return fail("Adicional inexistente");

  return {
    ok: true,
    value: {
      categoryId,
      name,
      price,
      description: str(b.description, 400),
      image: img,
      badge: str(b.badge, 24),
      addons: addonList,
      promoPrice,
      promoUntil: promoPrice === null ? "" : promoUntil,
      order: order(b.order),
      active: b.active !== false,
    },
  };
}

export function parseCategory(raw: unknown): Parsed<Omit<Category, "id">> {
  const b = asBody(raw);
  const name = str(b.name, 40);
  if (name.length < 1) return fail("Informe o nome da categoria");
  const icon = ICON_NAMES.includes(b.icon as IconName) ? (b.icon as IconName) : "Flame";
  return {
    ok: true,
    value: {
      name,
      icon,
      description: str(b.description, 200),
      order: order(b.order),
      active: b.active !== false,
    },
  };
}

export function parseAddon(raw: unknown): Parsed<Omit<Addon, "id">> {
  const b = asBody(raw);
  const name = str(b.name, 60);
  if (name.length < 1) return fail("Informe o nome do adicional");
  const price = money(b.price);
  if (price === null) return fail("Valor inválido");
  return { ok: true, value: { name, price, active: b.active !== false } };
}

export function parseSettings(raw: unknown): Parsed<Settings> {
  const b = asBody(raw);
  const name = str(b.name, 40);
  if (name.length < 1) return fail("Informe o nome da loja");

  let digits = str(b.whatsappNumber, 30).replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length >= 10 && digits.length <= 11) digits = "55" + digits;
  if (digits.length < 12 || digits.length > 15) {
    return fail("WhatsApp inválido: informe DDD + número, ex.: (86) 99999-9999");
  }

  const img = image(b.heroImage);
  if (img === null) return fail("Foto de capa inválida");

  let display = str(b.whatsappDisplay, 30);
  if (display === "") {
    const local = digits.startsWith("55") ? digits.slice(2) : digits;
    display = `(${local.slice(0, 2)}) ${local.slice(2, local.length - 4)}-${local.slice(-4)}`;
  }

  return {
    ok: true,
    value: {
      name,
      tagline: str(b.tagline, 60),
      heroTitle: str(b.heroTitle, 80),
      heroAccent: str(b.heroAccent, 80),
      heroSubtitle: str(b.heroSubtitle, 240),
      heroImage: img,
      whatsappNumber: digits,
      whatsappDisplay: display,
    },
  };
}
