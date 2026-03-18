import pkg from 'pg'
const {Pool} =pkg;
import {env} from './env.js'

export const pgPool=new Pool({
    connectionString:env.dbUrl,
    ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pgPool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error", err);
});