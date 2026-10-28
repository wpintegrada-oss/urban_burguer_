import type { VercelRequest, VercelResponse } from "@vercel/node";

// ARQUIVO TEMPORÁRIO DE DIAGNÓSTICO — apague depois que os pedidos funcionarem.
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const out: Record<string, unknown> = {
    functionRuns: true,
    node: process.version,
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasAdminPin: Boolean(process.env.ADMIN_PIN),
  };

  const uri = process.env.MONGODB_URI;
  if (uri) {
    out.uriLooksOk = uri.startsWith("mongodb+srv://") && !uri.includes("<") && !uri.includes(">");
    out.uriHasWhitespace = uri !== uri.trim();
  }

  try {
    const { MongoClient } = await import("mongodb");
    out.driverLoaded = true;
    if (uri) {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 6000 });
      try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        out.mongoPing = "ok";
      } finally {
        await client.close().catch(() => undefined);
      }
    }
  } catch (err) {
    const e = err as { name?: string; code?: unknown; codeName?: string; message?: string };
    out.errorName = e.name;
    out.errorCode = e.code;
    out.errorCodeName = e.codeName;
    // remove qualquer trecho de string de conexão da mensagem
    out.errorMessage = String(e.message ?? "")
      .replace(/mongodb(\+srv)?:\/\/\S+/gi, "[uri]")
      .slice(0, 300);
  }

  res.status(200).json(out);
}
