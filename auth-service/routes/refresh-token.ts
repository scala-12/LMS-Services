import { TokenType } from '@/modules/jwt-module/types';
import { setJwtCookies } from '@/utils/cookies';
import { createBadRequiestError, createUnauthorizedError } from '@/utils/exceptions';
import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.post<{
    Body: Static<typeof RefreshBodySchema>
  }>('/refresh', {
    schema: {
      body: RefreshBodySchema
    },
  }, async (request, reply) => {
    let { [TokenType.REFRESH]: oldToken } = request.cookies;
    if (!oldToken) {
      oldToken = request.body.refreshToken
      if (!oldToken) throw createBadRequiestError("Refresh token not provided");
    }

    const { type: tokenType, expired, userId } = fastify.jwt.extractToken(oldToken);
    if (tokenType !== TokenType.REFRESH) {
      fastify.log.debug({ userId }, "Wrong token");
      throw createUnauthorizedError("Wrong token");
    }
    if (expired) {
      fastify.log.debug({ userId }, 'Expired token');
      throw createUnauthorizedError("Expired token");
    }

    const user = await fastify.db.findUser({ userId })
    if (!user) throw createUnauthorizedError("User not exists");

    const { [TokenType.REFRESH]: token } = setJwtCookies(fastify, reply, user);
    fastify.db.rotateToken(user, oldToken, token)

    return reply.send({
      data: { success: true },
      message: 'Tokens update successful',
    });
  });
}

const RefreshBodySchema = Type.Optional(
  Type.Object({
    refreshToken: Type.String({ minLength: 1 })
  })
)
