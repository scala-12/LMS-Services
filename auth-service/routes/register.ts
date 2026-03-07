import { EmailTypebox, PasswordTypebox, RolesTypebox, UsernameTypebox } from '@/constants';
import { prepareString } from '@/utils/common';
import { createForbiddenError } from '@/utils/exceptions';
import { Static, Type } from '@sinclair/typebox';
import bcrypt from 'bcrypt';
import { DrizzleQueryError } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';

const RegisterSchema = Type.Object({
  username: Type.Optional(UsernameTypebox),
  email: EmailTypebox,
  password: PasswordTypebox,
  roles: RolesTypebox
})

const SALT_ROUNDS = 10

export default async function (fastify: FastifyInstance) {
  fastify.post<{
    Body: Static<typeof RegisterSchema>
  }>('/register', {
    schema: {
      body: RegisterSchema
    },
    preValidation: async ({ body }) => {
      if (body.email) {
        body.email.toLowerCase();
      }
      if (body.username) {
        body.username = prepareString(body.username)!.replaceAll("@", "_").toLocaleLowerCase()
      }
    },
  }, async ({ body }, { send }) => {
    const { username = null, roles, email, password } = body
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const userData = {
      email,
      username,
      passwordHash,
      roles
    };

    let user
    try {
      user = await fastify.db.createUser(userData);
    } catch (error) {
      if (!(error instanceof DrizzleQueryError)) throw error

      fastify.log.debug({ username, email, err: error.message }, "Duplicate users on register")

      throw createForbiddenError("Provided data not allowed for registration")
    }

    // TODO отправка события в kafka для user-service

    return send({
      data: { success: true, email: user?.email, roles: user?.roles },
      message: 'Register successful',
    });
  });
}
