import { pgPool } from '../config/database.js';
import { publishEvent } from '../config/rabbitmq.js';

export const getMySkills = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const result = await pgPool.query(
      `SELECT s.* FROM skills s
       INNER JOIN interns i ON i.id = s.intern_id
       WHERE i.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const createSkill = async (req, res, next) => {
  const userId = req.user.id;
  const { skill_name, proficiency_level } = req.body; // ✅ matches schema
  try {
    const internResult = await pgPool.query(
      'SELECT id FROM interns WHERE user_id = $1',
      [userId]
    );
    if (internResult.rows.length === 0) {
      return res.status(404).json({ error: 'Intern profile not found' });
    }
    const internId = internResult.rows[0].id;

    const result = await pgPool.query(
      `INSERT INTO skills (intern_id, skill_name, proficiency_level)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [internId, skill_name, proficiency_level]
    );

    await publishEvent('intern.skill.added', {
      skillId: result.rows[0].id,
      internId,
      userId,
      skillName: skill_name,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateSkill = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { skill_name, proficiency_level } = req.body;
  try {
    const result = await pgPool.query(
      `UPDATE skills SET
        skill_name        = COALESCE($2, skill_name),
        proficiency_level = COALESCE($3, proficiency_level)
       WHERE id = $1
       AND intern_id = (SELECT id FROM interns WHERE user_id = $4)
       RETURNING *`,
      [id, skill_name, proficiency_level, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteSkill = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await pgPool.query(
      `DELETE FROM skills
       WHERE id = $1
       AND intern_id = (SELECT id FROM interns WHERE user_id = $2)
       RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    await publishEvent('intern.skill.removed', {
      skillId: id,
      userId,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Skill deleted successfully' });
  } catch (err) {
    next(err);
  }
};