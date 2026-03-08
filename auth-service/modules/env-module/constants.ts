import { EnvKey, EnvKeys, NodeEnvValue } from "./types";

export const envProperties = {
  [EnvKey.JWT_SECRET_KEY_BASE64]: {
    type: 'string',
    description: "JWT secret for develop coded by base64"
  },
  [EnvKey.JWT_PUBLIC_KEY_BASE64]: {
    type: 'string',
    description: "JWT public key for develop coded by base64"
  },
  [EnvKey.JWT_REFRESH_EXPIRES_IN]: {
    type: 'number',
    description: "JWT refresh token lifetime in seconds",
    default: 604800
  },
  [EnvKey.JWT_ACCESS_EXPIRES_IN]: {
    type: 'number',
    description: "JWT access token lifetime in seconds",
    default: 900
  },
  [EnvKey.NODE_ENV]: {
    type: 'string',
    enum: Object.values(NodeEnvValue),
    default: 'development'
  },
  [EnvKey.DATABASE_URL]: {
    type: 'string'
  },
  [EnvKey.PORT]: {
    type: 'number',
    description: "Application port"
  },
  [EnvKey.JWT_TOKEN_REFRESH_PATH]: {
    type: "string",
    description: "Path for token refresh",
    default: "/api/auth/refresh"
  }
} as const satisfies Record<EnvKey, unknown> satisfies Record<keyof EnvKeys, unknown>

export const envRequired: EnvKey[] = [
  EnvKey.DATABASE_URL,
  EnvKey.PORT
]