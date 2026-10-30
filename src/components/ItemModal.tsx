import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem } from "@shared/types";
import { brl, effectivePrice, isPromoActive, round2, unitPriceOf } from "@shared/pricing";
import { useCart } from "@/lib/cart";
import { useMenu } from "@/lib/menu";
import { Modal } from "./Modal";
import { FoodImage, Price } from "./Visuals";

export function ItemModal({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  // `key` no pai reinicia o estado a cada item aberto.
  return item ? <ItemModalBody key={item.id} item={item} onClose={onClose} /> : null;
}

function ItemModalBody({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const cart = useCart();
  const { index } = useMenu();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [obs, setObs] = useState("");

  const addonIds = item.addons.filter((id) => index.addonById[id]);
  const unit = unitPriceOf(index, item.id, selected) ?? effectivePrice(item);
  const total = round2(unit * qty);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const add = () => {
    cart.add({ itemId: item.id, qty, addonIds: selected, obs: obs.trim() });
    toast.success(`${qty}x ${item.name} no carrinho`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item.name}
      testId="item-modal"
      footer={
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-line bg-chip">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              data-testid="item-qty-minus"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="p-3 disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <span data-testid="item-qty" className="w-8 text-center font-bold tabular-nums">{qty}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              data-testid="item-qty-plus"
              disabled={qty >= 20}
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              className="p-3 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            type="button"
            data-testid="add-to-cart-button"
            onClick={add}
            className="glow flex-1 rounded-full bg-brand px-5 py-3 font-bold text-white transition hover:bg-brand-soft active:scale-[0.98]"
          >
            Adicionar · {brl(total)}
          </button>
        </div>
      }
    >
      <FoodImage src={item.image} alt={item.name} className="aspect-[16/10] w-full" />
      <div className="space-y-5 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <Price item={item} className="font-heading text-2xl font-bold text-brand" />
            <div className="flex flex-wrap justify-end gap-1.5">
              {isPromoActive(item) && (
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">Promoção</span>
              )}
              {item.badge && (
                <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">{item.badge}</span>
              )}
            </div>
          </div>
          {item.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
          )}
          {isPromoActive(item) && item.promoUntil && (
            <p className="mt-2 text-xs text-emerald-300">
              Promoção válida até {item.promoUntil.split("-").reverse().join("/")}
            </p>
          )}
        </div>

        {addonIds.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-sm font-bold">Adicionais</legend>
            <div className="space-y-2">
              {addonIds.map((id) => {
                const addon = index.addonById[id];
                const checked = selected.includes(id);
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                      checked ? "border-brand bg-brand/10" : "border-line bg-chip hover:bg-panel-hover"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(id)}
                      data-testid={`addon-${id}`}
                      className="size-4 accent-brand"
                    />
                    <span className="flex-1 text-sm">{addon.name}</span>
                    <span className="text-sm font-semibold text-muted">+ {brl(addon.price)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div>
          <label htmlFor="item-obs" className="mb-2 block text-sm font-bold">Observações</label>
          <textarea
            id="item-obs"
            data-testid="item-obs-input"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Ex.: sem cebola, ponto da carne…"
            className="w-full resize-none rounded-xl border border-line bg-chip px-4 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-brand"
          />
        </div>
      </div>
    </Modal>
  );
}
