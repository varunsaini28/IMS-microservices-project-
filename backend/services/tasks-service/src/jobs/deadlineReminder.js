import { Task } from '../models/Task.js';
import { publishEvent } from '../config/rabbitmq.js';

/** Run daily: find tasks due tomorrow that are not completed, publish reminder event per task. */
export const runDeadlineReminder = async () => {
  const now = new Date();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const tasks = await Task.find({
    dueDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
    status: { $ne: 'completed' },
  }).lean();

  for (const t of tasks) {
    await publishEvent('tasks.deadline.reminder', {
      taskId: t._id,
      title: t.title,
      assignedTo: t.assignedTo,
      assignedToEmail: t.assignedToEmail || null,
      dueDate: t.dueDate,
      timestamp: new Date().toISOString(),
    });
  }
  if (tasks.length > 0) {
    console.log(`[DeadlineReminder] Published ${tasks.length} reminder(s) for tomorrow`);
  }
};

/** Schedule daily at 9:00 AM (server time). */
export const scheduleDeadlineReminder = () => {
  const run = () => {
    runDeadlineReminder().catch((e) => console.error('[DeadlineReminder]', e.message));
  };
  run(); // run once on startup (optional)
  const msPerDay = 24 * 60 * 60 * 1000;
  setInterval(run, msPerDay);
};
