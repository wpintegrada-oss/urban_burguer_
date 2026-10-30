import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes } from "node:crypto";
import { getDb } from "../_lib/db";
import { isAdmin } from "../_lib/auth";
import { handleError } from "../_lib/http";
import { ensureSeeded, loadMenu } from "../_lib/menuStore";
import { parseAddon, parseCategory, parseProduct, parseSettings } from "../_lib/adminValidate";

const q = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";
const token = () => randomBytes(4).toString("hex");

const COLLECTION = { products: "products", categories: "categories", addons: "addons" } as const;
const PREFIX = { products: "p", categories: "c", addons: "a" } as const;
type Resource = keyof typeof COLLECTION;

/**
 * Painel admin (todas as rotas exigem o PIN no cabeçalho x-admin-pin):
 *   GET    /api/admin/menu                       → tudo, inclusive desativados
 *   PUT    /api/admin/settings                   → dados da loja
 *   POST   /api/admin/{products|categories|addons}          → criar
 *   PUT    /api/admin/{...}?id=ID                → editar
 *   PATCH  /api/admin/{...}?id=ID  {active}      → ativar / desativar
 *   DELETE /api/admin/{...}?id=ID                → excluir
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isAdmin(req)) return res.status(401).json({ error: "PIN inválido" });
    res.setHeader("Cache-Control", "no-store");

    const resource = q(req.query.resource);
    const id = q(req.query.id);

    await ensureSeeded();

    if (resource === "menu") {
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      return res.status(200).json(await loadMenu(false));
    }

    const db = await getDb();

    if (resource === "settings") {
      if (req.method !== "PUT") return methodNotAllowed(res, "PUT");
      const parsed = parseSettings(req.body);
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });
      await db
        .collection("settings")
        .updateOne({ _id: "main" as never }, { $set: { ...parsed.value } }, { upsert: true });
      return res.status(200).json(parsed.value);
    }

    if (resource !== "products" && resource !== "categories" && resource !== "addons") {
      return res.status(404).json({ error: "Recurso não encontrado" });
    }
    const name: Resource = resource;
    const col = db.collection(COLLECTION[name]);

    // Valida e monta o documento (sem o id) para criar/editar.
    const parse = async (body: unknown) => {
      if (name === "categories") return parseCategory(body);
      if (name === "addons") return parseAddon(body);
      const [cats, adds] = await Promise.all([
        db.collection("categories").find({}, { projection: { _id: 0, id: 1 } }).toArray(),
        db.collection("addons").find({}, { projection: { _id: 0, id: 1 } }).toArray(),
      ]);
      return parseProduct(body, {
        categoryIds: new Set(cats.map((c) => String(c.id))),
        addonIds: new Set(adds.map((a) => String(a.id))),
      });
    };

    if (req.method === "POST") {
      const parsed = await parse(req.body);
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });
      const doc = { id: `${PREFIX[name]}-${token()}`, ...parsed.value };
      await col.insertOne({ ...doc });
      return res.status(201).json(doc);
    }

    if (!id) return res.status(400).json({ error: "Informe o id" });

    if (req.method === "PUT") {
      const parsed = await parse(req.body);
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });
      const result = await col.updateOne({ id }, { $set: { ...parsed.value } });
      if (result.matchedCount === 0) return res.status(404).json({ error: "Não encontrado" });
      return res.status(200).json({ id, ...parsed.value });
    }

    if (req.method === "PATCH") {
      const active = (req.body as { active?: unknown } | null)?.active;
      if (typeof active !== "boolean") return res.status(400).json({ error: "Informe active: true/false" });
      const result = await col.updateOne({ id }, { $set: { active } });
      if (result.matchedCount === 0) return res.status(404).json({ error: "Não encontrado" });
      return res.status(200).json({ id, active });
    }

    if (req.method === "DELETE") {
      if (name === "categories") {
        const inUse = await db.collection("products").countDocuments({ categoryId: id });
        if (inUse > 0) {
          return res.status(409).json({
            error: `Esta categoria tem ${inUse} produto(s). Mova ou exclua os produtos antes, ou apenas desative a categoria.`,
          });
        }
      }
      if (name === "addons") {
        await db.collection("products").updateMany({}, { $pull: { addons: id } as never });
      }
      const result = await col.deleteOne({ id });
      if (result.deletedCount === 0) return res.status(404).json({ error: "Não encontrado" });
      return res.status(200).json({ id, deleted: true });
    }

    return methodNotAllowed(res, "POST, PUT, PATCH, DELETE");
  } catch (err) {
    return handleError(res, err);
  }
}

function methodNotAllowed(res: VercelResponse, allow: string) {
  res.setHeader("Allow", allow);
  return res.status(405).json({ error: "Método não permitido" });
}
