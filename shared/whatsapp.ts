import { PAYMENT_LABEL } from "./menu";
import { brl } from "./pricing";
import type { Order, OrderStatus } from "./types";

/** Link para falar com a LOJA (número vem das configurações do painel). */
export function whatsappLink(storeNumber: string, message: string): string {
  return `https://wa.me/${storeNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/** Link para abrir a conversa com o CLIENTE (telefone digitado por ele no checkout). */
export function customerWhatsappUrl(phone: string, message?: string): string {
  let digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  // DDD + número = 10 ou 11 dígitos: falta o código do Brasil. (Não dá para testar só
  // "começa com 55", porque o DDD 55 existe — Santa Maria/RS.)
  if (digits.length <= 11) digits = "55" + digits;
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;
}

export function buildOrderMessage(order: Order): string {
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
  return lines.join("\n");
}

/** Texto enviado ao cliente a cada mudança de status. Edite à vontade. */
export function buildStatusMessage(
  order: Pick<Order, "id" | "customer" | "total">,
  status: OrderStatus,
  storeName: string,
  instagram: string,
): string {
  const first = order.customer.name.trim().split(/\s+/)[0] || "cliente";
  const nome = first.charAt(0).toUpperCase() + first.slice(1);
  const code = `#${order.id}`;
  const ig = instagram ? `\nSiga a gente no Instagram: https://www.instagram.com/${instagram}` : "";

  switch (status) {
    case "recebido":
      return `Olá, ${nome}! Recebemos o seu pedido ${code} na ${storeName} 🍔 Total: ${brl(order.total)}. Já vamos começar a preparar!${ig}`;
    case "preparando":
      return `${nome}, seu pedido ${code} já está na chapa! 🔥 Em breve ele sai para entrega.${ig}`;
    case "saiu_entrega":
      return `${nome}, seu pedido ${code} saiu para entrega! 🛵 O entregador já está a caminho, fique de olho.${ig}`;
    case "entregue":
      return `Pedido ${code} entregue! 😋 Bom apetite, ${nome}, e obrigado por pedir na ${storeName}!${ig}`;
    case "cancelado":
      return `Olá, ${nome}. Infelizmente o seu pedido ${code} foi cancelado. Se tiver qualquer dúvida, é só responder esta mensagem.`;
  }
}
