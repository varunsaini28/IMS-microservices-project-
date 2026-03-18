import { pgPool } from '../config/database.js';
import { publishEvent } from '../config/rabbitmq.js';

// Get intern profile by user_id (from JWT)
export const getMyProfile = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const result = await pgPool.query(
      'SELECT * FROM interns WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create intern profile (admin/manager only? For now, any authenticated user can create)
export const createProfile = async (req, res, next) => {
  const userId = req.user.id;
  const { first_name, last_name, date_of_birth, phone, address } = req.body;
  try {
    const result = await pgPool.query(
      `INSERT INTO interns (user_id, first_name, last_name, date_of_birth, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, first_name, last_name, date_of_birth, phone, address]
    );
    const intern = result.rows[0];

    // Publish event
    await publishEvent('intern.intern.created', {
      internId: intern.id,
      userId: intern.user_id,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(intern);
  } catch (err) {
    next(err);
  }
};

// Update profile
export const updateProfile = async (req, res, next) => {
  const userId = req.user.id;
  const updates = req.body;
  const fields = Object.keys(updates).map((key, i) => `${key} = $${i+2}`).join(', ');
  const values = [userId, ...Object.values(updates)];
  try {
    const result = await pgPool.query(
      `UPDATE interns SET ${fields}, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};