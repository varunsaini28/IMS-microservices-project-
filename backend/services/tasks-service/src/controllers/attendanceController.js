import { Attendance } from '../models/Attendance.js';
import { WorkLog } from '../models/WorkLog.js';
import { Task } from '../models/Task.js';
import { publishEvent } from '../config/rabbitmq.js';

// ─── Helper: fill missing attendance for a given intern and date range ───
const fillMissingAttendance = async (internId, startDate, endDate) => {
  // startDate and endDate are Date objects (start inclusive, end exclusive)
  const records = await Attendance.find({
    internId,
    date: { $gte: startDate, $lt: endDate }
  }).select('date').lean();

  const existingDates = new Set(
    records.map(r => r.date.toISOString().split('T')[0])
  );

  const missingDates = [];
  let current = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (current < endDate) {
    const dateStr = current.toISOString().split('T')[0];
    // Only fill dates that are strictly in the past (not today)
    if (!existingDates.has(dateStr) && current < today) {
      missingDates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  if (missingDates.length > 0) {
    const absentRecords = missingDates.map(date => ({
      internId,
      date,
      status: 'absent'
    }));
    await Attendance.insertMany(absentRecords);
    console.log(`[Attendance] Auto‑filled ${absentRecords.length} absent records for intern ${internId}`);
  }
};

// ─── INTERN SELF‑MARK ATTENDANCE ────────────────────────────────────────
export const markSelfAttendance = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ internId, date: today });

    if (attendance) {
      return res.json(attendance); // already marked
    }

    attendance = new Attendance({
      internId,
      date: today,
      checkIn: new Date(),
      status: 'present'
    });
    await attendance.save();

    await publishEvent('tasks.attendance.selfMarked', {
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

// ─── Get my attendance (intern) ─────────────────────────────────────────
export const getMyAttendance = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const { month, year } = req.query;

    let start, end;
    if (month && year) {
      // First day of the month
      start = new Date(year, month - 1, 1);
      // First day of next month
      end = new Date(year, month, 1);
    } else {
      // Default: last 30 days (excluding today)
      end = new Date();
      end.setHours(0, 0, 0, 0); // today at midnight
      start = new Date(end);
      start.setDate(start.getDate() - 30);
    }

    // Auto‑fill missing past dates in this range
    await fillMissingAttendance(internId, start, end);

    const filter = { internId, date: { $gte: start, $lt: end } };
    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    next(err);
  }
};

// ─── Get all attendance (admin/manager) ─────────────────────────────────
export const getAllAttendance = async (req, res, next) => {
  try {
    const { internId, month, year } = req.query;
    const filter = {};

    let start, end;
    if (month && year) {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 1);
    } else {
      // Default to last 30 days
      end = new Date();
      end.setHours(0, 0, 0, 0);
      start = new Date(end);
      start.setDate(start.getDate() - 30);
    }

    // If a specific intern is selected, auto‑fill their missing dates
    if (internId) {
      filter.internId = internId;
      await fillMissingAttendance(internId, start, end);
    } else {
      // No intern filter – we don't auto‑fill (would be too heavy)
      // Admin can still see only the records that exist.
      // If they need absent records for all, they can filter by internId.
    }

    filter.date = { $gte: start, $lt: end };
    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    next(err);
  }
};

// ─── Check in (admin/manager only) ──────────────────────────────────────
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

// ─── Check out (admin/manager only) ─────────────────────────────────────
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

// ─── Update attendance (admin only) ─────────────────────────────────────
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

// ─── Admin/manager marks attendance for an intern (with work check) ─────
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

    // Check: intern must have submitted work or completed a task on this date
    const [workLog, completedTask] = await Promise.all([
      WorkLog.findOne({
        internId,
        workLink: { $exists: true, $ne: '' },
        loggedAt: { $gte: d, $lt: nextDay }
      }),
      Task.findOne({
        assignedTo: internId,
        status: 'completed',
        completedAt: { $gte: d, $lt: nextDay }
      })
    ]);

    if (!workLog && !completedTask) {
      return res.status(403).json({
        error: 'Cannot mark attendance: intern has not submitted work or completed a task for this day'
      });
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