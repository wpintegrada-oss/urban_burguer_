import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PAYMENT_LABEL, STATUS_STEPS } from "@shared/menu";
import { brl } from "@shared/pricing";
import { whatsappLink } from "@shared/whatsapp";
import type { PublicOrder } from "@shared/types";
import { ApiError, apiGet } from "@/lib/api";
import { useMenu } from "@/lib/menu";
import { STATUS_ICONS, StatusBadge } from "@/components/StatusBadge";

const FLOW = STATUS_STEPS.filter((s) => s.id !== "cancelado");

export default function OrderTracking() {
  const { id = "" } = useParams();
  const code = id.toUpperCase();
  const { settings } = useMenu();

  const { data, error, isPending } = useQuery({
    queryKey: ["order", code],
    queryFn: () => apiGet<PublicOrder>(`/orders/${code}`),
    refetchInterval: (q) =>
      q.state.data && ["entregue", "cancelado"].includes(q.state.data.status) ? false : 5000,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  });

  const notFound = error instanceof ApiError && error.status === 404;
  const waUrl = whatsappLink(settings.whatsappNumber, `Olá! Quero falar sobre o meu pedido #${code}.`);

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-6">
      <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> Voltar ao cardápio
      </Link>

      <div className="rounded-3xl border border-line bg-panel p-5" data-testid="order-tracking-card">
        <p className="text-xs uppercase tracking-wider text-muted">Pedido</p>
        <h1 className="font-mono text-3xl font-bold text-brand">#{code}</h1>

        {isPending && <p className="mt-6 text-muted">Carregando…</p>}

        {notFound && (
          <p data-testid="order-not-found" className="mt-6 text-muted">
            Não encontramos esse pedido. Confira o código e tente novamente.
          </p>
        )}

        {error && !notFound && (
          <p className="mt-6 text-red-400">{error.message}</p>
        )}

        {data && (
          <div className="mt-5 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Olá, {data.firstName}!</p>
              <StatusBadge status={data.status} />
            </div>

            {data.status === "cancelado" ? (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                Este pedido foi cancelado. Fale com a loja pelo WhatsApp se tiver dúvidas.
              </p>
            ) : (
              <ol className="space-y-1" data-testid="order-steps">
                {FLOW.map((step, i) => {
                  const current = FLOW.findIndex((s) => s.id === data.status);
                  const done = i <= current;
                  const Icon = STATUS_ICONS[step.id];
                  return (
                    <li key={step.id} className="flex items-center gap-3">
                      <span
                        className={`grid size-9 place-items-center rounded-full border ${
                          done ? "border-brand bg-brand text-white" : "border-line bg-chip text-muted"
                        } ${i === current ? "glow" : ""}`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className={done ? "font-semibold" : "text-muted"}>{step.label}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="border-t border-line pt-4">
              <h2 className="mb-2 text-sm font-bold">Resumo</h2>
              <ul className="space-y-2 text-sm">
                {data.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>
                      {it.qty}x {it.name}
                      {it.addons.length > 0 && (
                        <span className="block text-xs text-muted">+ {it.addons.map((a) => a.name).join(", ")}</span>
                      )}
                    </span>
                    <span className="shrink-0">{brl(it.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between border-t border-line pt-3 font-bold">
                <span>Total · {PAYMENT_LABEL[data.paymentMethod]}</span>
                <span className="text-brand">{brl(data.total)}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="tracking-whatsapp-button"
        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 font-bold transition hover:bg-emerald-400"
      >
        <MessageCircle size={20} /> Falar com a {settings.name}
      </a>
    </div>
  );
}
