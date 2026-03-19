import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { tasksApi } from '../../services/tasksApi'
import { useAuth } from '../../hooks/useAuth'

export default function Calendar() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(now.getFullYear()))

  const q = useQuery({
    queryKey: ['calendar', { month, year }],
    queryFn: () => tasksApi.calendar({ month, year }),
    enabled: Boolean(month && year),
  })

  const days = useMemo(() => q.data ?? [], [q.data])

  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState('working')
  const [label, setLabel] = useState('')

  const setDay = useMutation({
    mutationFn: () => tasksApi.setCalendarDay({ date, type, label }),
    onSuccess: () => {
      toast.success('Calendar updated')
      setOpen(false)
      qc.invalidateQueries({ queryKey: ['calendar'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Update failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Working days, holidays, and non-working days.
          </p>
        </div>
        {isAdmin ? <Button onClick={() => setOpen(true)}>Set day</Button> : null}
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Month</label>
            <Input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="MM" />
          </div>
          <div>
            <label className="text-sm font-medium">Year</label>
            <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="YYYY" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ['calendar'] })}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Label</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d._id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-2 py-2">{String(d.date).slice(0, 10)}</td>
                  <td className="px-2 py-2">{d.type}</td>
                  <td className="px-2 py-2">{d.label || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {q.isLoading ? <div className="mt-3 text-sm text-slate-500">Loading…</div> : null}
          {!q.isLoading && days.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">No configured days for this month.</div>
          ) : null}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Set calendar day"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDay.mutate()} disabled={!date || !type || setDay.isPending}>
              {setDay.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="working">Working</option>
              <option value="holiday">Holiday</option>
              <option value="non_working">Non-working</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Label (optional)</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

