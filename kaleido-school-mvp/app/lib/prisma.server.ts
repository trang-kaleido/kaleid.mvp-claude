/**
 * Prisma Client Singleton
 *
 * This module creates a single PrismaClient instance that is reused across
 * the application. In development, it stores the instance on the global object
 * to prevent creating multiple connections during hot reloading.
 *
 * Prisma 7 requires a driver adapter — bare `new PrismaClient()` crashes with:
 * "Using engine type 'client' requires either 'adapter' or 'accelerateUrl'"
 *
 * Uses DATABASE_URL (port 6543, PgBouncer Transaction mode) — the correct
 * runtime URL per F01 session rules. DIRECT_URL (port 5432) is only for
 * migrations and the ingest script's $transaction() callbacks.
 */
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Creates a Prisma client with the required Prisma 7 driver adapter.
// Each call opens a new connection pool — so we keep it to one call per process.
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("[prisma] DATABASE_URL is not set");
  // Pool manages a set of reusable Postgres connections via PgBouncer.
  const pool = new Pool({ connectionString: databaseUrl });
  // PrismaPg wraps the pool so Prisma can use it as its connection layer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  // In development, store on global to survive hot module reloads.
  // Without this, each file-save would open a new pool — connection leak.
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

export { prisma };
