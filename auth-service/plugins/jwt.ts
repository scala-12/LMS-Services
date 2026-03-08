import { EnvKey, NodeEnvValue } from '@/modules/env-module/types';
import { JwtModule } from '@/modules/jwt-module';
import fp from 'fastify-plugin';

export default fp(async function (fastify) {
  const keys: { public?: string; secret?: string } = {}
  if (fastify.config[EnvKey.JWT_SECRET_KEY_BASE64]) {
    keys.secret = Buffer
      .from(fastify.config[EnvKey.JWT_SECRET_KEY_BASE64], "base64")
      .toString("utf8");
    keys.public = Buffer
      .from(fastify.config[EnvKey.JWT_PUBLIC_KEY_BASE64], "base64")
      .toString("utf8");
  }

  if (!keys.public || !keys.secret) throw new Error("JWT keys not provided")

  const jwtModule = new JwtModule(
    fastify.log.child({ service: 'JwtModule' }),
    {
      accessExpires: fastify.config.JWT_ACCESS_EXPIRES_IN,
      refreshExpires: fastify.config.JWT_REFRESH_EXPIRES_IN,
      secretKey: keys.secret,
      publicKey: keys.public,
      tokenRefreshPath: fastify.config[EnvKey.JWT_TOKEN_REFRESH_PATH]
    },
    fastify.config.NODE_ENV !== NodeEnvValue.LOCAL
  );

  fastify.decorate('jwt', jwtModule);
  fastify.log.debug('Jwt module decorated');
}, {
  name: 'jwt-module',
  dependencies: ['env-plugin']
});
