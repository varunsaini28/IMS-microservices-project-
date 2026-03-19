import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import { configApi } from '../../../services/configApi'

export default function Permissions() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('')
  const [resource, setResource] = useState('')
  const [permJson, setPermJson] = useState('{"actions":["read"]}')

  const q = useQuery({ queryKey: ['config', 'permissions'], queryFn: configApi.permissions.list })

  const create = useMutation({
    mutationFn: async () => {
      let parsed
      try {
        parsed = JSON.parse(permJson)
      } catch {
        throw new Error('Permissions must be valid JSON')
      }
      return configApi.permissions.create({ role, resource, ...parsed })
    },
    onSuccess: () => {
      toast.success('Permission saved')
      setOpen(false)
      setRole('')
      setResource('')
      setPermJson('{"actions":["read"]}')
      qc.invalidateQueries({ queryKey: ['config', 'permissions'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || e?.message || 'Save failed'),
  })

  const rows = useMemo(() => q.data ?? [], [q.data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Permissions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Role/resource permissions.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New Permission</Button>
      </div>

      <Card>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Role</th>
                <th className="px-2 py-2">Resource</th>
                <th className="px-2 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={`${p.role}:${p.resource}`} className="border-t border-slate-200 dark:border-slate-800 align-top">
                  <td className="px-2 py-2 font-medium">{p.role}</td>
                  <td className="px-2 py-2">{p.resource}</td>
                  <td className="px-2 py-2">
                    <pre className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs dark:bg-slate-900">
                      {JSON.stringify(p, null, 2)}
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
        title="Create permission"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={!role || !resource || create.isPending}>
              {create.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Role</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="admin" />
          </div>
          <div>
            <label className="text-sm font-medium">Resource</label>
            <Input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="tasks" />
          </div>
          <div>
            <label className="text-sm font-medium">Permission JSON</label>
            <textarea
              className="min-h-40 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={permJson}
              onChange={(e) => setPermJson(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

