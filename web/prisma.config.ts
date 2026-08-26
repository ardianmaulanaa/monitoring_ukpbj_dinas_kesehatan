import "dotenv/config";

import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL belum diatur. Gunakan URL TiDB, contoh: mysql://USER:PASSWORD@HOST:4000/ukpbj_kesehatan_db?sslaccept=strict",
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
