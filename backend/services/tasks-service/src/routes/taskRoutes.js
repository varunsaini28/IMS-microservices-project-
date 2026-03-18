import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

import { createTask, getTasks, updateTaskStatus, getTaskStatsByIntern } from '../controllers/taskController.js';
import { checkIn, checkOut, getMyAttendance, getAllAttendance, updateAttendance, markAttendanceForIntern } from '../controllers/attendanceController.js';
import { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus, deleteLeave } from '../controllers/leaveController.js';
import { createWorkLog, getMyWorkLogs, getAllWorkLogs, updateWorkLog, deleteWorkLog } from '../controllers/workLogController.js';
import { getCalendar, setCalendarDay } from '../controllers/calendarController.js';

const router = express.Router();

router.use(authenticate);

// ─── Tasks (only admin/manager can create) ──────────────────
router.post('/',               requireRole('admin', 'manager'), createTask);
router.get('/',                getTasks);
router.get('/stats/by-intern', requireRole('admin', 'manager'), getTaskStatsByIntern);
router.patch('/:id/status',    updateTaskStatus);

// ─── Attendance: only admin/manager can mark; interns cannot checkin/checkout ──
router.post('/attendance/checkin',   requireRole('admin', 'manager'), checkIn);
router.post('/attendance/checkout', requireRole('admin', 'manager'), checkOut);
router.post('/attendance/mark',     requireRole('admin', 'manager'), markAttendanceForIntern);
router.get('/attendance/me',        getMyAttendance);
router.get('/attendance',           requireRole('admin', 'manager'), getAllAttendance);
router.put('/attendance/:id',        requireRole('admin', 'manager'), updateAttendance);

// ─── Calendar (all can read; admin/manager can set holiday/non-working) ──
router.get('/calendar',        getCalendar);
router.post('/calendar',       requireRole('admin', 'manager'), setCalendarDay);

// ─── Leave ─────────────────────────────────────────────────
router.post('/leaves',            applyLeave);
router.get('/leaves/me',          getMyLeaves);
router.get('/leaves',             requireRole('admin', 'manager'), getAllLeaves);
router.put('/leaves/:id/status',  requireRole('admin', 'manager'), updateLeaveStatus);
router.delete('/leaves/:id',      requireRole('admin', 'manager'), deleteLeave);

// ─── Work Logs ─────────────────────────────────────────────
router.post('/worklogs',      createWorkLog);
router.get('/worklogs/me',    getMyWorkLogs);
router.get('/worklogs',       requireRole('admin', 'manager'), getAllWorkLogs);
router.put('/worklogs/:id',   updateWorkLog);
router.delete('/worklogs/:id', deleteWorkLog);

export default router;
