import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./modules/db-module/schema.ts",
  out: "./modules/db-module/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});