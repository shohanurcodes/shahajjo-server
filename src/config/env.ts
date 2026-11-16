import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .default("mongodb://127.0.0.1:27017"),
  DB_NAME: z.string().min(1).default("sahajjo"),
  CLIENT_ORIGINS: z.string().default("http://localhost:3000"),
  BETTER_AUTH_JWKS_URL: z
    .url("BETTER_AUTH_JWKS_URL must be a valid URL")
    .default("http://localhost:3000/api/auth/jwks"),
  JWT_ISSUER: z.string().min(1).default("sahajjo-client"),
  JWT_AUDIENCE: z.string().min(1).default("sahajjo-api"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const clientOrigins = env.CLIENT_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
