import { EmailTypebox, PasswordTypebox, UsernameTypebox } from '@/constants';
import { TokenType } from '@/modules/jwt-module/types';
import { createUnauthorizedError } from '@/utils/exceptions';
import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.post<{
    Body: Static<typeof AuthBodySchema>
  }>('/login', {
    schema: {
      body: AuthBodySchema
    },
    preValidation: async (req) => {
      req.body.email = req.body.email?.toLowerCase();
      req.body.username = req.body.username?.toLowerCase()
    },
  }, async ({ body }, reply) => {
    const { username, email, password } = body;

    const { error, user } = await fastify.db.checkUserLogin(password, body)
    if (error || !user) throw createUnauthorizedError(error ?? "Auth error");

    fastify.log.debug({ username, email }, "Login successful");

    const tokens = fastify.jwt.setJwtCookies(reply, user)
    fastify.db.saveToken(user, tokens[TokenType.REFRESH])

    return reply.send({
      data: { ...tokens, success: true },
      message: 'Login successful',
    });
  });

  fastify.post<{ Body: Static<typeof LogoutBodySchema> }>('/logout', {
    schema: {
      body: LogoutBodySchema
    },
  }, async ({ cookies, body }, reply) => {
    let { [TokenType.REFRESH]: refreshToken } = cookies;
    if (!refreshToken) {
      refreshToken = body.refreshToken
      if (!refreshToken) throw createUnauthorizedError("Refresh token not provided")
    }
    // await fastify.redis.set(`blacklist:${token}`, 'true', 'EX', Number(process.env.JWT_EXPIRES_IN));

    fastify.jwt.clearJwtCookies(reply);
    fastify.db.revokeToken(refreshToken)

    reply.send({
      data: { success: true },
      message: 'Logout successful',
    });
  });
}

const AuthBodySchema = Type.Intersect([
  Type.Object({
    password: PasswordTypebox
  }),
  Type.Union([
    Type.Object({
      username: UsernameTypebox,
      email: Type.Optional(Type.Never())
    }),
    Type.Object({
      email: EmailTypebox,
      username: Type.Optional(Type.Never())
    })
  ])
])

const LogoutBodySchema = Type.Object({
  refreshToken: Type.Optional(Type.String({ minLength: 1 }))
})
