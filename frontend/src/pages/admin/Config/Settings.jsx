import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import { configApi } from '../../../services/configApi'

export default function Settings() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [value, setValue] = useState('')

  const q = useQuery({ queryKey: ['config', 'settings'], queryFn: configApi.settings.list })

  const create = useMutation({
    mutationFn: () => {
      let parsed = value
      try {
        parsed = JSON.parse(value)
      } catch {
        // keep string
      }
      return configApi.settings.create({ key: keyName, value: parsed })
    },
    onSuccess: () => {
      toast.success('Setting created')
      setOpen(false)
      setKeyName('')
      setValue('')
      qc.invalidateQueries({ queryKey: ['config', 'settings'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Create failed'),
  })

  const rows = useMemo(() => q.data ?? [], [q.data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Key/value settings.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New Setting</Button>
      </div>

      <Card>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Key</th>
                <th className="px-2 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.key} className="border-t border-slate-200 dark:border-slate-800 align-top">
                  <td className="px-2 py-2 font-medium whitespace-nowrap">{s.key}</td>
                  <td className="px-2 py-2">
                    <pre className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs dark:bg-slate-900">
                      {JSON.stringify(s.value, null, 2)}
                    </pre>
                  </td>
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
        title="Create setting"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={!keyName || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Key</label>
            <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Value (JSON or string)</label>
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='e.g. "hello" or {"x":1}'
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

