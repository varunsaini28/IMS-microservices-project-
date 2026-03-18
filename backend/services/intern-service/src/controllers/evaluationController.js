import { pgPool } from '../config/database.js';
import { publishEvent } from '../config/rabbitmq.js';

export const getMyEvaluations = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const result = await pgPool.query(
      `SELECT e.* FROM evaluations e
       INNER JOIN interns i ON i.id = e.intern_id
       WHERE i.user_id = $1
       ORDER BY e.evaluated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getEvaluationById = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await pgPool.query(
      `SELECT e.* FROM evaluations e
       INNER JOIN interns i ON i.id = e.intern_id
       WHERE e.id = $1 AND i.user_id = $2`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createEvaluation = async (req, res, next) => {
  const evaluatorId = req.user.id;
  const { intern_id, score, comments } = req.body; // ✅ matches schema: comments not feedback
  try {
    const result = await pgPool.query(
      `INSERT INTO evaluations (intern_id, evaluator_id, score, comments)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [intern_id, evaluatorId, score, comments]
    );
    const evaluation = result.rows[0];

    await publishEvent('intern.evaluation.created', {
      evaluationId: evaluation.id,
      internId: intern_id,
      evaluatorId,
      score,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(evaluation);
  } catch (err) {
    next(err);
  }
};

export const updateEvaluation = async (req, res, next) => {
  const { id } = req.params;
  const { score, comments } = req.body;
  try {
    const result = await pgPool.query(
      `UPDATE evaluations SET
        score    = COALESCE($2, score),
        comments = COALESCE($3, comments)
       WHERE id = $1
       RETURNING *`,
      [id, score, comments]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteEvaluation = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pgPool.query(
      'DELETE FROM evaluations WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    await publishEvent('intern.evaluation.deleted', {
      evaluationId: id,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Evaluation deleted successfully' });
  } catch (err) {
    next(err);
  }
};