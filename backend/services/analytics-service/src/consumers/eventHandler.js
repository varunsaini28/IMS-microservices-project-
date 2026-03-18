import { pgPool } from '../config/database.js';

export const handleEvent = async (routingKey, data) => {
  console.log('Analytics event received:', routingKey, data);

  try {
    switch (routingKey) {

      case 'tasks.task.assigned': {
        const today = new Date().toISOString().split('T')[0];

        // Update intern daily metrics
        await pgPool.query(
          `INSERT INTO intern_daily_metrics (intern_id, date, tasks_assigned, tasks_completed, work_hours)
           VALUES ($1, $2, 1, 0, 0)
           ON CONFLICT (intern_id, date)
           DO UPDATE SET tasks_assigned = intern_daily_metrics.tasks_assigned + 1`,
          [data.assignedTo, today]
        );

        // Update project metrics if projectId exists
        if (data.projectId) {
          await pgPool.query(
            `INSERT INTO project_metrics (project_id, total_tasks, completed_tasks)
             VALUES ($1, 1, 0)
             ON CONFLICT (project_id)
             DO UPDATE SET total_tasks = project_metrics.total_tasks + 1, updated_at = NOW()`,
            [data.projectId]
          );
        }

        console.log('Updated tasks_assigned for:', data.assignedTo);
        break;
      }

      case 'tasks.task.completed': {
        const today = new Date().toISOString().split('T')[0];

        // Update intern daily metrics
        await pgPool.query(
          `INSERT INTO intern_daily_metrics (intern_id, date, tasks_assigned, tasks_completed, work_hours)
           VALUES ($1, $2, 0, 1, 0)
           ON CONFLICT (intern_id, date)
           DO UPDATE SET tasks_completed = intern_daily_metrics.tasks_completed + 1`,
          [data.completedBy, today]
        );

        // Update project metrics if projectId exists
        if (data.projectId) {
          await pgPool.query(
            `UPDATE project_metrics
             SET completed_tasks = completed_tasks + 1, updated_at = NOW()
             WHERE project_id = $1`,
            [data.projectId]
          );
        }

        console.log('Updated tasks_completed for:', data.completedBy);
        break;
      }

      case 'tasks.worklog.created': {
        const today = new Date().toISOString().split('T')[0];
        await pgPool.query(
          `INSERT INTO intern_daily_metrics (intern_id, date, tasks_assigned, tasks_completed, work_hours)
           VALUES ($1, $2, 0, 0, $3)
           ON CONFLICT (intern_id, date)
           DO UPDATE SET work_hours = intern_daily_metrics.work_hours + $3`,
          [data.internId, today, data.hours]
        );
        console.log('Updated work_hours for:', data.internId);
        break;
      }

      case 'tasks.attendance.checkin': {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = today.substring(0, 7) + '-01';

        // Insert daily metric row
        await pgPool.query(
          `INSERT INTO intern_daily_metrics (intern_id, date, tasks_assigned, tasks_completed, work_hours)
           VALUES ($1, $2, 0, 0, 0)
           ON CONFLICT (intern_id, date) DO NOTHING`,
          [data.internId, today]
        );

        // Update monthly attendance summary
        await pgPool.query(
          `INSERT INTO attendance_summary (intern_id, month, present_days, absent_days, leave_days)
           VALUES ($1, $2, 1, 0, 0)
           ON CONFLICT (intern_id, month)
           DO UPDATE SET present_days = attendance_summary.present_days + 1`,
          [data.internId, monthStart]
        );

        console.log('Attendance checkin recorded for:', data.internId);
        break;
      }

      case 'tasks.attendance.checkout': {
        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);
        const hoursWorked = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2);
        const today = new Date().toISOString().split('T')[0];

        await pgPool.query(
          `INSERT INTO intern_daily_metrics (intern_id, date, tasks_assigned, tasks_completed, work_hours)
           VALUES ($1, $2, 0, 0, $3)
           ON CONFLICT (intern_id, date)
           DO UPDATE SET work_hours = intern_daily_metrics.work_hours + $3`,
          [data.internId, today, hoursWorked]
        );

        console.log('Work hours updated from checkout for:', data.internId);
        break;
      }

      case 'tasks.leave.updated': {
        if (data.status === 'approved') {
          const monthStart = new Date(data.startDate).toISOString().substring(0, 7) + '-01';
          const start = new Date(data.startDate);
          const end = new Date(data.endDate);
          const leaveDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

          await pgPool.query(
            `INSERT INTO attendance_summary (intern_id, month, present_days, absent_days, leave_days)
             VALUES ($1, $2, 0, 0, $3)
             ON CONFLICT (intern_id, month)
             DO UPDATE SET leave_days = attendance_summary.leave_days + $3`,
            [data.internId, monthStart, leaveDays]
          );

          console.log('Leave days updated for:', data.internId);
        }
        break;
      }

      case 'projects.project.created': {
        await pgPool.query(
          `INSERT INTO project_metrics (project_id, total_tasks, completed_tasks)
           VALUES ($1, 0, 0)
           ON CONFLICT (project_id) DO NOTHING`,
          [data.projectId]
        );
        console.log('Project metrics initialized for:', data.projectId);
        break;
      }

      default:
        console.log('No analytics handler for:', routingKey);
    }
  } catch (err) {
    console.error('Analytics event handler error:', err.message);
  }
};