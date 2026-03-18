import { Task } from '../models/Task.js';
import { publishEvent } from '../config/rabbitmq.js';

export const createTask = async (req, res, next) => {
  try {
    const taskData = { ...req.body, assignedBy: req.user.id };
    if (req.body.assignedToEmail) taskData.assignedToEmail = req.body.assignedToEmail;
    const task = new Task(taskData);
    await task.save();

    await publishEvent('tasks.task.assigned', {
      taskId: task._id,
      title: task.title,
      assignedTo: task.assignedTo,
      assignedToEmail: req.body.assignedToEmail ?? null, // ✅ pass email if provided
      assignedBy: task.assignedBy,
      priority: task.priority,
      dueDate: task.dueDate,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'intern') {
      filter.assignedTo = req.user.id;
    }
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

/** Admin/manager: task counts per intern (total and completed). */
export const getTaskStatsByIntern = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $group: { _id: '$assignedTo', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(stats.map(s => ({ internId: s._id, totalTasks: s.total, completedTasks: s.completed })));
  } catch (err) {
    next(err);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, completedByEmail } = req.body;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }
    await task.save();

    if (status === 'completed') {
      await publishEvent('tasks.task.completed', {
        taskId: task._id,
        title: task.title,
        completedBy: task.assignedTo,
        completedByEmail: completedByEmail ?? null, // ✅ pass email if provided
        completedAt: task.completedAt,
        timestamp: new Date().toISOString()
      });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};
