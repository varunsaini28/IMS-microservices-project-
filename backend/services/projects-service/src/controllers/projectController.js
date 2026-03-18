import { pgPool } from '../config/database.js';
import { publishEvent } from '../config/rabbitmq.js';

// Get all projects (with optional filters). Interns see only assigned projects.
export const getProjects = async (req, res, next) => {
  try {
    const { status, manager_id } = req.query;
    if (req.user.role === 'intern') {
      const result = await pgPool.query(
        `SELECT p.* FROM projects p
         INNER JOIN project_interns pi ON pi.project_id = p.id AND pi.intern_id = $1
         WHERE ($2::text IS NULL OR p.status = $2) AND ($3::text IS NULL OR p.manager_id = $3)
         ORDER BY p.created_at DESC`,
        [req.user.id, status || null, manager_id || null]
      );
      return res.json(result.rows);
    }
    let query = 'SELECT * FROM projects';
    const values = [];
    const conditions = [];
    if (status) { conditions.push(`status = $${values.length + 1}`); values.push(status); }
    if (manager_id) { conditions.push(`manager_id = $${values.length + 1}`); values.push(manager_id); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
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

// Create project (only manager/admin)
export const createProject = async (req, res, next) => {
  const { name, description, start_date, end_date, manager_id, status } = req.body;
  const actualManagerId = req.user.role === 'admin' ? manager_id : req.user.id;
  const projectStatus = status || 'planning';

  try {
    const result = await pgPool.query(
      `INSERT INTO projects (name, description, start_date, end_date, manager_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, start_date, end_date, actualManagerId, projectStatus]
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
    if (err.code === '42703') {
      // column "status" does not exist - try without it
      const result = await pgPool.query(
        `INSERT INTO projects (name, description, start_date, end_date, manager_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, description, start_date, end_date, actualManagerId]
      );
      const project = result.rows[0];
      await publishEvent('projects.project.created', { projectId: project.id, name: project.name, managerId: project.manager_id, timestamp: new Date().toISOString() });
      return res.status(201).json(project);
    }
    next(err);
  }
};

// Update project (admin/manager full update; intern can only update status via updateProjectStatus)
export const updateProject = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  const allowed = ['name', 'description', 'start_date', 'end_date', 'manager_id', 'status'];
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  if (Object.keys(filtered).length === 0) return res.status(400).json({ error: 'No valid fields to update' });
  const fields = Object.keys(filtered).map((key, i) => `${key} = $${i + 2}`).join(', ');
  const values = [id, ...Object.values(filtered)];

  try {
    const result = await pgPool.query(
      `UPDATE projects SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await publishEvent('projects.project.updated', { projectId: result.rows[0].id, changes: filtered, timestamp: new Date().toISOString() });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Delete project (soft delete? For now hard delete)
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

// Assign intern to project
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

// Remove intern from project
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

// Get interns assigned to a project
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

// Update project status (intern can update only if assigned; admin/manager always)
export const updateProjectStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['planning', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: planning, in_progress, completed' });
  }
  try {
    if (req.user.role === 'intern') {
      const assigned = await pgPool.query(
        'SELECT 1 FROM project_interns WHERE project_id = $1 AND intern_id = $2',
        [id, req.user.id]
      );
      if (assigned.rows.length === 0) {
        return res.status(403).json({ error: 'You are not assigned to this project' });
      }
    }
    const result = await pgPool.query(
      'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};