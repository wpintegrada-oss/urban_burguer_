import { MongoClient, type Db } from "mongodb";
import type { Addon, Category, MenuItem, Order, Settings } from "../../shared/types";

export class ConfigError extends Error {}

// Interface enxuta com só o que usamos do driver (deixa o código independente dos genéricos do MongoDB).
export interface Cursor<T> {
  sort(spec: Record<string, 1 | -1>): Cursor<T>;
  limit(n: number): Cursor<T>;
  toArray(): Promise<T[]>;
}

export interface Col<T> {
  findOne(filter: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>;
  find(filter?: Record<string, unknown>, options?: Record<string, unknown>): Cursor<T>;
  insertOne(doc: T): Promise<unknown>;
  updateOne(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<{ matchedCount: number }>;
  updateMany(filter: Record<string, unknown>, update: Record<string, unknown>): Promise<unknown>;
  deleteOne(filter: Record<string, unknown>): Promise<{ deletedCount: number }>;
  countDocuments(filter?: Record<string, unknown>): Promise<number>;
  createIndex(spec: Record<string, 1 | -1>, options?: Record<string, unknown>): Promise<unknown>;
}

export type SettingsDoc = Settings & { _id: string };
export interface ImageDoc {
  id: string;
  contentType: string;
  data: string; // base64
  createdAt: string;
}
export interface FailDoc {
  key: string;
  count: number;
  expireAt: Date;
}

export interface Cols {
  orders: Col<Order>;
  categories: Col<Category>;
  products: Col<MenuItem>;
  addons: Col<Addon>;
  settings: Col<SettingsDoc>;
  images: Col<ImageDoc>;
  fails: Col<FailDoc>;
}

interface State {
  db?: Promise<Db>;
  cols?: Promise<Cols>;
  seeded?: Promise<void>;
}
const g = globalThis as unknown as { __ub2?: State };
export const state: State = (g.__ub2 ??= {});

export function getDb(): Promise<Db> {
  state.db ??= (async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new ConfigError("MONGODB_URI não configurada");
    const client = await new MongoClient(uri).connect();
    return client.db(process.env.DB_NAME || "urban_burguer");
  })().catch((err) => {
    state.db = undefined; // permite nova tentativa na próxima requisição
    throw err;
  });
  return state.db;
}

async function connect(): Promise<Cols> {
  const db = await getDb();
  const col = <T,>(name: string) => db.collection(name) as unknown as Col<T>;

  const c: Cols = {
    orders: col<Order>("orders"),
    categories: col<Category>("categories"),
    products: col<MenuItem>("products"),
    addons: col<Addon>("addons"),
    settings: col<SettingsDoc>("settings"),
    images: col<ImageDoc>("images"),
    fails: col<FailDoc>("admin_fails"),
  };

  const safe = (p: Promise<unknown>) =>
    p.catch((err) => console.error("createIndex falhou:", err));
  await Promise.all([
    safe(c.orders.createIndex({ id: 1 }, { unique: true, name: "id" })),
    safe(c.orders.createIndex({ createdAt: -1 }, { name: "createdAt_desc" })),
    safe(c.categories.createIndex({ id: 1 }, { unique: true, name: "id" })),
    safe(c.products.createIndex({ id: 1 }, { unique: true, name: "id" })),
    safe(c.addons.createIndex({ id: 1 }, { unique: true, name: "id" })),
    safe(c.images.createIndex({ id: 1 }, { unique: true, name: "id" })),
    safe(c.fails.createIndex({ key: 1 }, { unique: true, name: "key" })),
    safe(c.fails.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0, name: "expireAt_ttl" })),
  ]);
  return c;
}

export function cols(): Promise<Cols> {
  state.cols ??= connect().catch((err) => {
    state.cols = undefined; // permite nova tentativa na próxima requisição
    throw err;
  });
  return state.cols;
}

export async function ordersCollection(): Promise<Col<Order>> {
  return (await cols()).orders;
}
