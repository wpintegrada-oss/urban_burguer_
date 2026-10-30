import { useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import type { Menu, MenuItem } from "@shared/types";
import { brl, isPromoActive } from "@shared/pricing";
import { Modal } from "@/components/Modal";
import { FoodImage, Price } from "@/components/Visuals";
import { Field, Pill, Toggle, inputCls, moneyToInput } from "./kit";
import { ImageField } from "./ImageField";
import { useAdminActions } from "./useAdmin";

export function ProductsTab({ pin, menu }: { pin: string; menu: Menu }) {
  const actions = useAdminActions(pin);
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches = (p: MenuItem) => !q || p.name.toLowerCase().includes(q);
  const known = new Set(menu.categories.map((c) => c.id));
  const orphans = menu.products.filter((p) => !known.has(p.categoryId) && matches(p));

  const row = (p: MenuItem) => {
    const promoNow = isPromoActive(p);
    const promoSet = p.promoPrice !== null;
    return (
      <li
        key={p.id}
        data-testid={`admin-product-${p.id}`}
        className={`flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 ${
          p.active ? "" : "opacity-60"
        }`}
      >
        <FoodImage src={p.image} alt="" className="size-14 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.name}</p>
          <Price item={p} className="text-sm font-bold text-brand" />
          <div className="mt-1 flex flex-wrap gap-1">
            {!p.active && <Pill tone="gray">Fora do cardápio</Pill>}
            {promoNow && <Pill tone="green">Promoção</Pill>}
            {promoSet && !promoNow && <Pill tone="red">Promoção encerrada</Pill>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Toggle
            checked={p.active}
            label={`${p.active ? "Tirar do cardápio" : "Colocar no cardápio"}: ${p.name}`}
            testId={`admin-product-toggle-${p.id}`}
            disabled={actions.toggle.isPending}
            onChange={(active) => actions.toggle.mutate({ resource: "products", id: p.id, active })}
          />
          <button
            type="button"
            onClick={() => setEditing(p)}
            data-testid={`admin-product-edit-${p.id}`}
            className="rounded-full border border-line bg-chip px-3 py-1 text-xs font-semibold hover:bg-panel-hover"
          >
            Editar
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produto…"
            aria-label="Buscar produto"
            data-testid="admin-product-search"
            className={`${inputCls} pl-10`}
          />
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          data-testid="admin-product-new"
          className="glow inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-soft"
        >
          <Plus size={16} /> Novo produto
        </button>
      </div>

      <p className="text-xs text-muted">
        Use o interruptor para tirar um produto do cardápio (ele some do site na hora) e colocar de volta
        quando voltar a ter.
      </p>

      {menu.categories.map((c) => {
        const items = menu.products.filter((p) => p.categoryId === c.id && matches(p));
        if (items.length === 0) return null;
        return (
          <section key={c.id} className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-300">
              {c.name} {!c.active && <Pill tone="gray">Categoria desativada</Pill>}
            </h2>
            <ul className="space-y-2">{items.map(row)}</ul>
          </section>
        );
      })}

      {orphans.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-zinc-300">Sem categoria</h2>
          <ul className="space-y-2">{orphans.map(row)}</ul>
        </section>
      )}

      {menu.products.length === 0 && (
        <p className="py-8 text-center text-muted">Nenhum produto ainda. Clique em “Novo produto”.</p>
      )}

      {editing && (
        <ProductForm
          key={editing === "new" ? "new" : editing.id}
          pin={pin}
          menu={menu}
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

interface FormState {
  name: string;
  description: string;
  price: string;
  promoPrice: string;
  promoUntil: string;
  badge: string;
  categoryId: string;
  order: string;
  image: string;
  addons: string[];
  active: boolean;
}

function ProductForm({
  pin,
  menu,
  product,
  onClose,
}: {
  pin: string;
  menu: Menu;
  product: MenuItem | null;
  onClose: () => void;
}) {
  const actions = useAdminActions(pin);
  const [f, setF] = useState<FormState>(() =>
    product
      ? {
          name: product.name,
          description: product.description,
          price: moneyToInput(product.price),
          promoPrice: moneyToInput(product.promoPrice),
          promoUntil: product.promoUntil,
          badge: product.badge,
          categoryId: product.categoryId,
          order: String(product.order),
          image: product.image,
          addons: product.addons,
          active: product.active,
        }
      : {
          name: "",
          description: "",
          price: "",
          promoPrice: "",
          promoUntil: "",
          badge: "",
          categoryId: menu.categories[0]?.id ?? "",
          order: String(Math.max(0, ...menu.products.map((p) => p.order)) + 10),
          image: "",
          addons: [],
          active: true,
        },
  );
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setF((s) => ({ ...s, [key]: value }));

  const toggleAddon = (id: string) =>
    set("addons", f.addons.includes(id) ? f.addons.filter((x) => x !== id) : [...f.addons, id]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    actions.save.mutate(
      {
        resource: "products",
        id: product?.id,
        data: {
          name: f.name,
          description: f.description,
          price: f.price,
          promoPrice: f.promoPrice,
          promoUntil: f.promoUntil,
          badge: f.badge,
          categoryId: f.categoryId,
          order: Number(f.order) || 0,
          image: f.image,
          addons: f.addons,
          active: f.active,
        },
      },
      { onSuccess: onClose },
    );
  };

  const onDelete = () => {
    if (!product) return;
    if (!window.confirm(`Excluir “${product.name}”? Isso não pode ser desfeito.\n\nDica: para só tirar do cardápio por um tempo, use o interruptor.`)) return;
    actions.remove.mutate({ resource: "products", id: product.id }, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? "Editar produto" : "Novo produto"}
      testId="product-form-modal"
      footer={
        <div className="flex items-center gap-3">
          {product && (
            <button
              type="button"
              onClick={onDelete}
              disabled={actions.remove.isPending}
              data-testid="product-delete"
              className="rounded-full border border-red-500/50 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10"
            >
              Excluir
            </button>
          )}
          <button
            type="submit"
            form="product-form"
            disabled={actions.save.isPending}
            data-testid="product-save"
            className="glow flex-1 rounded-full bg-brand px-5 py-3 font-bold text-white hover:bg-brand-soft disabled:opacity-60"
          >
            {actions.save.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      }
    >
      <form id="product-form" onSubmit={onSubmit} className="space-y-5 p-5">
        <ImageField value={f.image} onChange={(v) => set("image", v)} pin={pin} testId="product-image" />

        <Field label="Nome" id="pf-name">
          <input id="pf-name" required maxLength={80} value={f.name} data-testid="product-name"
            onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Descrição" id="pf-desc">
          <textarea id="pf-desc" rows={3} maxLength={400} value={f.description} data-testid="product-description"
            onChange={(e) => set("description", e.target.value)} className={`${inputCls} resize-none`} />
        </Field>

        <Field label="Categoria" id="pf-cat">
          <select id="pf-cat" required value={f.categoryId} data-testid="product-category"
            onChange={(e) => set("categoryId", e.target.value)} className={inputCls}>
            {menu.categories.length === 0 && <option value="">Crie uma categoria primeiro</option>}
            {menu.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.active ? "" : " (desativada)"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Preço (R$)" id="pf-price">
          <input id="pf-price" required inputMode="decimal" placeholder="Ex.: 29,90" value={f.price}
            data-testid="product-price" onChange={(e) => set("price", e.target.value)} className={inputCls} />
        </Field>

        <fieldset className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <legend className="px-2 text-sm font-bold text-emerald-300">Promoção (opcional)</legend>
          <Field
            label="Preço promocional (R$)"
            id="pf-promo"
            hint="Precisa ser menor que o preço normal. Deixe vazio se não há promoção."
          >
            <input id="pf-promo" inputMode="decimal" placeholder="Ex.: 24,90" value={f.promoPrice}
              data-testid="product-promo-price" onChange={(e) => set("promoPrice", e.target.value)} className={inputCls} />
          </Field>
          {f.promoPrice.trim() !== "" && (
            <Field
              label="Vale até (opcional)"
              id="pf-until"
              hint="Último dia da promoção. Depois dele o preço volta ao normal sozinho. Sem data, vale até você apagar o preço promocional."
            >
              <input id="pf-until" type="date" value={f.promoUntil} data-testid="product-promo-until"
                onChange={(e) => set("promoUntil", e.target.value)} className={inputCls} />
            </Field>
          )}
        </fieldset>

        <Field label="Selo (opcional)" id="pf-badge" hint="Texto curto em destaque, ex.: Mais pedido, Novo, Chef.">
          <input id="pf-badge" maxLength={24} value={f.badge} data-testid="product-badge"
            onChange={(e) => set("badge", e.target.value)} className={inputCls} />
        </Field>

        {menu.addons.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-muted">Adicionais que o cliente pode escolher</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {menu.addons.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-chip px-3 py-2 text-sm">
                  <input type="checkbox" checked={f.addons.includes(a.id)} onChange={() => toggleAddon(a.id)}
                    data-testid={`product-addon-${a.id}`} className="size-4 accent-brand" />
                  <span className="flex-1">{a.name}{a.active ? "" : " (desativado)"}</span>
                  <span className="text-xs text-muted">{brl(a.price)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Field label="Posição na lista" id="pf-order" hint="Número menor aparece primeiro dentro da categoria.">
          <input id="pf-order" type="number" inputMode="numeric" value={f.order} data-testid="product-order"
            onChange={(e) => set("order", e.target.value)} className={inputCls} />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-line bg-chip px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Aparece no cardápio</p>
            <p className="text-xs text-muted">Desligue quando o produto acabar.</p>
          </div>
          <Toggle checked={f.active} onChange={(v) => set("active", v)} label="Aparece no cardápio" testId="product-active" />
        </div>
      </form>
    </Modal>
  );
}
