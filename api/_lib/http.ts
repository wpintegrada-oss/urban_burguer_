import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConfigError } from "./db";

export function handleError(res: VercelResponse, err: unknown) {
  console.error(err);
  if (err instanceof ConfigError) {
    return res.status(503).json({ error: "Servidor sem banco de dados configurado." });
  }
  return res.status(500).json({ error: "Erro interno. Tente novamente em instantes." });
}

/** Corpo da requisição como objeto (a Vercel já entrega JSON convertido; aceita texto também). */
export function bodyOf(req: VercelRequest): Record<string, unknown> {
  let b = req.body as unknown;
  if (typeof b === "string") {
    try {
      b = JSON.parse(b) as unknown;
    } catch {
      return {};
    }
  }
  return typeof b === "object" && b !== null && !Array.isArray(b) ? (b as Record<string, unknown>) : {};
}

export function queryString(req: VercelRequest, key: string): string {
  const v = req.query[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}
