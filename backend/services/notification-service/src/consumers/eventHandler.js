import { sendEmail } from '../services/emailService.js';
import { Notification } from '../models/Notification.js';

// ─── Master event router ─────────────────────────────────────
// All RabbitMQ events land here. Add a case for every routing key.
export const handleEvent = async (routingKey, payload) => {
  console.log(`[EventHandler] Received: ${routingKey}`, payload);

  switch (routingKey) {

    // ── OTP: Registration & Resend ─────────────────────────
    case 'auth.otp.requested':
      await handleOtpRequested(payload);
      break;

    // ── Registration complete → Welcome email ──────────────
    case 'auth.user.registered':
      await handleUserRegistered(payload);
      break;

    // ── Login event (store notification / audit) ───────────
    case 'auth.user.loggedin':
      await handleUserLoggedIn(payload);
      break;

    case 'tasks.task.assigned':
      await handleTaskAssigned(payload);
      break;

    case 'projects.intern.assigned':
      await handleProjectInternAssigned(payload);
      break;

    case 'calendar.day.updated':
      await handleCalendarDayUpdated(payload);
      break;

    case 'tasks.deadline.reminder':
      await handleDeadlineReminder(payload);
      break;

    default:
      console.log(`[EventHandler] No handler for routing key: ${routingKey}`);
  }
};

// ─── Task assigned: in-app notification + email to assignee ──
const handleTaskAssigned = async (data) => {
  if (data.assignedTo) {
    await Notification.create({
      userId: data.assignedTo,
      type: 'task.assigned',
      title: 'New Task Assigned',
      body: `You have been assigned: ${data.title || 'Task'}`,
      data,
      read: false,
    });
  }
  if (data.assignedToEmail) {
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d1117;border-radius:12px;border:1px solid #21262d;padding:24px">
        <h2 style="color:#fff;margin:0 0 16px">New Task Assigned</h2>
        <p style="color:#8b949e;margin:0 0 8px"><b style="color:#e6edf3">${data.title || 'Task'}</b></p>
        <p style="color:#6e7681;font-size:14px">Due: ${data.dueDate ? new Date(data.dueDate).toDateString() : 'Not set'} · Priority: ${data.priority || 'Medium'}</p>
        <p style="color:#6e7681;font-size:12px">Please log in to view and complete the task.</p>
      </div>`;
    await sendEmail(data.assignedToEmail, 'New Task Assigned to You', html);
  }
};

// ─── Project intern assigned: in-app notification + email ──
const handleProjectInternAssigned = async (data) => {
  if (data.internId) {
    await Notification.create({
      userId: data.internId,
      type: 'project.assigned',
      title: 'Assigned to Project',
      body: `You have been assigned to project: ${data.projectName || data.projectId}`,
      data,
      read: false,
    });
  }
  if (data.internEmail) {
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d1117;border-radius:12px;border:1px solid #21262d;padding:24px">
        <h2 style="color:#fff;margin:0 0 16px">Project Assignment</h2>
        <p style="color:#8b949e">You have been assigned to project: <b style="color:#e6edf3">${data.projectName || data.projectId}</b></p>
        <p style="color:#6e7681;font-size:12px">Log in to view project details and update status.</p>
      </div>`;
    await sendEmail(data.internEmail, 'You Have Been Assigned to a Project', html);
  }
};

// ─── Holiday/non-working day: email all interns (fetch from auth if available) ──
const handleCalendarDayUpdated = async (data) => {
  const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
  const internalKey = process.env.INTERNAL_API_KEY;
  let emails = [];
  if (internalKey) {
    try {
      const r = await fetch(`${authUrl.replace(/\/$/, '')}/auth/internal/users?role=intern`, {
        headers: { 'X-Internal-Key': internalKey },
      });
      if (r.ok) {
        const users = await r.json();
        emails = users.map((u) => u.email).filter(Boolean);
      }
    } catch (e) {
      console.error('[EventHandler] calendar.day.updated: fetch interns failed', e.message);
    }
  }
  const dateStr = data.date ? new Date(data.date).toDateString() : 'the day';
  const label = data.label || data.type;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d1117;border-radius:12px;border:1px solid #21262d;padding:24px">
      <h2 style="color:#fff;margin:0 0 16px">Calendar Update</h2>
      <p style="color:#8b949e">${dateStr} has been marked as <b style="color:#e6edf3">${label}</b>.</p>
      <p style="color:#6e7681;font-size:12px">No attendance or work submission is required for this day.</p>
    </div>`;
  for (const email of emails) {
    try {
      await sendEmail(email, `Calendar: ${dateStr} - ${label}`, html);
    } catch (e) {
      console.error('[EventHandler] calendar email failed for', email, e.message);
    }
  }
  if (emails.length > 0) console.log(`[EventHandler] Calendar update emails sent to ${emails.length} interns`);
};

// ─── Deadline reminder: one day before due date ──
const handleDeadlineReminder = async (data) => {
  if (data.assignedTo) {
    await Notification.create({
      userId: data.assignedTo,
      type: 'deadline.reminder',
      title: 'Task due tomorrow',
      body: `"${data.title || 'Task'}" is due tomorrow. Please complete it before the deadline.`,
      data,
      read: false,
    });
  }
  if (data.assignedToEmail) {
    const dueStr = data.dueDate ? new Date(data.dueDate).toDateString() : 'tomorrow';
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d1117;border-radius:12px;border:1px solid #21262d;padding:24px">
        <h2 style="color:#fff;margin:0 0 16px">Reminder: Task due tomorrow</h2>
        <p style="color:#8b949e">You have a task due <b style="color:#e6edf3">${dueStr}</b>: ${data.title || 'Task'}</p>
        <p style="color:#6e7681;font-size:12px">Please complete and submit your work before the deadline.</p>
      </div>`;
    await sendEmail(data.assignedToEmail, 'Reminder: Task due tomorrow', html);
  }
};

// ─── OTP Email ───────────────────────────────────────────────
const handleOtpRequested = async ({ email, fullName, otp, expiresInMinutes, type }) => {
  const isResend = type === 'OTP_RESEND';

  const subject = isResend
    ? 'Your new InternMS verification code'
    : 'Verify your InternMS account';

  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#0d1117;border-radius:16px;border:1px solid #21262d;overflow:hidden">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0d2818 0%,#0d1117 100%);padding:32px 32px 24px;border-bottom:1px solid #21262d">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;background:#10b981;border-radius:8px;display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-weight:700;font-size:18px">I</span>
          </div>
          <span style="color:#fff;font-weight:600;font-size:16px;letter-spacing:-0.02em">InternMS</span>
        </div>
      </div>

      <!-- Body -->
      <div style="padding:32px">
        <h2 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;letter-spacing:-0.03em">
          ${isResend ? 'New verification code' : 'Verify your email'}
        </h2>
        <p style="color:#8b949e;font-size:14px;margin:0 0 28px;line-height:1.6">
          Hi ${fullName || 'there'}, ${isResend
            ? 'here is your new verification code.'
            : 'enter this code to complete your InternMS registration.'}
        </p>

        <!-- OTP Box -->
        <div style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px">
          <p style="color:#6e7681;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px">Verification Code</p>
          <span style="font-size:44px;font-weight:800;letter-spacing:16px;color:#10b981;font-family:'Courier New',monospace">${otp}</span>
        </div>

        <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:8px;padding:12px 16px;margin-bottom:24px">
          <p style="color:#6ee7b7;font-size:13px;margin:0">
            ⏱ This code expires in <strong>${expiresInMinutes} minutes</strong>
          </p>
        </div>

        <p style="color:#6e7681;font-size:12px;margin:0;line-height:1.6">
          If you didn't request this, you can safely ignore this email.<br>
          Never share this code with anyone.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:20px 32px;border-top:1px solid #21262d;background:#0a0d11">
        <p style="color:#484f58;font-size:11px;margin:0;text-align:center">
          Intern Management System · This is an automated message
        </p>
      </div>
    </div>
  `;

  await sendEmail(email, subject, html);

  // Store in-app notification as well
  await Notification.create({
    userId: null, // user not yet created at OTP stage
    type: 'OTP_SENT',
    title: 'Verification code sent',
    message: `OTP sent to ${email}`,
    metadata: { email, type },
    read: false,
  });

  console.log(`[EventHandler] OTP email sent to ${email}`);
};

// ─── Welcome Email after successful registration ──────────────
const handleUserRegistered = async ({ userId, email, fullName, role }) => {
  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#0d1117;border-radius:16px;border:1px solid #21262d;overflow:hidden">
      <div style="background:linear-gradient(135deg,#0d2818 0%,#0d1117 100%);padding:32px;border-bottom:1px solid #21262d">
        <div style="width:36px;height:36px;background:#10b981;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px">
          <span style="color:#fff;font-weight:700;font-size:18px">I</span>
        </div>
        <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0;letter-spacing:-0.03em">Welcome to InternMS 🎉</h1>
      </div>
      <div style="padding:32px">
        <p style="color:#8b949e;font-size:14px;line-height:1.7;margin:0 0 24px">
          Hi <strong style="color:#fff">${fullName}</strong>, your account has been verified and created successfully.
          You can now sign in to your intern portal.
        </p>
        <div style="background:#161b22;border:1px solid #30363d;border-radius:10px;padding:20px;margin-bottom:24px">
          <p style="color:#6e7681;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px">Account Details</p>
          <p style="color:#e6edf3;font-size:14px;margin:0 0 6px">📧 ${email}</p>
          <p style="color:#e6edf3;font-size:14px;margin:0">🏷️ Role: <span style="color:#10b981;text-transform:capitalize">${role}</span></p>
        </div>
        <p style="color:#6e7681;font-size:12px;margin:0">If you didn't create this account, please contact support immediately.</p>
      </div>
      <div style="padding:20px 32px;border-top:1px solid #21262d;background:#0a0d11">
        <p style="color:#484f58;font-size:11px;margin:0;text-align:center">Intern Management System · Automated message</p>
      </div>
    </div>
  `;

  await sendEmail(email, 'Welcome to InternMS — Account Created', html);

  // Store in-app notification for new user
  await Notification.create({
    userId,
    type: 'WELCOME',
    title: 'Welcome to InternMS!',
    message: 'Your account has been created successfully.',
    metadata: { role },
    read: false,
  });

  console.log(`[EventHandler] Welcome email sent to ${email}`);
};

// ─── Login notification (in-app only, no email) ──────────────
const handleUserLoggedIn = async ({ userId, email }) => {
  await Notification.create({
    userId,
    type: 'LOGIN',
    title: 'New login detected',
    message: `Sign-in to your account at ${new Date().toLocaleString()}`,
    metadata: { email },
    read: false,
  });

  console.log(`[EventHandler] Login notification stored for ${email}`);
};
