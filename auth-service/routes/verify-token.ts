import { TokenType } from '@/modules/jwt-module/types';
import { createBadRequiestError, createUnauthorizedError } from '@/utils/exceptions';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.post('/verify', {}, async ({ cookies, headers }, reply) => {
    let { [TokenType.ACCESS]: token } = cookies;
    if (!token) {
      token = headers.authorization
      if (!token) throw createBadRequiestError("Access token not setted");
    }

    const info = fastify.jwt.decodeToken(token);
    if (info.type !== TokenType.ACCESS) {
      fastify.log.error({ tokenInto: info }, "Wrong token");
      throw createUnauthorizedError("Wrong token");
    }
    if (info.expired) {
      fastify.log.error({}, "Expired token");
      throw createUnauthorizedError("Expired token");
    }

    return reply.send({
      data: { success: true },
      message: 'Access token verified',
    });
  });
}
