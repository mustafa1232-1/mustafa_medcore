const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  PORT: z.coerce.number().int().positive().default(8080),

  APP_NAME: z.string().default('medcore'),
  APP_VERSION: z.string().default('1.0.0'),

  CORS_ORIGINS: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  VERIFICATION_MODE: z.enum(['off', 'email', 'sms', 'both']).default('off')
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;
