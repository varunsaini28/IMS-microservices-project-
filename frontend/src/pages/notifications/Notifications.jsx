import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { notificationsApi } from '../../services/notificationsApi'
import { useAuth } from '../../hooks/useAuth'

export default function Notifications() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30_000,
  })

  const rows = useMemo(() => (q.data ?? []), [q.data])
  const unread = rows.filter((n) => !n.read).length

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      toast.success('Marked all as read')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Failed'),
  })

  const markOne = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e) => toast.error(e?.response?.data?.error || 'Failed'),
  })

  const [open, setOpen] = useState(false)
  const [to, setTo] = useState('all')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')

  const send = useMutation({
    mutationFn: () => notificationsApi.sendBulkEmail({ to, subject, html }),
    onSuccess: (data) => {
      toast.success(data?.message || 'Sent')
      setOpen(false)
      setTo('all')
      setSubject('')
      setHtml('')
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Send failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unread} unread
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending || unread === 0}>
            Mark all read
          </Button>
          {isAdmin ? <Button onClick={() => setOpen(true)}>Send bulk email</Button> : null}
        </div>
      </div>

      <Card>
        <div className="space-y-2">
          {rows.map((n) => (
            <div
              key={n._id}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-medium">{n.title || n.subject || 'Notification'}</div>
                  {!n.read ? (
                    <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white">
                      NEW
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {n.message || n.body || n.html || ''}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(n.createdAt || Date.now()).toLocaleString()}
                </div>
              </div>
              {!n.read ? (
                <Button size="sm" variant="outline" onClick={() => markOne.mutate(n._id)} disabled={markOne.isPending}>
                  Mark read
                </Button>
              ) : null}
            </div>
          ))}

          {q.isLoading ? <div className="text-sm text-slate-500">Loading…</div> : null}
          {!q.isLoading && rows.length === 0 ? (
            <div className="text-sm text-slate-500">No notifications.</div>
          ) : null}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Send bulk email"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => send.mutate()} disabled={!subject || !html || send.isPending}>
              {send.isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">To</label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              <option value="all">All interns</option>
            </select>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              (Endpoint supports explicit email arrays too; this UI sends to all.)
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">HTML body</label>
            <textarea
              className="min-h-40 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="<p>Hello interns…</p>"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

