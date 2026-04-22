import { z } from "zod";

/**
 * Server-side environment schema.
 * All provider-specific config lives here so the provider stays configuration-free.
 * NEVER import this module from client components.
 */
const EnvSchema = z.object({
  POLLINATIONS_BASE_URL: z.string().url().default("https://image.pollinations.ai/prompt"),
  POLLINATIONS_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Fail fast in production; in dev we log and fall back to defaults.
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment: ${message}`);
  }
  cached = parsed.data;
  return cached;
}
