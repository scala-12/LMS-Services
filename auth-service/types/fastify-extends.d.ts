import { UserServiceClient } from '@/generated/user';
import { DbModule } from '@/modules/db-module';
import { EnvKeys } from '@/modules/env-module/types';
import { JwtModule } from '@/modules/jwt-module';

declare module 'fastify' {
  interface FastifyInstance {
    jwt: JwtModule,
    config: EnvKeys,
    db: DbModule;
    userGrpc: UserServiceClient,
    // redis: RedisClientType,
  }
}
