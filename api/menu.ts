import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadMenu } from "./_lib/menuStore";
import { handleError } from "./_lib/http";

// GET /api/menu — cardápio público: só o que está ativo.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Método não permitido" });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(await loadMenu(true));
  } catch (err) {
    return handleError(res, err);
  }
}
