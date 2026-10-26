import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, LogOut, MessageCircle, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { PAYMENT_LABEL, STATUS_STEPS } from "@shared/menu";
import { brl } from "@shared/pricing";
import type { Order, OrderStatus } from "@shared/types";
import { ApiError, apiGet, apiPatch } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

const PIN_KEY = "ub_admin_pin";
const EMPTY_ORDERS: Order[] = [];

function readPin(): string {
  try {
    return sessionStorage.getItem(PIN_KEY) ?? "";
  } catch {
    return "";
  }
}
function writePin(pin: string) {
  try {
    if (pin) sessionStorage.setItem(PIN_KEY, pin);
    else sessionStorage.removeItem(PIN_KEY);
  } catch {
    /* sem armazenamento: o PIN vale só enquanto a aba ficar aberta */
  }
}

let audioCtx: AudioContext | null = null;
function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
  } catch {
    audioCtx = null;
  }
}
function beep() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [880, 1175].forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx!.destination);
    gain.gain.setValueAtTime(0.2, now + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.16);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.17);
  });
}

export default function Admin() {
  const [pin, setPin] = useState(readPin);
  const logout = () => {
    writePin("");
    setPin("");
  };
  return pin ? (
    <Dashboard pin={pin} onLogout={logout} />
  ) : (
    <PinGate
      onUnlock={(p) => {
        writePin(p);
        setPin(p);
      }}
    />
  );
}

function PinGate({ onUnlock }: { onUnlock: (pin: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    unlockAudio(); // o clique libera o som do navegador
    setBusy(true);
    setError("");
    try {
      await apiGet<Order[]>("/orders?status=none", { "x-admin-pin": value });
      onUnlock(value);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "PIN incorreto." : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4 rounded-3xl border border-line bg-panel p-6 text-center">
        <Lock className="mx-auto text-brand" size={32} />
        <h1 className="text-xl font-bold">Painel de pedidos</h1>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="PIN"
          data-testid="admin-pin-input"
          aria-label="PIN"
          className="w-full rounded-xl border border-line bg-chip px-4 py-3 text-center tracking-widest outline-none focus:border-brand"
        />
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !value}
          data-testid="admin-pin-submit"
          className="w-full rounded-full bg-brand px-5 py-3 font-bold transition hover:bg-brand-soft disabled:opacity-50"
        >
          {busy ? "Verificando…" : "Entrar"}
        </button>
        <Link to="/" className="block text-sm text-muted hover:text-white">Voltar ao site</Link>
      </form>
    </div>
  );
}

function Dashboard({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [sound, setSound] = useState(true);
  const seen = useRef<Set<string> | null>(null);
  const headers = { "x-admin-pin": pin };

  const { data: fetched, error, isPending } = useQuery({
    queryKey: ["admin-orders", pin],
    queryFn: () => apiGet<Order[]>("/orders", headers),
    refetchInterval: 8000,
    retry: (count, err) => !(err instanceof ApiError && err.status === 401) && count < 2,
  });

  // PIN recusado (ex.: foi trocado na Vercel): volta para a tela do PIN.
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) onLogout();
  }, [error, onLogout]);

  const orders = fetched ?? EMPTY_ORDERS;

  // Toca um aviso quando chega pedido novo (a primeira carga só registra os existentes).
  useEffect(() => {
    if (!fetched) return;
    const ids = new Set(fetched.map((o) => o.id));
    if (seen.current === null) {
      seen.current = ids;
      return;
    }
    const fresh = fetched.filter((o) => !seen.current!.has(o.id));
    if (fresh.length > 0) {
      toast.info(`Novo pedido: ${fresh.map((o) => "#" + o.id).join(", ")}`);
      if (sound) beep();
    }
    seen.current = ids;
  }, [fetched, sound]);

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiPatch<Order>(`/orders/${id}`, { status }, headers),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const counted = orders.filter((o) => o.status !== "cancelado");
  const revenue = counted.reduce((s, o) => s + o.total, 0);
  const visible = filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setSound((s) => !s);
            }}
            aria-pressed={sound}
            aria-label={sound ? "Desligar som" : "Ligar som"}
            data-testid="admin-sound-toggle"
            className="rounded-full border border-line bg-panel p-2.5 hover:bg-panel-hover"
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            type="button"
            onClick={onLogout}
            data-testid="admin-logout"
            className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-4 py-2.5 text-sm hover:bg-panel-hover"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-panel p-4" data-testid="admin-stat-orders">
          <p className="text-xs text-muted">Pedidos (sem cancelados)</p>
          <p className="font-heading text-3xl font-bold">{counted.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4" data-testid="admin-stat-revenue">
          <p className="text-xs text-muted">Faturamento</p>
          <p className="font-heading text-3xl font-bold text-brand">{brl(revenue)}</p>
        </div>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {[{ id: "todos" as const, label: "Todos" }, ...STATUS_STEPS].map((s) => {
          const n = s.id === "todos" ? orders.length : orders.filter((o) => o.status === s.id).length;
          const on = filter === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setFilter(s.id)}
              data-testid={`admin-filter-${s.id}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                on ? "bg-brand text-white" : "bg-chip text-zinc-300 hover:bg-panel-hover"
              }`}
            >
              {s.label} · {n}
            </button>
          );
        })}
      </div>

      {isPending && <p className="text-muted">Carregando…</p>}
      {error && !(error instanceof ApiError && error.status === 401) && (
        <p className="mb-4 text-red-400">{error.message}</p>
      )}
      {!isPending && visible.length === 0 && (
        <p data-testid="admin-empty" className="py-10 text-center text-muted">Nenhum pedido por aqui.</p>
      )}

      <ul className="space-y-3">
        {visible.map((o) => (
          <li key={o.id} className="rounded-2xl border border-line bg-panel p-4" data-testid={`admin-order-${o.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-lg font-bold text-brand">#{o.id}</p>
                <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>

            <div className="mt-3 grid gap-4 text-sm md:grid-cols-2">
              <div className="space-y-0.5">
                <p className="font-semibold">{o.customer.name}</p>
                <a
                  href={`https://wa.me/${o.customer.phone.replace(/\D/g, "").replace(/^(?!55)/, "55")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  <MessageCircle size={14} /> {o.customer.phone}
                </a>
                <p className="text-muted">
                  {o.address.street}, {o.address.number} — {o.address.neighborhood}
                  {o.address.complement && ` (${o.address.complement})`}
                </p>
                <p className="text-muted">
                  {PAYMENT_LABEL[o.payment.method]}
                  {o.payment.changeFor && ` · troco para ${o.payment.changeFor}`}
                </p>
                {o.notes && <p className="italic text-muted">Obs: {o.notes}</p>}
              </div>
              <ul className="space-y-1">
                {o.items.map((it, i) => (
                  <li key={i}>
                    <span className="font-semibold">{it.qty}x {it.name}</span>
                    {it.addons.map((a) => (
                      <span key={a.id} className="block text-xs text-muted">+ {a.name}</span>
                    ))}
                    {it.obs && <span className="block text-xs italic text-muted">Obs: {it.obs}</span>}
                  </li>
                ))}
                <li className="border-t border-line pt-1 text-right font-bold">{brl(o.total)}</li>
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_STEPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={o.status === s.id || update.isPending}
                  onClick={() => update.mutate({ id: o.id, status: s.id })}
                  data-testid={`admin-set-${o.id}-${s.id}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
                    o.status === s.id ? s.badge : "border border-line bg-chip hover:bg-panel-hover"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
