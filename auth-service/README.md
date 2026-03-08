# Auth service

## Modules

All modules declared in `/types/fastify-extends.d.ts`.
1. Database (`DbModule`) with `Postgresql` via `drizzle`  
  Store user's credentials and refresh tokens.
1. Enviroments for plugin `@fastify/env`  
  Use this module for work with enviroments via fastify: `fastify.config[EnvKey.SOME_VARIABLE]`.  
  For edit variables list see `EnvKey`.
1. JWT (`JwtModule`)  
  Used for set cookies with access and refresh tokens and extract tokens data.

## Plugins

1. Cookies (`@fastify/cookie`)  
  Used for work with jwt tokens.
1. Rate limit (`@fastify/rate-limit`)  
  Used to limit the number of requests within a specified time window to protect from overload, spam, and brute-force attacks.
