import { Notification } from '../models/Notification.js';
import { sendEmail } from '../services/emailService.js';
import { env } from '../config/env.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { returnDocument: "after" }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

/** Admin/manager: send email to interns (to: string[] or 'all'). */
export const sendEmailToInterns = async (req, res, next) => {
  try {
    const { to, subject, html } = req.body;
    if (!subject || !html) return res.status(400).json({ error: 'subject and html required' });

    let emails = [];
    if (to === 'all' || (Array.isArray(to) && to.length > 0 && to.includes('all'))) {
      const base = env.authServiceUrl.replace(/\/$/, '');
      const r = await fetch(`${base}/auth/users`, {
        headers: { Authorization: req.headers.authorization || '' }
      });
      if (!r.ok) return res.status(502).json({ error: 'Could not fetch user list' });
      const users = await r.json();
      emails = users.filter((u) => u.role === 'intern').map((u) => u.email).filter(Boolean);
    } else if (Array.isArray(to)) {
      emails = to.filter(Boolean);
    }
    if (emails.length === 0) return res.status(400).json({ error: 'No recipients' });

    const results = { sent: 0, failed: 0 };
    for (const email of emails) {
      try {
        await sendEmail(email, subject, html);
        results.sent++;
      } catch {
        results.failed++;
      }
    }
    res.json({ message: 'Emails sent', ...results });
  } catch (err) {
    next(err);
  }
};