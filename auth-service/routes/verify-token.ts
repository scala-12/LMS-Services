import { createUnauthorizedError } from '@/utils/exceptions';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.post('/verify', {
    preValidation: async (req) => {
      const { error, token } = fastify.jwt.extractAccessToken(req);
      if (error || !token) throw createUnauthorizedError(error);
      if (token.expired) throw createUnauthorizedError("Token expired")
    },
  }, async (_, reply) => {
    return reply.send({
      data: { success: true },
      message: 'Access token verified',
    });
  });
}
