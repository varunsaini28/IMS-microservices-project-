import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import { configApi } from '../../../services/configApi'

export default function Schemas() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [formType, setFormType] = useState('')
  const [schemaJson, setSchemaJson] = useState('{}')

  const q = useQuery({ queryKey: ['config', 'schemas'], queryFn: configApi.schemas.list })

  const create = useMutation({
    mutationFn: async () => {
      let parsed
      try {
        parsed = JSON.parse(schemaJson)
      } catch {
        throw new Error('Schema must be valid JSON')
      }
      return configApi.schemas.create({ formType, schema: parsed })
    },
    onSuccess: () => {
      toast.success('Schema saved')
      setOpen(false)
      setFormType('')
      setSchemaJson('{}')
      qc.invalidateQueries({ queryKey: ['config', 'schemas'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || e?.message || 'Save failed'),
  })

  const rows = useMemo(() => q.data ?? [], [q.data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Form Schemas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Schema registry for forms.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New Schema</Button>
      </div>

      <Card>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Form type</th>
                <th className="px-2 py-2">Schema</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.formType} className="border-t border-slate-200 dark:border-slate-800 align-top">
                  <td className="px-2 py-2 font-medium whitespace-nowrap">{s.formType}</td>
                  <td className="px-2 py-2">
                    <pre className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs dark:bg-slate-900">
                      {JSON.stringify(s.schema ?? s, null, 2)}
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
        title="Create schema"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={!formType || create.isPending}>
              {create.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Form type</label>
            <Input value={formType} onChange={(e) => setFormType(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Schema JSON</label>
            <textarea
              className="min-h-40 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={schemaJson}
              onChange={(e) => setSchemaJson(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

