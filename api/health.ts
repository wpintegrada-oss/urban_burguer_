import type { VercelRequest, VercelResponse } from "@vercel/node";
 
// ARQUIVO TEMPORÁRIO DE DIAGNÓSTICO — apague depois que os pedidos funcionarem.
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
 
  const out: Record<string, unknown> = {
    functionRuns: true,
    node: process.version,
    deployment: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) || null,
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasAdminPin: Boolean(process.env.ADMIN_PIN),
  };
 
  const uri = process.env.MONGODB_URI;
  if (uri) {
    // Estrutura da string, sem expor a senha.
    const m = uri.match(/^(mongodb(?:\+srv)?):\/\/([^:@/]*)(?::([^@]*))?@([^/?]*)(.*)$/s);
    out.uriShape = {
      length: uri.length,
      anyWhitespace: /\s/.test(uri),
      nonAscii: /[^\x20-\x7e]/.test(uri),
      atSigns: (uri.match(/@/g) ?? []).length,
      matchesPattern: Boolean(m),
      protocol: m?.[1] ?? null,
      username: m?.[2] ?? null,
      passwordLength: m?.[3]?.length ?? null,
      passwordIsAlphanumeric: m?.[3] ? /^[A-Za-z0-9]+$/.test(m[3]) : null,
      host: m?.[4] ?? null,
      rest: m?.[5] ?? null,
    };
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
    out.errorMessage = String(e.message ?? "")
      .replace(/mongodb(\+srv)?:\/\/\S+/gi, "[uri]")
      .slice(0, 300);
  }
 
  res.status(200).json(out);
}
 
