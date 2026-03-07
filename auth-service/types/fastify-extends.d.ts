import { UserServiceClient } from '@/generated/user';
import { DbModule } from '@/modules/db-module';
import { EnvKeys } from '@/modules/env-module/types';
import { JwtService } from '@/utils/jwt-utils';

declare module 'fastify' {
  interface FastifyInstance {
    jwt: JwtService,
    config: EnvKeys,
    db: DbModule;
    userGrpc: UserServiceClient,
    // redis: RedisClientType,
  }
}
