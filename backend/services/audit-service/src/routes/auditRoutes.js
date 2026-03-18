import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as auditController from '../controllers/auditController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

router.get('/', auditController.getAuditLogs);
router.get('/:id', auditController.getAuditLogById);

export default router;