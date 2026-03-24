// Prisma config for Kaleido School MVP
// Docs: https://pris.ly/d/config-datasource
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Pooled connection (port 6543) - used for app queries
    url: process.env["DATABASE_URL"],
    // Note: Prisma 7 config does not support directUrl. 
    // To migrate/push, temporarily change DATABASE_URL port to 5432 in .env
  },
});
