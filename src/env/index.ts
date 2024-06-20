import { config } from 'dotenv'
import { z } from 'zod'

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' })
} else {
  config()
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  DATABASE_CLIENT: z.enum(['pg', 'sqlite3']).default('pg'),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3335),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  throw new Error(
    `😵🚨 Invalid environment variables! ${JSON.stringify(_env.error.issues)} 🚨😵`,
  )
}

export const env = _env.data
