import { EmailTypebox, PasswordTypebox, UsernameTypebox } from '@/constants';
import { Credential } from '@/modules/db-module/types';
import { TokenType } from '@/modules/jwt-module/types';
import { createUnauthorizedError } from '@/utils/exceptions';
import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default async function (fastify: FastifyInstance) {
  const prepareAuthBody = async (req: FastifyRequest<{
    Body: Static<typeof AuthBodySchema>;
  }>
  ) => {
    if (req.body.email) {
      req.body.email = req.body.email?.toLowerCase();
    }
    if (req.body.username) {
      req.body.username = req.body.username?.toLowerCase()
    }
  }

  const signInUser = async (
    body: Static<typeof AuthBodySchema>,
    callbackBeforeSend: (user: Credential) => { [TokenType.ACCESS]: string;[TokenType.REFRESH]?: string },
    reply: FastifyReply
  ) => {
    const { username, email, password } = body;

    const { error, user } = await fastify.db.checkUserLogin(password, body)
    if (error || !user) throw createUnauthorizedError(error ?? "Auth error");

    const data = callbackBeforeSend(user)

    fastify.log.debug({ username, email }, "Login successful");

    return reply.send({
      data: { ...data, success: true },
      message: 'Login successful',
    });
  }

  fastify.post<{
    Body: Static<typeof AuthBodySchema>
  }>('/login', {
    schema: {
      body: AuthBodySchema
    },
    preValidation: [prepareAuthBody],
  }, async ({ body }, reply) => {
    const callback = (user: Credential) => {
      const tokens = fastify.jwt.setJwtCookies(reply, user)
      fastify.db.saveToken(user, tokens[TokenType.REFRESH])
      return tokens
    }
    return signInUser(body, callback, reply)
  });

  fastify.post<{
    Body: Static<typeof AuthBodySchema>
  }>('/login-short', {
    schema: {
      body: AuthBodySchema
    },
    preValidation: [prepareAuthBody]
  }, async ({ body }, reply) => {
    const callback = (user: Credential) => {
      const accessToken = fastify.jwt.createAccessShortToken(user)
      return { [TokenType.ACCESS]: accessToken }
    }
    return signInUser(body, callback, reply)
  })

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
