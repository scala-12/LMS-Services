import { envProperties, envRequired } from '@/modules/env-module/constants'
import fastifyEnv from '@fastify/env'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

const schema = {
  type: 'object',
  required: envRequired,
  properties: envProperties
}

export default fp(async function (fastify: FastifyInstance) {
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true
  })
}, { name: 'env-plugin' })