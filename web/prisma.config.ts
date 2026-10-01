import "dotenv/config";

import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL belum diatur. Gunakan URL PostgreSQL, contoh: postgresql://USER:PASSWORD@HOST:5432/monitoring_ukpbj?schema=public",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
