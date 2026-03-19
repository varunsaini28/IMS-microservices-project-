import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import * as projectController from '../controllers/projectController.js';

const router = express.Router();

router.use(authenticate);

// Project CRUD – only admin can create/update/delete
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', requireRole('admin'), projectController.createProject);
router.put('/:id', requireRole('admin'), projectController.updateProject);
router.patch('/:id/status', requireRole('admin'), projectController.updateProjectStatus);
router.delete('/:id', requireRole('admin'), projectController.deleteProject);

// Intern assignments (optional – admin only)
router.post('/:projectId/interns/:internId', requireRole('admin'), projectController.assignIntern);
router.post('/:projectId/interns/bulk', requireRole('admin'), projectController.bulkAssignInterns);
router.delete('/:projectId/interns/:internId', requireRole('admin'), projectController.removeIntern);
router.get('/:projectId/interns', projectController.getProjectInterns);

export default router;