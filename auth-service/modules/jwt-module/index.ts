import { FastifyBaseLogger } from 'fastify';
import jwt, { PrivateKey, PublicKey, Secret, SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { AccessToken, RefreshToken, TokenType, UserInfo } from './types';
import { createTokenPayload, extractTokenFromJwt } from './utils';

export class JwtModule {
  readonly #secretKey: Secret | PrivateKey;
  readonly #logger: FastifyBaseLogger;

  constructor(
    logger: FastifyBaseLogger,
    secretKey: Secret | PrivateKey,
    public readonly publicKey: PublicKey,
    public readonly refreshExpires: number,
    public readonly accessExpires: number
  ) {
    this.#logger = logger;
    this.#secretKey = secretKey;
  }

  signToken = (
    tokenType: TokenType,
    user: UserInfo,
  ): string => {
    const payload = createTokenPayload(user, tokenType);
    const opts: SignOptions = {
      algorithm: 'RS256',
      subject: user.id,
      expiresIn: tokenType === TokenType.REFRESH ?
        this.refreshExpires
        : this.accessExpires
    };
    this.#logger.debug({ user, tokenType }, 'Sign jwt');

    return jwt.sign(payload, this.#secretKey, opts);
  }

  extractToken = (encodedToken: string): (
    Pick<AccessToken, 'expired'> & { type?: never; userId?: never; }
    | AccessToken | RefreshToken
  ) => {
    let payload: jwt.JwtPayload | string | null;
    let isExpired = false;
    try {
      payload = jwt.verify(encodedToken, this.publicKey);
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
}

