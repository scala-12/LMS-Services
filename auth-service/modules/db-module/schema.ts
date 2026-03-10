import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const credentials = pgTable("credentials", {
  userId: uuid("user_id").primaryKey(),
  email: text("email").unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  roles: text("roles").array().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").default(false),
  nextTokenId: uuid("next_token_id")
});