import { pgPool } from '../config/database.js';
import { publishEvent } from '../config/rabbitmq.js';

export const getMyCertificates = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const result = await pgPool.query(
      `SELECT c.* FROM certificates c
       INNER JOIN interns i ON i.id = c.intern_id
       WHERE i.user_id = $1
       ORDER BY c.issued_date DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getCertificateById = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await pgPool.query(
      `SELECT c.* FROM certificates c
       INNER JOIN interns i ON i.id = c.intern_id
       WHERE c.id = $1 AND i.user_id = $2`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createCertificate = async (req, res, next) => {
  const { intern_id, name, issuer, issued_date, expiry_date, file_url } = req.body; // ✅ matches schema
  try {
    const result = await pgPool.query(
      `INSERT INTO certificates (intern_id, name, issuer, issued_date, expiry_date, file_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [intern_id, name, issuer, issued_date, expiry_date, file_url]
    );
    const certificate = result.rows[0];

    await publishEvent('intern.certificate.issued', {
      certificateId: certificate.id,
      internId: intern_id,
      name,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(certificate);
  } catch (err) {
    next(err);
  }
};

export const updateCertificate = async (req, res, next) => {
  const { id } = req.params;
  const { name, issuer, issued_date, expiry_date, file_url } = req.body;
  try {
    const result = await pgPool.query(
      `UPDATE certificates SET
        name         = COALESCE($2, name),
        issuer       = COALESCE($3, issuer),
        issued_date  = COALESCE($4, issued_date),
        expiry_date  = COALESCE($5, expiry_date),
        file_url     = COALESCE($6, file_url)
       WHERE id = $1
       RETURNING *`,
      [id, name, issuer, issued_date, expiry_date, file_url]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteCertificate = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pgPool.query(
      'DELETE FROM certificates WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    await publishEvent('intern.certificate.revoked', {
      certificateId: id,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Certificate revoked successfully' });
  } catch (err) {
    next(err);
  }
};