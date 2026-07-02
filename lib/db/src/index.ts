import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "";
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

export const pool = new Pool({
  connectionString: connectionString || "postgres://dummy:dummy@localhost/dummy",
  ssl: isLocal || !connectionString ? false : { rejectUnauthorized: false }
});

// Catch idle client errors so they don't crash the Node.js process
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
