import { CalendarDay } from '../models/CalendarDay.js';
import { publishEvent } from '../config/rabbitmq.js';

export const getCalendar = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'month and year required' });
    }
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0);
    end.setHours(23, 59, 59, 999);

    const days = await CalendarDay.find({
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    res.json(days);
  } catch (err) {
    next(err);
  }
};

export const setCalendarDay = async (req, res, next) => {
  try {
    const { date, type, label } = req.body;
    if (!date || !type) {
      return res.status(400).json({ error: 'date and type (working|holiday|non_working) required' });
    }
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const day = await CalendarDay.findOneAndUpdate(
      { date: d },
      { type, label: label || null },
      { upsert: true, new: true }
    );

    if (type === 'holiday' || type === 'non_working') {
      await publishEvent('calendar.day.updated', {
        date: d.toISOString(),
        type,
        label: label || type,
        timestamp: new Date().toISOString()
      });
    }
    res.json(day);
  } catch (err) {
    next(err);
  }
};
