import { Pool, type PoolConfig } from "pg"

// Production-grade connection pool configuration
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  min: 5, // Minimum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout connection attempts after 2s
  maxUses: 7500, // Close connections after 7500 uses
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
}

// Singleton connection pool
let pool: Pool | null = null

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig)

    // Handle pool errors gracefully
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err)
      process.exit(-1)
    })
  }

  return pool
}

// Graceful shutdown
export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
