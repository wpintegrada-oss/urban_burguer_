import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { Addon, Menu } from "@shared/types";
import { brl } from "@shared/pricing";
import { Modal } from "@/components/Modal";
import { Field, Pill, Toggle, inputCls, moneyToInput } from "./kit";
import { useAdminActions } from "./useAdmin";

export function AddonsTab({ pin, menu }: { pin: string; menu: Menu }) {
  const actions = useAdminActions(pin);
  const [editing, setEditing] = useState<Addon | "new" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Adicionais são extras que o cliente escolhe (bacon, queijo, molhos…). Depois de criar, marque em
          quais produtos ele aparece, na edição do produto.
        </p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          data-testid="admin-addon-new"
          className="glow inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-soft"
        >
          <Plus size={16} /> Novo adicional
        </button>
      </div>

      <ul className="space-y-2">
        {menu.addons.map((a) => {
          const uses = menu.products.filter((p) => p.addons.includes(a.id)).length;
          return (
            <li
              key={a.id}
              data-testid={`admin-addon-${a.id}`}
              className={`flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 ${a.active ? "" : "opacity-60"}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.name}</p>
                <p className="text-xs text-muted">
                  {brl(a.price)} · usado em {uses} produto(s) {!a.active && <Pill tone="gray">Desativado</Pill>}
                </p>
              </div>
              <Toggle
                checked={a.active}
                label={`${a.active ? "Desativar" : "Ativar"} adicional ${a.name}`}
                testId={`admin-addon-toggle-${a.id}`}
                disabled={actions.toggle.isPending}
                onChange={(active) => actions.toggle.mutate({ resource: "addons", id: a.id, active })}
              />
              <button
                type="button"
                onClick={() => setEditing(a)}
                data-testid={`admin-addon-edit-${a.id}`}
                className="rounded-full border border-line bg-chip px-3 py-1 text-xs font-semibold hover:bg-panel-hover"
              >
                Editar
              </button>
            </li>
          );
        })}
      </ul>

      {menu.addons.length === 0 && <p className="py-8 text-center text-muted">Nenhum adicional cadastrado.</p>}

      {editing && (
        <AddonForm
          key={editing === "new" ? "new" : editing.id}
          pin={pin}
          addon={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function AddonForm({ pin, addon, onClose }: { pin: string; addon: Addon | null; onClose: () => void }) {
  const actions = useAdminActions(pin);
  const [name, setName] = useState(addon?.name ?? "");
  const [price, setPrice] = useState(moneyToInput(addon?.price));
  const [active, setActive] = useState(addon?.active ?? true);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    actions.save.mutate(
      { resource: "addons", id: addon?.id, data: { name, price, active } },
      { onSuccess: onClose },
    );
  };

  const onDelete = () => {
    if (!addon) return;
    if (!window.confirm(`Excluir o adicional “${addon.name}”? Ele sai de todos os produtos.`)) return;
    actions.remove.mutate({ resource: "addons", id: addon.id }, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={addon ? "Editar adicional" : "Novo adicional"}
      testId="addon-form-modal"
      footer={
        <div className="flex items-center gap-3">
          {addon && (
            <button type="button" onClick={onDelete} disabled={actions.remove.isPending} data-testid="addon-delete"
              className="rounded-full border border-red-500/50 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10">
              Excluir
            </button>
          )}
          <button type="submit" form="addon-form" disabled={actions.save.isPending} data-testid="addon-save"
            className="glow flex-1 rounded-full bg-brand px-5 py-3 font-bold text-white hover:bg-brand-soft disabled:opacity-60">
            {actions.save.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      }
    >
      <form id="addon-form" onSubmit={onSubmit} className="space-y-4 p-5">
        <Field label="Nome" id="af-name">
          <input id="af-name" required maxLength={60} value={name} data-testid="addon-name"
            onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Preço (R$)" id="af-price">
          <input id="af-price" required inputMode="decimal" placeholder="Ex.: 4,50" value={price} data-testid="addon-price"
            onChange={(e) => setPrice(e.target.value)} className={inputCls} />
        </Field>
        <div className="flex items-center justify-between rounded-xl border border-line bg-chip px-4 py-3">
          <p className="text-sm font-semibold">Disponível</p>
          <Toggle checked={active} onChange={setActive} label="Disponível" testId="addon-active" />
        </div>
      </form>
    </Modal>
  );
}
