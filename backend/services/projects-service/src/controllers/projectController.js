import { pgPool } from '../config/database.js';
import { publishEvent } from '../config/rabbitmq.js';

// GET all projects – everyone sees all projects (no role distinction)
export const getProjects = async (req, res, next) => {
  try {
    const { status, manager_id } = req.query;
    let query = 'SELECT * FROM projects';
    const values = [];
    const conditions = [];

    if (status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (manager_id) {
      conditions.push(`manager_id = $${values.length + 1}`);
      values.push(manager_id);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await pgPool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Get single project by ID
export const getProjectById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pgPool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create project – only admin allowed
export const createProject = async (req, res, next) => {
  // Only admin can create – already enforced by route
  const { name, description, start_date, end_date, status } = req.body;
  const managerId = req.user.id; // use admin's ID as manager
  const projectStatus = status || 'planning';

  try {
    const result = await pgPool.query(
      `INSERT INTO projects (name, description, start_date, end_date, manager_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, start_date, end_date, managerId, projectStatus]
    );
    const project = result.rows[0];

    await publishEvent('projects.project.created', {
      projectId: project.id,
      name: project.name,
      managerId: project.manager_id,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

// Update project – only admin
export const updateProject = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  const allowed = ['name', 'description', 'start_date', 'end_date', 'status'];
  // manager_id is not allowed to be updated (stays as the creator)
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  if (Object.keys(filtered).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const fields = Object.keys(filtered)
    .map((key, i) => `${key} = $${i + 2}`)
    .join(', ');
  const values = [id, ...Object.values(filtered)];

  try {
    const result = await pgPool.query(
      `UPDATE projects SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await publishEvent('projects.project.updated', {
      projectId: result.rows[0].id,
      changes: filtered,
      timestamp: new Date().toISOString()
    });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Delete project – only admin
export const deleteProject = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pgPool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── Optional: Intern assignment functions (keep if needed for other features) ───
export const assignIntern = async (req, res, next) => {
  const { projectId, internId } = req.params;
  try {
    const projectCheck = await pgPool.query('SELECT id, name FROM projects WHERE id = $1', [projectId]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const projectName = projectCheck.rows[0].name;

    await pgPool.query(
      'INSERT INTO project_interns (project_id, intern_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [projectId, internId]
    );

    await publishEvent('projects.intern.assigned', {
      projectId,
      internId,
      projectName,
      internEmail: req.body.internEmail || null,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Intern assigned successfully' });
  } catch (err) {
    next(err);
  }
};

export const bulkAssignInterns = async (req, res, next) => {
  const { projectId } = req.params;
  const internIds = req.body?.internIds;
  const batchId = req.body?.batchId || req.headers['idempotency-key'] || null;

  if (!Array.isArray(internIds) || internIds.length === 0) {
    return res.status(400).json({ error: 'internIds must be a non-empty array' });
  }
  if (internIds.length > 50_000) {
    return res.status(413).json({ error: 'Too many interns in one request (max 50000)' });
  }

  const ids = [...new Set(internIds.map((x) => String(x).trim()).filter(Boolean))];
  if (ids.length === 0) {
    return res.status(400).json({ error: 'No valid internIds provided' });
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    const projectCheck = await client.query('SELECT id, name FROM projects WHERE id = $1', [projectId]);
    if (projectCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }

    const insert = await client.query(
      `INSERT INTO project_interns (project_id, intern_id)
       SELECT $1, x.intern_id
       FROM unnest($2::text[]) AS x(intern_id)
       ON CONFLICT DO NOTHING`,
      [projectId, ids]
    );

    await client.query('COMMIT');

    await publishEvent('projects.interns.bulkAssigned', {
      batchId: batchId ? String(batchId) : null,
      projectId,
      projectName: projectCheck.rows[0].name,
      internsCount: ids.length,
      insertedCount: insert.rowCount ?? null,
      timestamp: new Date().toISOString(),
    });

    return res.status(202).json({
      projectId,
      internsCount: ids.length,
      insertedCount: insert.rowCount ?? 0,
      batchId: batchId ? String(batchId) : null,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    next(err);
  } finally {
    client.release();
  }
};

export const removeIntern = async (req, res, next) => {
  const { projectId, internId } = req.params;
  try {
    const result = await pgPool.query(
      'DELETE FROM project_interns WHERE project_id = $1 AND intern_id = $2 RETURNING *',
      [projectId, internId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ message: 'Intern removed from project' });
  } catch (err) {
    next(err);
  }
};

export const getProjectInterns = async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const result = await pgPool.query(
      'SELECT intern_id, assigned_at FROM project_interns WHERE project_id = $1',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Update project status – only admin (can be changed later if needed)
export const updateProjectStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['planning', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: planning, in_progress, completed' });
  }

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update project status' });
    }

    const result = await pgPool.query(
      'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};