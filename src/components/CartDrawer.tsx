import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { PAYMENT_METHODS } from "@shared/menu";
import { brl, effectivePrice, unitPriceOf } from "@shared/pricing";
import { buildOrderMessage, whatsappLink } from "@shared/whatsapp";
import type { CreateOrderInput, Order, PaymentMethod } from "@shared/types";
import { apiPost } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useMenu } from "@/lib/menu";
import { Modal } from "./Modal";
import { PAYMENT_ICONS } from "./icons";
import { FoodImage } from "./Visuals";

interface FormState {
  name: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  payment: PaymentMethod;
  changeFor: string;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  street: "",
  number: "",
  neighborhood: "",
  complement: "",
  payment: "pix",
  changeFor: "",
  notes: "",
};

const inputCls =
  "w-full rounded-xl border border-line bg-chip px-4 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-brand";

function PixBox({ pixKey, pixQr }: { pixKey: string; pixQr: string }) {
  if (!pixKey && !pixQr) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      toast.success("Chave PIX copiada!");
    } catch {
      toast.error("Não consegui copiar. Selecione a chave e copie.");
    }
  };
  return (
    <div data-testid="pix-box" className="space-y-3 rounded-xl border border-line bg-panel p-4 text-center">
      <p className="text-sm font-semibold">Pague com PIX</p>
      {pixQr && <img src={pixQr} alt="QR code PIX" className="mx-auto size-44 rounded-lg bg-white p-2" />}
      {pixKey && (
        <>
          <p data-testid="pix-key" className="break-all font-mono text-sm">{pixKey}</p>
          <button type="button" onClick={copy}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:bg-panel-hover">
            Copiar chave
          </button>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export function CartDrawer() {
  const cart = useCart();
  const qc = useQueryClient();
  const { index, settings } = useMenu();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [placed, setPlaced] = useState<Order | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = useMutation({
    mutationFn: (input: CreateOrderInput) => apiPost<Order>("/orders", input),
    onSuccess: (order) => {
      setPlaced(order);
      cart.clear();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      // Se um item saiu do ar enquanto o cliente montava o pedido, atualiza o cardápio.
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
  });

  const close = () => {
    cart.setOpen(false);
    if (placed) {
      // Pedido concluído: ao fechar, limpa o formulário para o próximo pedido.
      setPlaced(null);
      setForm((f) => ({ ...EMPTY, name: f.name, phone: f.phone }));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (cart.lines.length === 0) return;
    submit.mutate({
      customer: { name: form.name, phone: form.phone },
      address: {
        street: form.street,
        number: form.number,
        neighborhood: form.neighborhood,
        complement: form.complement,
      },
      payment: { method: form.payment, changeFor: form.changeFor },
      notes: form.notes,
      items: cart.lines.map((l) => ({
        itemId: l.itemId,
        qty: l.qty,
        addonIds: l.addonIds,
        obs: l.obs,
      })),
    });
  };

  // ── Tela de sucesso ──────────────────────────────────────────────────────
  if (placed) {
    const waUrl = whatsappLink(settings.whatsappNumber, buildOrderMessage(placed));
    return (
      <Modal open={cart.open} onClose={close} title="Pedido enviado!" testId="order-success">
        <div className="space-y-5 p-6 text-center">
          <CheckCircle className="mx-auto text-emerald-400" size={56} />
          <div>
            <p className="text-sm text-muted">Código do seu pedido</p>
            <p data-testid="order-code" className="font-mono text-3xl font-bold text-brand">
              #{placed.id}
            </p>
            <p className="mt-1 font-semibold">{brl(placed.total)}</p>
          </div>
          <p className="text-sm text-muted">
            Seu pedido foi registrado. Toque no botão abaixo para enviá-lo à loja pelo WhatsApp e
            agilizar a confirmação.
          </p>
          {placed.payment.method === "pix" && <PixBox pixKey={settings.pixKey} pixQr={settings.pixQr} />}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="send-whatsapp-button"
            className="glow flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 font-bold text-white transition hover:bg-emerald-400"
          >
            <MessageCircle size={20} /> Enviar pelo WhatsApp
          </a>
          <Link
            to={`/pedido/${placed.id}`}
            onClick={close}
            data-testid="track-order-link"
            className="block rounded-full border border-line px-5 py-3 font-semibold transition hover:bg-panel-hover"
          >
            Acompanhar pedido
          </Link>
        </div>
      </Modal>
    );
  }

  // ── Carrinho + checkout ──────────────────────────────────────────────────
  const empty = cart.lines.length === 0;

  return (
    <Modal
      open={cart.open}
      onClose={close}
      title="Seu pedido"
      testId="cart-drawer"
      footer={
        empty ? undefined : (
          <button
            type="submit"
            form="checkout-form"
            disabled={submit.isPending}
            data-testid="checkout-submit-button"
            className="glow w-full rounded-full bg-brand px-5 py-3.5 font-bold text-white transition hover:bg-brand-soft disabled:opacity-60"
          >
            {submit.isPending ? "Enviando…" : `Finalizar pedido · ${brl(cart.total)}`}
          </button>
        )
      }
    >
      {empty ? (
        <p data-testid="cart-empty" className="p-10 text-center text-muted">
          Seu carrinho está vazio. Escolha um burger no cardápio 🍔
        </p>
      ) : (
        <form id="checkout-form" onSubmit={onSubmit} className="space-y-6 p-5">
          <ul className="space-y-3" data-testid="cart-lines">
            {cart.lines.map((l) => {
              const item = index.itemById[l.itemId];
              if (!item) return null;
              const unit = unitPriceOf(index, l.itemId, l.addonIds) ?? effectivePrice(item);
              return (
                <li key={l.key} className="rounded-2xl border border-line bg-chip p-3" data-testid={`cart-line-${l.itemId}`}>
                  <div className="flex items-start gap-3">
                    <FoodImage src={item.image} alt="" className="size-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.name}</p>
                      {l.addonIds.map((id) => (
                        <p key={id} className="text-xs text-muted">+ {index.addonById[id]?.name ?? id}</p>
                      ))}
                      {l.obs && <p className="text-xs italic text-muted">Obs: {l.obs}</p>}
                    </div>
                    <p className="shrink-0 font-semibold">{brl(unit * l.qty)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-line">
                      <button
                        type="button"
                        aria-label={`Diminuir ${item.name}`}
                        data-testid={`cart-minus-${l.itemId}`}
                        onClick={() => cart.setQty(l.key, l.qty - 1)}
                        className="p-2"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                      <button
                        type="button"
                        aria-label={`Aumentar ${item.name}`}
                        data-testid={`cart-plus-${l.itemId}`}
                        onClick={() => cart.setQty(l.key, l.qty + 1)}
                        className="p-2"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remover ${item.name}`}
                      data-testid={`cart-remove-${l.itemId}`}
                      onClick={() => cart.remove(l.key)}
                      className="rounded-full p-2 text-muted transition hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <section className="space-y-3">
            <h3 className="font-bold">Seus dados</h3>
            <Field label="Nome" id="co-name">
              <input id="co-name" data-testid="checkout-name-input" required minLength={2} maxLength={80}
                autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Telefone / WhatsApp" id="co-phone">
              <input id="co-phone" data-testid="checkout-phone-input" required type="tel" inputMode="tel"
                autoComplete="tel" placeholder="(86) 99999-9999" value={form.phone}
                onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold">Endereço de entrega</h3>
            <Field label="Rua" id="co-street">
              <input id="co-street" data-testid="checkout-street-input" required maxLength={120}
                autoComplete="address-line1" value={form.street} onChange={(e) => set("street", e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Field label="Número" id="co-number">
                  <input id="co-number" data-testid="checkout-number-input" required maxLength={20}
                    value={form.number} onChange={(e) => set("number", e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Bairro" id="co-neighborhood">
                  <input id="co-neighborhood" data-testid="checkout-neighborhood-input" required maxLength={80}
                    value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>
            <Field label="Complemento / Referência (opcional)" id="co-complement">
              <input id="co-complement" data-testid="checkout-complement-input" maxLength={120}
                value={form.complement} onChange={(e) => set("complement", e.target.value)} className={inputCls} />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold">Forma de pagamento</h3>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((p) => {
                const Icon = PAYMENT_ICONS[p.icon];
                const active = form.payment === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    data-testid={`payment-${p.id}`}
                    onClick={() => set("payment", p.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      active ? "border-brand bg-brand/10" : "border-line bg-chip hover:bg-panel-hover"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-brand" : "text-muted"} />
                    <p className="mt-1 text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted">{p.desc}</p>
                  </button>
                );
              })}
            </div>
            {form.payment === "pix" && <PixBox pixKey={settings.pixKey} pixQr={settings.pixQr} />}
            {form.payment === "dinheiro" && (
              <Field label="Troco para quanto? (deixe vazio se não precisa)" id="co-change">
                <input id="co-change" data-testid="checkout-change-input" maxLength={40} placeholder="Ex.: R$ 50"
                  value={form.changeFor} onChange={(e) => set("changeFor", e.target.value)} className={inputCls} />
              </Field>
            )}
          </section>

          <Field label="Observações gerais (opcional)" id="co-notes">
            <textarea id="co-notes" data-testid="checkout-notes-input" rows={2} maxLength={300}
              value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${inputCls} resize-none`} />
          </Field>
        </form>
      )}
    </Modal>
  );
}
