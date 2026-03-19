import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import { configApi } from '../../../services/configApi'

export default function Workflows() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [entity, setEntity] = useState('')
  const [ruleJson, setRuleJson] = useState('{}')

  const q = useQuery({ queryKey: ['config', 'workflows'], queryFn: configApi.workflows.list })

  const create = useMutation({
    mutationFn: async () => {
      let parsed
      try {
        parsed = JSON.parse(ruleJson)
      } catch {
        throw new Error('Rule must be valid JSON')
      }
      return configApi.workflows.create({ entity, ...parsed })
    },
    onSuccess: () => {
      toast.success('Workflow created')
      setOpen(false)
      setEntity('')
      setRuleJson('{}')
      qc.invalidateQueries({ queryKey: ['config', 'workflows'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || e?.message || 'Create failed'),
  })

  const rows = useMemo(() => q.data ?? [], [q.data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workflows</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Workflow rules by entity.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New Rule</Button>
      </div>

      <Card>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Entity</th>
                <th className="px-2 py-2">Rule</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id || r.id} className="border-t border-slate-200 dark:border-slate-800 align-top">
                  <td className="px-2 py-2 font-medium whitespace-nowrap">{r.entity || '—'}</td>
                  <td className="px-2 py-2">
                    <pre className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs dark:bg-slate-900">
                      {JSON.stringify(r, null, 2)}
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
        title="Create workflow rule"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={!entity || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Entity</label>
            <Input value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="e.g. task" />
          </div>
          <div>
            <label className="text-sm font-medium">Rule JSON (merged into payload)</label>
            <textarea
              className="min-h-40 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={ruleJson}
              onChange={(e) => setRuleJson(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

