import { pgPool } from '../config/database.js';
import { publishEvent } from '../config/rabbitmq.js';

export const getMyDocuments = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const result = await pgPool.query(
      `SELECT d.* FROM documents d
       INNER JOIN interns i ON i.id = d.intern_id
       WHERE i.user_id = $1
       ORDER BY d.uploaded_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getDocumentById = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await pgPool.query(
      `SELECT d.* FROM documents d
       INNER JOIN interns i ON i.id = d.intern_id
       WHERE d.id = $1 AND i.user_id = $2`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createDocument = async (req, res, next) => {
  const userId = req.user.id;
  const { type, url } = req.body;  // ✅ matches schema: type, url
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
      `INSERT INTO documents (intern_id, type, url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [internId, type, url]
    );
    const document = result.rows[0];

    await publishEvent('intern.document.uploaded', {
      documentId: document.id,
      internId,
      userId,
      type,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
};

export const updateDocument = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { type, url } = req.body;
  try {
    const result = await pgPool.query(
      `UPDATE documents SET
        type = COALESCE($2, type),
        url  = COALESCE($3, url)
       WHERE id = $1
       AND intern_id = (SELECT id FROM interns WHERE user_id = $4)
       RETURNING *`,
      [id, type, url, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await pgPool.query(
      `DELETE FROM documents
       WHERE id = $1
       AND intern_id = (SELECT id FROM interns WHERE user_id = $2)
       RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await publishEvent('intern.document.deleted', {
      documentId: id,
      userId,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
};