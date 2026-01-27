import { z } from 'zod';

// Client-side env vars (always validated — available in browser)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .startsWith('https://', 'NEXT_PUBLIC_SUPABASE_URL must use HTTPS'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be at least 20 characters'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL'),
});

// Server-side env vars (validated only on server)
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY must be at least 20 characters'),
  CRON_SECRET: z
    .string()
    .min(16, 'CRON_SECRET must be at least 16 characters')
    .optional(),
  NOWPAYMENTS_API_KEY: z.string().min(1).optional(),
  NOWPAYMENTS_IPN_SECRET: z.string().min(1).optional(),
  FRESH_START_CODE: z.string().min(1).optional(),
});

type ClientEnv = z.infer<typeof clientEnvSchema>;

function validateEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  // Validate server env only on server side
  if (typeof window === 'undefined') {
    const serverResult = serverEnvSchema.safeParse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      CRON_SECRET: process.env.CRON_SECRET,
      NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY,
      NOWPAYMENTS_IPN_SECRET: process.env.NOWPAYMENTS_IPN_SECRET,
      FRESH_START_CODE: process.env.FRESH_START_CODE,
    });

    if (!serverResult.success) {
      const errors = serverResult.error.flatten().fieldErrors;
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
        .join('\n');

      console.error(`Server environment validation warnings:\n${errorMessages}`);
    }
  }

  return result.data;
}

export const env = validateEnv();
