import { readFileSync } from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../../../infrastruture/.env.example' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/intern_management',
  ssl: false
});

const sql = readFileSync('evaluations_migration.sql', 'utf8');

try {
  await pool.query(sql);
  console.log('Evaluations table created successfully');
} catch (err) {
  console.error('Migration failed:', err);
} finally {
  await pool.end();
}