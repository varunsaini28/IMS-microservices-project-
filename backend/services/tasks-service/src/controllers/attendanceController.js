import { Attendance } from '../models/Attendance.js';
import { WorkLog } from '../models/WorkLog.js';
import { Task } from '../models/Task.js';
import { publishEvent } from '../config/rabbitmq.js';

// Check in
export const checkIn = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({ internId, date: today });
    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const attendance = new Attendance({
      internId,
      date: today,
      checkIn: new Date(),
      status: 'present'
    });
    await attendance.save();

    await publishEvent('tasks.attendance.checkin', {
      internId,
      date: today,
      checkIn: attendance.checkIn,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(attendance);
  } catch (err) {
    next(err);
  }
};

// Check out
export const checkOut = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ internId, date: today });
    if (!attendance) {
      return res.status(404).json({ error: 'No check-in found for today' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    await publishEvent('tasks.attendance.checkout', {
      internId,
      date: today,
      checkOut: attendance.checkOut,
      timestamp: new Date().toISOString()
    });

    res.json(attendance);
  } catch (err) {
    next(err);
  }
};

// Get my attendance
export const getMyAttendance = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const { month, year } = req.query;

    const filter = { internId };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    next(err);
  }
};

// Get all attendance (admin/manager)
export const getAllAttendance = async (req, res, next) => {
  try {
    const { internId, month, year } = req.query;
    const filter = {};

    if (internId) filter.internId = internId;

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    next(err);
  }
};

// Update attendance (admin only)
export const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, checkIn, checkOut } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      { status, checkIn, checkOut },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (err) {
    next(err);
  }
};

// Admin/manager marks attendance for an intern for a date. Only allowed if intern has submitted work that day.
export const markAttendanceForIntern = async (req, res, next) => {
  try {
    const { internId, date, status } = req.body;
    if (!internId || !date) {
      return res.status(400).json({ error: 'internId and date required' });
    }
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check: intern must have submitted work (worklog with workLink) or completed a task on this date
    const [workLog, completedTask] = await Promise.all([
      WorkLog.findOne({ internId, workLink: { $exists: true, $ne: '' }, loggedAt: { $gte: d, $lt: nextDay } }),
      Task.findOne({ assignedTo: internId, status: 'completed', completedAt: { $gte: d, $lt: nextDay } })
    ]);
    if (!workLog && !completedTask) {
      return res.status(403).json({ error: 'Cannot mark attendance: intern has not submitted work or completed a task for this day' });
    }

    let attendance = await Attendance.findOne({ internId, date: d });
    if (attendance) {
      attendance.status = status || 'present';
      await attendance.save();
    } else {
      attendance = new Attendance({ internId, date: d, status: status || 'present' });
      await attendance.save();
    }
    res.json(attendance);
  } catch (err) {
    next(err);
  }
};