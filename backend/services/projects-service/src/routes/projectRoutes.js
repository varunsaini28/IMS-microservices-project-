import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import * as projectController from '../controllers/projectController.js';

const router = express.Router();

router.use(authenticate);

// Project CRUD
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', requireRole('admin', 'manager'), projectController.createProject);
router.put('/:id', requireRole('admin', 'manager'), projectController.updateProject);
router.patch('/:id/status', projectController.updateProjectStatus);
router.delete('/:id', requireRole('admin', 'manager'), projectController.deleteProject);

// Intern assignments (admin/manager only)
router.post('/:projectId/interns/:internId', requireRole('admin', 'manager'), projectController.assignIntern);
router.delete('/:projectId/interns/:internId', requireRole('admin', 'manager'), projectController.removeIntern);
router.get('/:projectId/interns', projectController.getProjectInterns);

export default router;