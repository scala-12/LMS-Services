import bcrypt from 'bcrypt';
import { and, eq } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { FastifyBaseLogger } from "fastify";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import { credentials, refreshTokens } from "./schema";
import { Credential } from "./types";
import { hashToken } from "./utils";

const initDb = (connectionString: string): NodePgDatabase => {
  const { Pool } = pg;

  const pool = new Pool({
    connectionString,
  });

  return drizzle(pool);
}

export class DbModule {
  readonly #db: ReturnType<typeof initDb>
  readonly #logger: FastifyBaseLogger;
  readonly #refreshTokenLifetimeSeconds: number;

  constructor(logger: FastifyBaseLogger, connectionString: string, refreshTokenLifetimeSeconds: number) {
    this.#logger = logger
    this.#db = initDb(connectionString)
    this.#refreshTokenLifetimeSeconds = refreshTokenLifetimeSeconds
  }

  createUser = async (data: Omit<Credential, 'createdAt' | "userId">): Promise<Credential | undefined> => {
    const users = await this.#db.insert(credentials).values({ ...data, userId: uuidv4() }).returning()
    const user = users.at(0)

    this.#logger.debug({ userId: user?.userId }, "User creation result")

    return user
  }

  findUser = async ({ email, username, userId }: { email: string; username?: never; userId?: never } | { email?: never; username: string; userId?: never } | { email?: never; username?: never; userId: string }): Promise<Credential | undefined> => {
    if (email == null && username == null && userId == null) throw new Error("Wrong params")

    let whereStatement
    if (email) {
      whereStatement = eq(credentials.email, email.toLowerCase())
    } else if (username) {
      whereStatement = eq(credentials.username, username.toLowerCase())
    } else if (userId) {
      whereStatement = eq(credentials.userId, userId)
    }
    const users = await this.#db.select().from(credentials).where(whereStatement)

    return users.at(0)
  }

  checkUserLogin = async (
    password: string,
    data: { email: string; username?: never } | { email?: never; username: string }
  ): Promise<{
    user: Credential;
    error?: never
  }
    | {
      error: string;
      user?: never
    }> => {
    const user = await this.findUser(data)

    const { email, username } = data
    if (!user) {
      this.#logger.debug({ username, email }, "User not found");
      return { error: "Username or email not provided" }
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      this.#logger.debug({ username, email }, `Invalid password`);
      return { error: "Invalid credential" }
    }

    return { user }
  }

  revokeToken = async (token: string): Promise<string | undefined> => {
    const res = await this.#db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.tokenHash, hashToken(token))).returning()

    const id = res.at(0)?.id
    this.#logger.debug({ tokenId: id }, "Token revoked")

    return id
  }

  saveToken = async ({ userId }: Credential, token: string): Promise<string | undefined> => {
    const tokenHash = hashToken(token);

    const tokens = await this.#db.insert(refreshTokens).values({
      id: uuidv4(),
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + this.#refreshTokenLifetimeSeconds * 1_000),
    }).returning()

    const id = tokens.at(0)?.id
    this.#logger.debug({ tokenId: id }, "Save refresh token")

    return id
  }

  rotateToken = async (user: Credential, prevRefreshToken: string, refreshToken: string): Promise<{ error: string, id?: never } | { error?: never, id: string }> => {
    const prevTokenHash = hashToken(prevRefreshToken);

    const isActivePrevToken = this.#db.select().from(refreshTokens).where(and(eq(refreshTokens.revoked, false), eq(refreshTokens.tokenHash, prevTokenHash))).limit(1)
    if (!isActivePrevToken) return { error: "Prev token not active" }

    const nextTokenId = (await this.saveToken(user, refreshToken))!

    this.#db.update(refreshTokens).set({ revoked: true, nextTokenId }).where(eq(refreshTokens.tokenHash, prevTokenHash))
    this.#logger.debug({ tokenId: nextTokenId }, "Refresh token rotated")

    return { id: nextTokenId }
  }
}