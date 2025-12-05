// lib/db.ts
import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Make sure we reuse the pool in dev (Next hot reload)
declare global {
  // eslint-disable-next-line no-var
  var neonPool: Pool | undefined;
}

const pool = global.neonPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (!global.neonPool) {
  global.neonPool = pool;
}

export { pool };
