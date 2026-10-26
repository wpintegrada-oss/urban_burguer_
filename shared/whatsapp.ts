import { PAYMENT_LABEL, STORE } from "./menu";
import { brl } from "./pricing";
import type { Order } from "./types";

export function whatsappLink(message: string): string {
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function buildOrderMessage(order: Order, siteOrigin: string): string {
  const lines: string[] = [];
  lines.push(`*Novo pedido #${order.id}* 🍔`);
  lines.push("");
  lines.push(`*Cliente:* ${order.customer.name}`);
  lines.push(`*Telefone:* ${order.customer.phone}`);
  const a = order.address;
  lines.push(
    `*Endereço:* ${a.street}, ${a.number} — ${a.neighborhood}${a.complement ? ` (${a.complement})` : ""}`,
  );
  lines.push("");
  lines.push("*Itens:*");
  for (const it of order.items) {
    lines.push(`${it.qty}x ${it.name} — ${brl(it.lineTotal)}`);
    for (const ad of it.addons) lines.push(`   + ${ad.name}`);
    if (it.obs) lines.push(`   Obs: ${it.obs}`);
  }
  lines.push("");
  lines.push(`*Total:* ${brl(order.total)}`);
  let pay = `*Pagamento:* ${PAYMENT_LABEL[order.payment.method]}`;
  if (order.payment.method === "dinheiro" && order.payment.changeFor) {
    pay += ` (troco para ${order.payment.changeFor})`;
  }
  lines.push(pay);
  if (order.notes) lines.push(`*Observações:* ${order.notes}`);
  lines.push("");
  lines.push(`Acompanhe: ${siteOrigin}/pedido/${order.id}`);
  return lines.join("\n");
}
