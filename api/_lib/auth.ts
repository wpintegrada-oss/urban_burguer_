import { timingSafeEqual } from "node:crypto";
import type { VercelRequest } from "@vercel/node";

/** Confere o PIN do painel (cabeçalho x-admin-pin). Sem ADMIN_PIN configurada, o painel fica trancado. */
export function isAdmin(req: VercelRequest): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected) return false;
  const header = req.headers["x-admin-pin"];
  const given = Array.isArray(header) ? header[0] : header;
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
