import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ordersCollection } from "../_lib/db";
import { isAdmin } from "../_lib/auth";
import { handleError } from "../_lib/http";
import { STATUS_IDS } from "../../shared/menu";
import type { Order, OrderStatus, PublicOrder } from "../../shared/types";

function toPublic(o: Order): PublicOrder {
  return {
    id: o.id,
    status: o.status,
    firstName: o.customer.name.split(" ")[0],
    paymentMethod: o.payment.method,
    items: o.items,
    total: o.total,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const id = (rawId ?? "").toUpperCase();
    if (!/^UB-[A-Z0-9]{4}$/.test(id)) return res.status(404).json({ error: "Pedido não encontrado" });

    const col = await ordersCollection();

    // GET /api/orders/UB-XXXX — rastreio público (sem telefone/endereço)
    if (req.method === "GET") {
      const order = await col.findOne({ id }, { projection: { _id: 0 } });
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
      return res.status(200).json(toPublic(order));
    }

    // PATCH /api/orders/UB-XXXX — admin muda o status
    if (req.method === "PATCH") {
      if (!isAdmin(req)) return res.status(401).json({ error: "PIN inválido" });
      const status = (req.body as { status?: string } | null)?.status;
      if (!status || !STATUS_IDS.includes(status as OrderStatus)) {
        return res.status(400).json({ error: "Status inválido" });
      }
      const result = await col.updateOne(
        { id },
        { $set: { status: status as OrderStatus, updatedAt: new Date().toISOString() } },
      );
      if (result.matchedCount === 0) return res.status(404).json({ error: "Pedido não encontrado" });
      const order = await col.findOne({ id }, { projection: { _id: 0 } });
      return res.status(200).json(order);
    }

    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    return handleError(res, err);
  }
}
