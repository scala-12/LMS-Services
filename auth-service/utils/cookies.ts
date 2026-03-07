import { Credential } from "@/modules/db-module/types";
import { TokenType } from "@/modules/jwt-module/types";
import { CookieSerializeOptions } from "@fastify/cookie";
import { FastifyInstance, FastifyReply } from "fastify";

const createTokenCookie = (tokenType: TokenType, fastify: FastifyInstance, isZeroAge?: boolean): CookieSerializeOptions => {
  const isAccess = tokenType === TokenType.ACCESS;
  const path = isAccess ? '/' : '/api/auth/refresh';
  const maxAge = isZeroAge ? 0 : (
    isAccess ?
      fastify.jwt.accessExpires
      : fastify.jwt.refreshExpires
  )

  return ({
    path,
    httpOnly: true,
    secure: fastify.config.NODE_ENV !== 'local',
    sameSite: 'strict', // Защита от CSRF
    maxAge
  });
};

const _setJwtCookies = <TUser extends Credential | null>(
  fastify: FastifyInstance,
  reply: FastifyReply,
  user: TUser
): TUser extends null ? null : Record<TokenType, string> => {
  const tokens: Partial<Record<TokenType, string>> = {}
  const isClearMode = user == null
  for (const tokenType of Object.values(TokenType)) {
    if (!isClearMode) {
      const { userId: id, email, username, roles } = user
      tokens[tokenType] = fastify.jwt.signToken(tokenType, {
        id, email, username, roles
      });
    }
    const cookieDetails = createTokenCookie(tokenType, fastify, isClearMode);

    reply.setCookie(
      tokenType,
      tokens[tokenType] ?? 'logout',
      cookieDetails
    );
  }
  if (isClearMode) {
    return null as TUser extends null ? null : Record<TokenType, string>
  }

  return tokens as TUser extends null ? null : Record<TokenType, string>
}

export const setJwtCookies = (
  fastify: FastifyInstance,
  reply: FastifyReply,
  user: Credential,
): Record<TokenType, string> => _setJwtCookies(fastify, reply, user);

export const clearJwtCookies = (
  fastify: FastifyInstance,
  reply: FastifyReply,
): void => { _setJwtCookies(fastify, reply, null) };
