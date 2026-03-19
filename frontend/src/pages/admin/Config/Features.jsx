import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import { configApi } from '../../../services/configApi'

export default function Features() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [enabled, setEnabled] = useState(true)

  const q = useQuery({ queryKey: ['config', 'features'], queryFn: configApi.features.list })

  const create = useMutation({
    mutationFn: () => configApi.features.create({ name, enabled }),
    onSuccess: () => {
      toast.success('Feature created')
      setOpen(false)
      setName('')
      setEnabled(true)
      qc.invalidateQueries({ queryKey: ['config', 'features'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Create failed'),
  })

  const rows = useMemo(() => q.data ?? [], [q.data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feature Toggles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Admin-only config.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New Feature</Button>
      </div>

      <Card>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.name} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-2 py-2 font-medium">{f.name}</td>
                  <td className="px-2 py-2">{String(f.enabled)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {q.isLoading ? <div className="mt-3 text-sm text-slate-500">Loading…</div> : null}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create feature toggle"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. new-dashboard" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Enabled
          </label>
        </div>
      </Modal>
    </div>
  )
}

