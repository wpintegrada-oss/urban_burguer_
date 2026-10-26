import { Ban, Check, Clock, Flame, Truck, type LucideIcon } from "lucide-react";
import { STATUS_STEPS } from "@shared/menu";
import type { OrderStatus } from "@shared/types";

export const STATUS_ICONS: Record<OrderStatus, LucideIcon> = {
  recebido: Clock,
  preparando: Flame,
  saiu_entrega: Truck,
  entregue: Check,
  cancelado: Ban,
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const step = STATUS_STEPS.find((s) => s.id === status);
  const Icon = STATUS_ICONS[status];
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${step?.badge ?? ""}`}
    >
      <Icon size={13} /> {step?.label ?? status}
    </span>
  );
}
