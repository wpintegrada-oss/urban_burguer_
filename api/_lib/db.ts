import { MongoClient, type Collection } from "mongodb";
import type { Order } from "../../shared/types";

export class ConfigError extends Error {}

interface Cache {
  client?: Promise<MongoClient>;
  indexed?: boolean;
}
const cache = globalThis as unknown as { __ub?: Cache };
const state: Cache = (cache.__ub ??= {});

export async function ordersCollection(): Promise<Collection<Order>> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new ConfigError("MONGODB_URI não configurada");

  state.client ??= new MongoClient(uri).connect();
  let client: MongoClient;
  try {
    client = await state.client;
  } catch (err) {
    state.client = undefined; // permite nova tentativa na próxima requisição
    throw err;
  }

  const col = client.db(process.env.DB_NAME || "urban_burguer").collection<Order>("orders");
  if (!state.indexed) {
    await col.createIndex({ id: 1 }, { unique: true, name: "id" });
    await col.createIndex({ createdAt: -1 }, { name: "createdAt_desc" });
    state.indexed = true;
  }
  return col;
}
