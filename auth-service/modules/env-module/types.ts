export enum EnvKey {
  JWT_SECRET_KEY_BASE64 = 'JWT_SECRET_KEY_BASE64',
  JWT_PUBLIC_KEY_BASE64 = 'JWT_PUBLIC_KEY_BASE64',
  JWT_REFRESH_EXPIRES_IN = 'JWT_REFRESH_EXPIRES_IN',
  JWT_ACCESS_EXPIRES_IN = 'JWT_ACCESS_EXPIRES_IN',
  JWT_TOKEN_REFRESH_PATH = "JWT_TOKEN_REFRESH_PATH",
  NODE_ENV = 'NODE_ENV',
  DATABASE_URL = 'DATABASE_URL',
  PORT = "PORT"
}

export type EnvKeys = {
  [EnvKey.JWT_SECRET_KEY_BASE64]: string,
  [EnvKey.JWT_PUBLIC_KEY_BASE64]: string,
  [EnvKey.JWT_REFRESH_EXPIRES_IN]: number,
  [EnvKey.JWT_ACCESS_EXPIRES_IN]: number,
  [EnvKey.NODE_ENV]: NodeEnvValue
  [EnvKey.DATABASE_URL]: string
  [EnvKey.PORT]: number,
  [EnvKey.JWT_TOKEN_REFRESH_PATH]: string
}

export enum NodeEnvValue {
  LOCAL = "local",
  DEVELOPMENT = "development",
  PRODUCTION = "production"
}