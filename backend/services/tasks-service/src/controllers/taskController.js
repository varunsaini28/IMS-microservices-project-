import { Task } from '../models/Task.js';
import { publishEvent } from '../config/rabbitmq.js';
import crypto from 'crypto';

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

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const stableTaskHash = (task) => {
  const payload = {
    title: task.title ?? '',
    description: task.description ?? '',
    projectId: task.projectId ?? '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : '',
    priority: task.priority ?? 'medium',
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
};

/**
 * Bulk assign tasks to many interns in one request.
 * Payload:
 * {
 *   batchId?: string,
 *   interns: [{ id: string, email?: string }],
 *   tasks: [{ title, description?, projectId?, dueDate?, priority? }]
 * }
 *
 * - Uses idempotent assignmentKey to prevent duplicates on retries.
 * - Uses batch insert (insertMany) in chunks for scale.
 * - Publishes ONE event for monitoring/auditing (not per-assignment).
 */
export const bulkAssignTasks = async (req, res, next) => {
  try {
    const { interns, tasks, batchId } = req.body ?? {};

    if (!Array.isArray(interns) || interns.length === 0) {
      return res.status(400).json({ error: 'interns must be a non-empty array' });
    }
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'tasks must be a non-empty array' });
    }
    if (interns.length > 10_000) {
      return res.status(413).json({ error: 'Too many interns in one request (max 10000)' });
    }
    if (tasks.length > 200) {
      return res.status(413).json({ error: 'Too many tasks in one request (max 200)' });
    }

    const normalizedInterns = interns
      .map((i) => ({ id: String(i?.id ?? '').trim(), email: i?.email ? String(i.email).trim() : undefined }))
      .filter((i) => i.id);
    if (normalizedInterns.length === 0) return res.status(400).json({ error: 'No valid intern ids provided' });

    const normalizedTasks = tasks
      .map((t) => ({
        title: String(t?.title ?? '').trim(),
        description: t?.description ? String(t.description) : undefined,
        projectId: t?.projectId ? String(t.projectId) : undefined,
        dueDate: t?.dueDate ? new Date(t.dueDate) : undefined,
        priority: t?.priority ?? 'medium',
      }))
      .filter((t) => t.title.length >= 3);
    if (normalizedTasks.length === 0) return res.status(400).json({ error: 'No valid tasks provided (title min 3 chars)' });

    const effectiveBatchId =
      (batchId && String(batchId).trim()) ||
      req.headers['idempotency-key'] ||
      crypto.randomUUID();
    const batchIdStr = String(effectiveBatchId);

    // Generate docs for all combinations
    const docs = [];
    for (const intern of normalizedInterns) {
      for (const task of normalizedTasks) {
        const key = crypto
          .createHash('sha256')
          .update(`${batchIdStr}:${intern.id}:${stableTaskHash(task)}`)
          .digest('hex');
        docs.push({
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          assignedTo: intern.id,
          assignedToEmail: intern.email,
          assignedBy: req.user.id,
          dueDate: task.dueDate,
          priority: task.priority,
          sourceBatchId: batchIdStr,
          assignmentKey: key,
        });
      }
    }

    // Insert in chunks to avoid memory spikes and driver limits
    const CHUNK_SIZE = 1000;
    let insertedCount = 0;
    let duplicateCount = 0;
    const errors = [];

    for (const part of chunk(docs, CHUNK_SIZE)) {
      try {
        // Upsert by assignmentKey ensures idempotency and prevents duplicates without throwing
        const ops = part.map((d) => ({
          updateOne: {
            filter: { assignmentKey: d.assignmentKey },
            update: { $setOnInsert: d },
            upsert: true,
          },
        }));
        const result = await Task.bulkWrite(ops, { ordered: false });
        insertedCount += result.upsertedCount || 0;
        // matchedCount includes existing docs (duplicates). modifiedCount should be 0 (setOnInsert).
        duplicateCount += (result.matchedCount || 0);
      } catch (err) {
        const writeErrors = err?.writeErrors ?? [];
        for (const we of writeErrors) {
          errors.push({ code: we?.code, message: we?.errmsg || we?.message || 'write error' });
        }
        if (!writeErrors.length && err?.message) errors.push({ message: err.message });
      }
    }

    await publishEvent('tasks.tasks.bulkAssigned', {
      batchId: batchIdStr,
      assignedBy: req.user.id,
      internsCount: normalizedInterns.length,
      tasksCount: normalizedTasks.length,
      requestedAssignments: docs.length,
      insertedCount,
      duplicateCount,
      errorCount: errors.length,
      timestamp: new Date().toISOString(),
    });

    return res.status(202).json({
      batchId: batchIdStr,
      requestedAssignments: docs.length,
      insertedCount,
      duplicateCount,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
    });
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
