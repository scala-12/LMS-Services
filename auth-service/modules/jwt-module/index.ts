import { CookieSerializeOptions } from '@fastify/cookie';
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify';
import jwt, { PrivateKey, PublicKey, Secret, SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { AccessToken, RefreshToken, TokenType, UserInfo } from './types';
import { createTokenPayload, extractTokenFromJwt } from './utils';

type JwtModuleParams = {
  secretKey: Secret | PrivateKey,
  publicKey: PublicKey,
  refreshExpires: number,
  accessExpires: number
  tokenRefreshPath: string
}

export class JwtModule {
  readonly #secretKey: Secret | PrivateKey;
  readonly #logger: FastifyBaseLogger;
  readonly #tokenRefreshPath: string;
  readonly #publicKey: PublicKey
  readonly #refreshExpires: number
  readonly #accessExpires: number

  constructor(
    logger: FastifyBaseLogger,
    { secretKey, publicKey, refreshExpires, accessExpires, tokenRefreshPath: refreshTokenPath }: JwtModuleParams,
    public readonly withSecureCookies: boolean
  ) {
    this.#logger = logger;
    this.#secretKey = secretKey;
    this.#publicKey = publicKey
    this.#refreshExpires = refreshExpires
    this.#accessExpires = accessExpires
    this.#tokenRefreshPath = refreshTokenPath
  }

  #signToken = (
    tokenType: TokenType,
    user: UserInfo,
    lifetime?: number
  ): string => {
    const payload = createTokenPayload(user, tokenType);
    if (lifetime != null && lifetime < 0) {
      this.#logger.error({ lifetime }, "Wrong lifitime value")
      throw new Error("Wrong lifitime value")
    }
    const opts: SignOptions = {
      algorithm: 'RS256',
      subject: user.userId,
      expiresIn: lifetime ?? (tokenType === TokenType.REFRESH ?
        this.#refreshExpires
        : this.#accessExpires)
    };
    this.#logger.debug({ user, tokenType }, 'Sign jwt');

    return jwt.sign(payload, this.#secretKey, opts);
  }

  extractAccessToken = ({ headers, cookies }: Pick<FastifyRequest, 'headers' | "cookies">): {
    token: AccessToken;
    error?: never
  } | {
    token?: never;
    error: string;
  } => {
    let { [TokenType.ACCESS]: encodedToken } = cookies;
    if (!encodedToken) {
      encodedToken = headers.authorization
      if (!encodedToken) return { error: "Access token not setted" }
    }

    try {
      const token = this.decodeToken(encodedToken)
      if (token.type !== TokenType.ACCESS) {
        return { error: "Unexpected token type: " + token.type }
      }

      return { token }
    } catch (e) {
      return { error: "Wrong token: " + (e instanceof Error ? e.message : String(e)) }
    }
  }

  decodeToken = (encodedToken: string): (
    Pick<AccessToken, 'expired'> & { type?: never; userId?: never; }
    | AccessToken | RefreshToken
  ) => {
    let payload: jwt.JwtPayload | string | null;
    let isExpired = false;
    try {
      payload = jwt.verify(encodedToken, this.#publicKey);
    } catch (err) {
      if (!(err instanceof TokenExpiredError)) {
        throw err;
      }
      payload = jwt.decode(encodedToken);
      this.#logger.debug({ err }, 'Token verification failed but token decoded')
      isExpired = true;
    }

    if (!payload || typeof payload === 'string') {
      return { expired: isExpired }
    }

    const expired = isExpired || payload.exp == null || new Date(payload.exp * 1_000) <= new Date();
    const tokenData = extractTokenFromJwt(payload, expired)

    return tokenData ?? { expired };
  }

  #createCookieDetails = (tokenType: TokenType, isZeroAge: boolean): CookieSerializeOptions => {
    const isAccessToken = tokenType === TokenType.ACCESS;
    const path = isAccessToken ? '/' : this.#tokenRefreshPath;
    const maxAge = isZeroAge ? 0 : (
      isAccessToken ?
        this.#accessExpires
        : this.#refreshExpires
    )

    return ({
      path,
      httpOnly: true,
      secure: this.withSecureCookies,
      sameSite: 'strict', // Защита от CSRF
      maxAge
    });
  }

  createAccessShortToken = (user: UserInfo) => {
    return this.#signToken(TokenType.ACCESS, user, 15);
  }

  setJwtCookies = (
    reply: FastifyReply,
    user: UserInfo,
  ): Record<TokenType, string> => this.#setJwtCookies(reply, user);

  clearJwtCookies = (
    reply: FastifyReply,
  ): void => { this.#setJwtCookies(reply, null); }

  #setJwtCookies = <TUser extends UserInfo | null, TResult extends TUser extends null ? null : Record<TokenType, string> = TUser extends null ? null : Record<TokenType, string>>(
    reply: FastifyReply,
    user: TUser
  ): TResult => {
    const tokens: Partial<Record<TokenType, string>> = {}
    const isClearMode = user == null
    for (const tokenType of Object.values(TokenType)) {
      const cookieDetails = this.#createCookieDetails(tokenType, isClearMode);
      if (!isClearMode) {
        tokens[tokenType] = this.#signToken(tokenType, user);
      }

      reply.setCookie(
        tokenType,
        tokens[tokenType] ?? 'logout',
        cookieDetails
      );
    }

    return (isClearMode ? null : tokens) as TResult
  }
}

