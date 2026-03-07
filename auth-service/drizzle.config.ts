import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./modules/db/schema.ts",
  out: "./modules/db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});