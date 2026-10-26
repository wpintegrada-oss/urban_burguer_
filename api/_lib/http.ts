import type { VercelResponse } from "@vercel/node";
import { ConfigError } from "./db";

export function handleError(res: VercelResponse, err: unknown) {
  console.error(err);
  if (err instanceof ConfigError) {
    return res.status(503).json({ error: "Servidor sem banco de dados configurado." });
  }
  return res.status(500).json({ error: "Erro interno. Tente novamente em instantes." });
}
