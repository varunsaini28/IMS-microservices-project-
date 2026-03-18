import { LeaveRequest } from '../models/LeaveRequest.js';
import { publishEvent } from '../config/rabbitmq.js';

// Apply for leave
export const applyLeave = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const { startDate, endDate, reason } = req.body;

    const leave = new LeaveRequest({
      internId,
      startDate,
      endDate,
      reason
    });
    await leave.save();

    await publishEvent('tasks.leave.applied', {
      leaveId: leave._id,
      internId,
      startDate,
      endDate,
      reason,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(leave);
  } catch (err) {
    next(err);
  }
};

// Get my leave requests
export const getMyLeaves = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const leaves = await LeaveRequest.find({ internId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    next(err);
  }
};

// Get all leave requests (admin/manager)
export const getAllLeaves = async (req, res, next) => {
  try {
    const { status, internId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (internId) filter.internId = internId;

    const leaves = await LeaveRequest.find(filter).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    next(err);
  }
};

// Approve or reject leave
export const updateLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const approvedBy = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const leave = await LeaveRequest.findByIdAndUpdate(
      id,
      { status, approvedBy },
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    await publishEvent('tasks.leave.updated', {
      leaveId: leave._id,
      internId: leave.internId,
      status,
      approvedBy,
      timestamp: new Date().toISOString()
    });

    res.json(leave);
  } catch (err) {
    next(err);
  }
};

// Delete leave request (only if pending)
export const deleteLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const internId = req.user.id;

    const leave = await LeaveRequest.findOne({ _id: id, internId });
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete a processed leave request' });
    }

    await leave.deleteOne();
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    next(err);
  }
};