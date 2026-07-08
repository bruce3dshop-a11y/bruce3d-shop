import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Auto-migrate: add new columns if they don't exist (safe for existing deployments)
pool.query(`
  ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_full_name text,
    ADD COLUMN IF NOT EXISTS delivery_phone text,
    ADD COLUMN IF NOT EXISTS estimated_price text;
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url text,
    ADD COLUMN IF NOT EXISTS saved_city text,
    ADD COLUMN IF NOT EXISTS saved_address text,
    ADD COLUMN IF NOT EXISTS saved_index text,
    ADD COLUMN IF NOT EXISTS saved_full_name text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()
`).catch((err) => console.error("[db-migrate]", err));

export * from "./schema";
