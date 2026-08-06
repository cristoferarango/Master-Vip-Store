import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7: la conexión ya no vive en schema.prisma, sino aquí. Migrate/Studio
// usan esta config; el PrismaClient en tiempo de ejecución usa su propio
// adapter (ver lib/db/prisma.ts) para poder compartir el mismo pool en
// entornos serverless.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
