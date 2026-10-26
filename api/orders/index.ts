import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomInt } from "node:crypto";
import { ordersCollection } from "../_lib/db";
import { isAdmin } from "../_lib/auth";
import { validateOrder } from "../_lib/validate";
import { handleError } from "../_lib/http";
import { STATUS_IDS } from "../../shared/menu";
import type { Order, OrderStatus } from "../../shared/types";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I para evitar confusão
const newCode = () =>
  "UB-" + Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // POST /api/orders — cliente cria um pedido
    if (req.method === "POST") {
      const parsed = validateOrder(req.body);
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });

      const col = await ordersCollection();
      const now = new Date().toISOString();

      for (let attempt = 0; attempt < 6; attempt++) {
        const order: Order = {
          id: newCode(),
          status: "recebido",
          createdAt: now,
          updatedAt: now,
          ...parsed.value,
        };
        try {
          await col.insertOne({ ...order });
          return res.status(201).json(order);
        } catch (err) {
          if ((err as { code?: number }).code === 11000) continue; // código repetido: sorteia outro
          throw err;
        }
      }
      return res.status(500).json({ error: "Não foi possível gerar o código do pedido." });
    }

    // GET /api/orders?status=recebido — painel admin (PIN no header x-admin-pin)
    if (req.method === "GET") {
      if (!isAdmin(req)) return res.status(401).json({ error: "PIN inválido" });
      const col = await ordersCollection();
      const status = typeof req.query.status === "string" ? req.query.status : "";
      const filter = STATUS_IDS.includes(status as OrderStatus) ? { status: status as OrderStatus } : {};
      const orders = await col
        .find(filter, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .limit(300)
        .toArray();
      return res.status(200).json(orders);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    return handleError(res, err);
  }
}
