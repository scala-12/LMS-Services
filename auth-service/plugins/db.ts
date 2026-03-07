import { DbModule } from "@/modules/db-module";
import { EnvKey } from "@/modules/env-module/types";
import fp from "fastify-plugin";

export default fp(async (fastify) => {
  fastify.decorate("db", new DbModule(
    fastify.log.child({ service: 'DbModule' }),
    fastify.config[EnvKey.DATABASE_URL],
    fastify.config[EnvKey.JWT_REFRESH_EXPIRES_IN]
  ));
}, { dependencies: ['env-plugin'] });