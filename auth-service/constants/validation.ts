import { UserRole } from "@/types/users"
import { Type } from "@sinclair/typebox"

export const EmailTypebox = Type.String({ format: 'email' })
export const PasswordTypebox = Type.String({ minLength: 6 })
export const RolesTypebox = Type.Array(Type.Enum(UserRole), { minItems: 1, uniqueItems: true })
export const UsernameTypebox = Type.String({ minLength: 4 })