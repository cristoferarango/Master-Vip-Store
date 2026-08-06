import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7: el PrismaClient ya no lee `url` desde schema.prisma, requiere un
// "driver adapter" explícito. Usamos SQLite local (archivo dentro del
// proyecto, ver .env DATABASE_URL) para poder testear sin depender de un
// servidor de base de datos externo. Evita crear múltiples instancias en
// desarrollo por el hot-reload de Next.js.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está configurada en .env");
  }

  const adapter = new PrismaBetterSqlite3({ url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
