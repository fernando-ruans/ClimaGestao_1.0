import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Get database connection string from environment variable
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/sam_climatiza';

// Create connection pool
const pool = new Pool({ connectionString });

// Add stream end handler to support PDF generation
const originalEnd = pool.end.bind(pool);
pool.end = async function() {
  // Wait for any pending operations
  await new Promise(resolve => setTimeout(resolve, 100));
  return originalEnd();
};

export const db = drizzle(pool, { schema });
export { pool };
