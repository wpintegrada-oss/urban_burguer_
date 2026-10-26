import { timingSafeEqual } from "node:crypto";
import type { VercelRequest } from "@vercel/node";

/** PIN do painel. Defina ADMIN_PIN na Vercel; o "1234" só existe para desenvolvimento. */
export function isAdmin(req: VercelRequest): boolean {
  const expected = process.env.ADMIN_PIN || "1234";
  const header = req.headers["x-admin-pin"];
  const given = Array.isArray(header) ? header[0] : header;
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
