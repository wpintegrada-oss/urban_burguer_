import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes } from "node:crypto";
import { getDb } from "./_lib/db";
import { isAdmin } from "./_lib/auth";
import { handleError } from "./_lib/http";

const MAX_BASE64_CHARS = 2_000_000; // ≈ 1,5 MB de imagem (o painel já reduz antes de enviar)
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * Fotos enviadas pelo painel ficam no próprio banco.
 *   POST /api/image   { dataUrl }  (PIN no cabeçalho) → { url: "/api/image?id=..." }
 *   GET  /api/image?id=...                              → a imagem
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
      if (!id || !/^[a-z0-9]{8,32}$/.test(id)) return res.status(404).end();
      const db = await getDb();
      const doc = await db.collection("images").findOne({ id });
      if (!doc) return res.status(404).end();
      res.setHeader("Content-Type", String(doc.contentType));
      // O id muda a cada envio, então a foto nunca "fica velha" no cache.
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.status(200).send(Buffer.from(String(doc.data), "base64"));
    }

    if (req.method === "POST") {
      if (!isAdmin(req)) return res.status(401).json({ error: "PIN inválido" });
      const dataUrl = (req.body as { dataUrl?: unknown } | null)?.dataUrl;
      if (typeof dataUrl !== "string") return res.status(400).json({ error: "Imagem inválida" });
      const m = DATA_URL.exec(dataUrl);
      if (!m) return res.status(400).json({ error: "Use uma imagem JPG, PNG ou WebP" });
      if (m[2].length > MAX_BASE64_CHARS) return res.status(413).json({ error: "Imagem grande demais" });

      const id = randomBytes(8).toString("hex");
      const db = await getDb();
      await db.collection("images").insertOne({
        id,
        contentType: m[1],
        data: m[2],
        createdAt: new Date().toISOString(),
      });
      return res.status(201).json({ url: `/api/image?id=${id}` });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    return handleError(res, err);
  }
}
