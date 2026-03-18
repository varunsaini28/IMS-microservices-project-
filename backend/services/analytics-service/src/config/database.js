import pkg from 'pg';
const { Pool } = pkg;
import { env } from './env.js';

export const pgPool = new Pool({
  connectionString: env.dbUrl,
  ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
});