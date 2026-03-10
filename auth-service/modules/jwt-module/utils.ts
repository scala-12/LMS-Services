import jwt from 'jsonwebtoken';
import { AccessToken, RefreshToken, TokenType, UserInfo, UserPayload } from "./types";

export const extractTokenFromJwt = (payload: unknown, expired: boolean): AccessToken | RefreshToken | null => {
  if (!payload || typeof payload !== 'object') return null;

  const { username, email, roles, sub: userId, type: tokenType } = payload as jwt.JwtPayload;
  if (typeof userId !== 'string') return null;

  switch (tokenType) {
    case TokenType.ACCESS:
      {
        if (typeof username !== 'string' ||
          (email != null && typeof email !== 'string') ||
          !Array.isArray(roles) ||
          roles.some(role => typeof role !== 'string')
        ) return null

        const token: AccessToken = {
          expired, userId, username, email, roles: new Set(roles),
          type: tokenType,
        };
        return token;
      }
    case TokenType.REFRESH:
      {
        const token: RefreshToken = {
          expired, userId,
          type: tokenType,
        };
        return token;
      }
  }

  return null
}

export const createTokenPayload = (user: UserInfo, tokenType: TokenType): JwtPayload => {
  if (tokenType === TokenType.ACCESS) {
    const { username, roles, email } = user;
    return { username, roles: [...roles], email, type: tokenType }
  }

  return { type: tokenType }
}
type JwtPayload = (Omit<UserPayload, 'roles'> & { roles: string[] } & { type: TokenType.ACCESS }) | { type: TokenType.REFRESH }