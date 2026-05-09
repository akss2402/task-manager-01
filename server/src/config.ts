import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v !== "string") return v;
  const s = v.trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no" || s === "") return false;
  return v;
}, z.boolean());

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  CORS_ORIGIN: z.string().optional(),
  COOKIE_SECURE: booleanFromEnv.default(false)
});

export type AppConfig = z.infer<typeof configSchema>;

export function getConfig(): AppConfig {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    const errorMsg = `Invalid environment configuration: ${msg}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return parsed.data;
}

