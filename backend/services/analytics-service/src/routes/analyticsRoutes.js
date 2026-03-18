import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

router.use(authenticate);

// ─── Intern Analytics ──────────────────────────────────────
router.get('/intern/:internId/productivity',    analyticsController.getInternProductivity);
router.get('/intern/:internId/attendance',      analyticsController.getAttendanceSummary);
router.get('/intern/:internId/task-completion', analyticsController.getTaskCompletionRate);
router.get('/intern/:internId/leaves',          analyticsController.getLeaveStats);

// ─── Project Analytics ─────────────────────────────────────
router.get('/project/:projectId/progress',     analyticsController.getProjectProgress);

// ─── Overall Stats ─────────────────────────────────────────
router.get('/overall',                         analyticsController.getOverallStats);

export default router;

