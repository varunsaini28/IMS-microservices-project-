import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { authApi } from '../../services/authApi'
import { exportToCsv } from '../../utils/exportToCsv'
import { exportToPdf } from '../../utils/exportToPdf'

export default function Users() {
  const [role, setRole] = useState('')
  const [q, setQ] = useState('')

  const users = useQuery({
    queryKey: ['users', { role, q }],
    queryFn: () => authApi.listUsers({ role: role || undefined, q: q || undefined }),
  })

  const rows = useMemo(() => (users.data ?? []), [users.data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Filter, search, export.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCsv('users.csv', rows)}
            disabled={rows.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportToPdf('users.pdf', {
                title: 'Users',
                columns: ['Full name', 'Email', 'Role'],
                rows: rows.map((u) => [u.fullName, u.email, u.role]),
              })
            }
            disabled={rows.length === 0}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name/email…" />
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="intern">Intern</option>
          </select>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Full name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((u) => (
                <tr key={u.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-2 py-2 font-medium">{u.fullName}</td>
                  <td className="px-2 py-2">{u.email}</td>
                  <td className="px-2 py-2">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.isLoading ? <div className="mt-3 text-sm text-slate-500">Loading…</div> : null}
          {!users.isLoading && rows.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">No users found.</div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

