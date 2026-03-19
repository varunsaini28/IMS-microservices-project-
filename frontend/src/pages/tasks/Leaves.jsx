import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { tasksApi } from '../../services/tasksApi'
import { useAuth } from '../../hooks/useAuth'

export default function Leaves() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const leaves = useQuery({
    queryKey: ['leaves', isAdmin ? 'all' : 'me'],
    queryFn: () => (isAdmin ? tasksApi.leavesAll() : tasksApi.leavesMe()),
  })

  const rows = useMemo(() => leaves.data ?? [], [leaves.data])

  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const apply = useMutation({
    mutationFn: () => tasksApi.applyLeave({ startDate, endDate, reason }),
    onSuccess: () => {
      toast.success('Leave applied')
      setOpen(false)
      setStartDate('')
      setEndDate('')
      setReason('')
      qc.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Apply failed'),
  })

  const update = useMutation({
    mutationFn: ({ id, status }) => tasksApi.updateLeaveStatus({ id, status }),
    onSuccess: () => {
      toast.success('Leave updated')
      qc.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Update failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leave Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdmin ? 'Approve or reject intern leave requests.' : 'Apply for leave and track status.'}
          </p>
        </div>
        {!isAdmin ? <Button onClick={() => setOpen(true)}>Apply leave</Button> : null}
      </div>

      <Card>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                {isAdmin ? <th className="px-2 py-2">Intern</th> : null}
                <th className="px-2 py-2">Start</th>
                <th className="px-2 py-2">End</th>
                <th className="px-2 py-2">Reason</th>
                <th className="px-2 py-2">Status</th>
                {isAdmin ? <th className="px-2 py-2">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l._id} className="border-t border-slate-200 dark:border-slate-800">
                  {isAdmin ? <td className="px-2 py-2">{l.internId}</td> : null}
                  <td className="px-2 py-2">{String(l.startDate).slice(0, 10)}</td>
                  <td className="px-2 py-2">{String(l.endDate).slice(0, 10)}</td>
                  <td className="px-2 py-2 max-w-[60ch] truncate">{l.reason || '—'}</td>
                  <td className="px-2 py-2">{l.status || 'pending'}</td>
                  {isAdmin ? (
                    <td className="px-2 py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => update.mutate({ id: l._id, status: 'approved' })}
                          disabled={update.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => update.mutate({ id: l._id, status: 'rejected' })}
                          disabled={update.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          {leaves.isLoading ? <div className="mt-3 text-sm text-slate-500">Loading…</div> : null}
          {!leaves.isLoading && rows.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">No leave requests.</div>
          ) : null}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Apply for leave"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => apply.mutate()} disabled={!startDate || !endDate || apply.isPending}>
              {apply.isPending ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Start date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">End date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Reason</label>
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

