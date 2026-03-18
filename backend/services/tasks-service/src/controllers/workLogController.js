import { WorkLog } from '../models/WorkLog.js';
import { Task } from '../models/Task.js';
import { publishEvent } from '../config/rabbitmq.js';

// Log work hours for a task, or submit daily work (link). Interns only.
export const createWorkLog = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const { taskId, hours, description, workLink } = req.body;

    if (workLink) {
      // Daily work submission (e.g. GitHub link) – taskId optional
      const workLog = new WorkLog({ internId, workLink, description: description || 'Daily work', hours: hours || 0, taskId: taskId || undefined });
      await workLog.save();
      await publishEvent('tasks.worklog.created', { workLogId: workLog._id, internId, workLink, timestamp: new Date().toISOString() });
      return res.status(201).json(workLog);
    }

    if (!taskId) {
      return res.status(400).json({ error: 'taskId required when not submitting workLink' });
    }
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const workLog = new WorkLog({
      taskId,
      internId,
      hours: hours ?? 0,
      description
    });
    await workLog.save();

    await publishEvent('tasks.worklog.created', {
      workLogId: workLog._id,
      taskId,
      internId,
      hours: workLog.hours,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(workLog);
  } catch (err) {
    next(err);
  }
};

// Get my work logs
export const getMyWorkLogs = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const { taskId } = req.query;

    const filter = { internId };
    if (taskId) filter.taskId = taskId;

    const logs = await WorkLog.find(filter)
      .populate('taskId', 'title status priority')
      .sort({ loggedAt: -1 });

    res.json(logs);
  } catch (err) {
    next(err);
  }
};

// Get all work logs (admin/manager)
export const getAllWorkLogs = async (req, res, next) => {
  try {
    const { internId, taskId } = req.query;
    const filter = {};
    if (internId) filter.internId = internId;
    if (taskId) filter.taskId = taskId;

    const logs = await WorkLog.find(filter)
      .populate('taskId', 'title status priority')
      .sort({ loggedAt: -1 });

    res.json(logs);
  } catch (err) {
    next(err);
  }
};

// Update work log
export const updateWorkLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const internId = req.user.id;
    const { hours, description, workLink } = req.body;

    const update = { hours, description };
    if (workLink !== undefined) update.workLink = workLink;
    const log = await WorkLog.findOneAndUpdate(
      { _id: id, internId },
      update,
      { returnDocument: 'after' }
    );

    if (!log) {
      return res.status(404).json({ error: 'Work log not found' });
    }

    res.json(log);
  } catch (err) {
    next(err);
  }
};

// Delete work log
export const deleteWorkLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const internId = req.user.id;

    const log = await WorkLog.findOneAndDelete({ _id: id, internId });
    if (!log) {
      return res.status(404).json({ error: 'Work log not found' });
    }

    res.json({ message: 'Work log deleted' });
  } catch (err) {
    next(err);
  }
};