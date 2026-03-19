import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { tasksApi } from '../../services/tasksApi';
import { authApi } from '../../services/authApi';
import { useAuth } from '../../hooks/useAuth';

export default function Attendance() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const attendance = useQuery({
    queryKey: ['attendance', isAdmin ? 'all' : 'me'],
    queryFn: () => (isAdmin ? tasksApi.attendanceAll() : tasksApi.attendanceMe()),
  });

  const interns = useQuery({
    queryKey: ['users', { role: 'intern' }],
    queryFn: () => authApi.listUsers({ role: 'intern' }),
    enabled: isAdmin,
  });

  const rows = useMemo(() => attendance.data ?? [], [attendance.data]);

  // Check if today is already marked (for intern)
  const todayMarked = useMemo(() => {
    if (isAdmin) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return rows.some(r => r.date?.slice(0, 10) === todayStr);
  }, [rows, isAdmin]);

  // State for admin modal
  const [open, setOpen] = useState(false);
  const [internId, setInternId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('present');

  const markSelf = useMutation({
    mutationFn: tasksApi.markSelfAttendance,
    onSuccess: () => {
      toast.success('You are marked present today');
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Failed to mark'),
  });

  const markAdmin = useMutation({
    mutationFn: () => tasksApi.markAttendance({ internId, date, status }),
    onSuccess: () => {
      toast.success('Attendance marked');
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Mark failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdmin ? 'All interns attendance' : 'Your attendance history'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isAdmin && (
            <Button
              onClick={() => markSelf.mutate()}
              disabled={todayMarked || markSelf.isPending}
            >
              {todayMarked ? 'Already Marked Today' : 'Mark Present'}
            </Button>
          )}
          {isAdmin && <Button onClick={() => setOpen(true)}>Mark attendance</Button>}
        </div>
      </div>

      <Card>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                {isAdmin && <th className="px-2 py-2">Intern</th>}
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Check in</th>
                <th className="px-2 py-2">Check out</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a._id} className="border-t border-slate-200 dark:border-slate-800">
                  {isAdmin && <td className="px-2 py-2">{a.internId}</td>}
                  <td className="px-2 py-2">{a.date ? String(a.date).slice(0, 10) : '—'}</td>
                  <td className="px-2 py-2">{a.status || '—'}</td>
                  <td className="px-2 py-2">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'}</td>
                  <td className="px-2 py-2">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendance.isLoading && (
            <div className="mt-3 text-sm text-slate-500">Loading…</div>
          )}
          {!attendance.isLoading && rows.length === 0 && (
            <div className="mt-3 text-sm text-slate-500">No attendance records.</div>
          )}
        </div>
      </Card>

      {/* Admin modal */}
      {isAdmin && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Mark attendance"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => markAdmin.mutate()}
                disabled={!internId || !date || markAdmin.isPending}
              >
                {markAdmin.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Intern</label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={internId}
                onChange={(e) => setInternId(e.target.value)}
              >
                <option value="">Select intern…</option>
                {(interns.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Note: backend only allows marking attendance if the intern submitted work or completed a task on that day.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}