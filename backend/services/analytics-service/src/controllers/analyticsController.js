import { pgPool } from '../config/database.js';

export const getInternProductivity = async (req, res, next) => {
  const { internId } = req.params;
  const { startDate, endDate } = req.query;
  try {
    const result = await pgPool.query(
      `SELECT date, tasks_completed, tasks_assigned, work_hours
       FROM intern_daily_metrics
       WHERE intern_id = $1
         AND date BETWEEN $2 AND $3
       ORDER BY date`,
      [internId, startDate, endDate]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getProjectProgress = async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const result = await pgPool.query(
      'SELECT * FROM project_metrics WHERE project_id = $1',
      [projectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data for project' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getOverallStats = async (req, res, next) => {
  try {
    const result = await pgPool.query(`
      SELECT
        AVG(tasks_completed) as avg_tasks_completed,
        SUM(tasks_completed) as total_tasks_completed,
        COUNT(DISTINCT intern_id) as active_interns
      FROM intern_daily_metrics
      WHERE date >= NOW() - INTERVAL '30 days'
    `);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getAttendanceSummary = async (req, res, next) => {
  const { internId } = req.params;
  const { month, year } = req.query;
  try {
    const result = await pgPool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'present') as present_days,
         COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
         COUNT(*) FILTER (WHERE status = 'half-day') as half_days,
         COUNT(*) as total_days
       FROM intern_daily_metrics
       WHERE intern_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR FROM date) = $3`,
      [internId, month, year]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getTaskCompletionRate = async (req, res, next) => {
  const { internId } = req.params;
  try {
    const result = await pgPool.query(
      `SELECT
         SUM(tasks_assigned) as total_assigned,
         SUM(tasks_completed) as total_completed,
         CASE
           WHEN SUM(tasks_assigned) > 0
           THEN ROUND(SUM(tasks_completed)::decimal / SUM(tasks_assigned) * 100, 2)
           ELSE 0
         END as completion_rate
       FROM intern_daily_metrics
       WHERE intern_id = $1`,
      [internId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getLeaveStats = async (req, res, next) => {
  const { internId } = req.params;
  try {
    const result = await pgPool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'approved') as approved_leaves,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected_leaves,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_leaves,
         COUNT(*) as total_leaves
       FROM intern_daily_metrics
       WHERE intern_id = $1`,
      [internId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};