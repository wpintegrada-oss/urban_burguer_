import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { ICON_NAMES, type Category, type IconName, type Menu } from "@shared/types";
import { Modal } from "@/components/Modal";
import { CATEGORY_ICONS } from "@/components/icons";
import { Field, Pill, Toggle, inputCls } from "./kit";
import { useAdminActions } from "./useAdmin";

const ICON_LABEL: Record<IconName, string> = {
  Flame: "Chama",
  Award: "Medalha",
  UtensilsCrossed: "Talheres",
  Sparkles: "Brilho",
  Layers: "Camadas",
  Boxes: "Caixas",
  Zap: "Raio",
  GlassWater: "Copo",
};

export function CategoriesTab({ pin, menu }: { pin: string; menu: Menu }) {
  const actions = useAdminActions(pin);
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Desativar uma categoria tira ela e todos os produtos dela do cardápio.
        </p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          data-testid="admin-category-new"
          className="glow inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-soft"
        >
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      <ul className="space-y-2">
        {menu.categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon] ?? CATEGORY_ICONS.Flame;
          const count = menu.products.filter((p) => p.categoryId === c.id).length;
          return (
            <li
              key={c.id}
              data-testid={`admin-category-${c.id}`}
              className={`flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 ${c.active ? "" : "opacity-60"}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-chip text-brand">
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="text-xs text-muted">
                  {count} produto(s) {!c.active && <Pill tone="gray">Fora do cardápio</Pill>}
                </p>
              </div>
              <Toggle
                checked={c.active}
                label={`${c.active ? "Desativar" : "Ativar"} categoria ${c.name}`}
                testId={`admin-category-toggle-${c.id}`}
                disabled={actions.toggle.isPending}
                onChange={(active) => actions.toggle.mutate({ resource: "categories", id: c.id, active })}
              />
              <button
                type="button"
                onClick={() => setEditing(c)}
                data-testid={`admin-category-edit-${c.id}`}
                className="rounded-full border border-line bg-chip px-3 py-1 text-xs font-semibold hover:bg-panel-hover"
              >
                Editar
              </button>
            </li>
          );
        })}
      </ul>

      {menu.categories.length === 0 && (
        <p className="py-8 text-center text-muted">Nenhuma categoria. Crie a primeira para poder cadastrar produtos.</p>
      )}

      {editing && (
        <CategoryForm
          key={editing === "new" ? "new" : editing.id}
          pin={pin}
          menu={menu}
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function CategoryForm({
  pin,
  menu,
  category,
  onClose,
}: {
  pin: string;
  menu: Menu;
  category: Category | null;
  onClose: () => void;
}) {
  const actions = useAdminActions(pin);
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [icon, setIcon] = useState<IconName>(category?.icon ?? "Flame");
  const [order, setOrder] = useState(
    String(category?.order ?? Math.max(0, ...menu.categories.map((c) => c.order)) + 10),
  );
  const [active, setActive] = useState(category?.active ?? true);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    actions.save.mutate(
      {
        resource: "categories",
        id: category?.id,
        data: { name, description, icon, order: Number(order) || 0, active },
      },
      { onSuccess: onClose },
    );
  };

  const onDelete = () => {
    if (!category) return;
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    actions.remove.mutate({ resource: "categories", id: category.id }, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? "Editar categoria" : "Nova categoria"}
      testId="category-form-modal"
      footer={
        <div className="flex items-center gap-3">
          {category && (
            <button type="button" onClick={onDelete} disabled={actions.remove.isPending} data-testid="category-delete"
              className="rounded-full border border-red-500/50 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10">
              Excluir
            </button>
          )}
          <button type="submit" form="category-form" disabled={actions.save.isPending} data-testid="category-save"
            className="glow flex-1 rounded-full bg-brand px-5 py-3 font-bold text-white hover:bg-brand-soft disabled:opacity-60">
            {actions.save.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      }
    >
      <form id="category-form" onSubmit={onSubmit} className="space-y-4 p-5">
        <Field label="Nome" id="cf-name">
          <input id="cf-name" required maxLength={40} value={name} data-testid="category-name"
            onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Descrição (opcional)" id="cf-desc">
          <textarea id="cf-desc" rows={2} maxLength={200} value={description} data-testid="category-description"
            onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Ícone" id="cf-icon">
          <select id="cf-icon" value={icon} data-testid="category-icon"
            onChange={(e) => setIcon(e.target.value as IconName)} className={inputCls}>
            {ICON_NAMES.map((n) => (
              <option key={n} value={n}>{ICON_LABEL[n]}</option>
            ))}
          </select>
        </Field>
        <Field label="Posição" id="cf-order" hint="Número menor aparece primeiro no cardápio.">
          <input id="cf-order" type="number" inputMode="numeric" value={order} data-testid="category-order"
            onChange={(e) => setOrder(e.target.value)} className={inputCls} />
        </Field>
        <div className="flex items-center justify-between rounded-xl border border-line bg-chip px-4 py-3">
          <p className="text-sm font-semibold">Aparece no cardápio</p>
          <Toggle checked={active} onChange={setActive} label="Aparece no cardápio" testId="category-active" />
        </div>
      </form>
    </Modal>
  );
}
