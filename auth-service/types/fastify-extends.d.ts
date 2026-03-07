import { UserServiceClient } from '@/generated/user';
import { EnvKeys } from '@/modules/env-module/types';
import { JwtService } from '@/utils/jwt-utils';

declare module 'fastify' {
  interface FastifyInstance {
    jwt: JwtService,
    config: EnvKeys,
    userGrpc: UserServiceClient,
    // redis: RedisClientType,
  }
}
