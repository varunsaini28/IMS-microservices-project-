import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { api } from '../../lib/axios'
import { useDebounce } from '../../hooks/useDebounce'

async function fetchSearch(q) {
  if (!q) return { tasks: [], projects: [], users: [] }
  // If backend ever adds a unified search endpoint, swap to it.
  const [tasks, projects, users] = await Promise.allSettled([
    api.get('/tasks', { params: { q, limit: 5 } }),
    api.get('/projects', { params: { q, limit: 5 } }),
    api.get('/auth/users', { params: { q } }),
  ])

  return {
    tasks: tasks.status === 'fulfilled' ? tasks.value.data ?? [] : [],
    projects: projects.status === 'fulfilled' ? projects.value.data ?? [] : [],
    users: users.status === 'fulfilled' ? users.value.data ?? [] : [],
  }
}

export default function SearchModal({ open, onClose }) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 250)

  const enabled = open && debounced.trim().length >= 2
  const { data, isFetching } = useQuery({
    queryKey: ['globalSearch', debounced],
    queryFn: () => fetchSearch(debounced.trim()),
    enabled,
  })

  const groups = useMemo(() => {
    const d = data ?? { tasks: [], projects: [], users: [] }
    return [
      { title: 'Tasks', items: d.tasks, getLabel: (x) => x.title ?? x.name ?? x.id },
      { title: 'Projects', items: d.projects, getLabel: (x) => x.name ?? x.title ?? x.id },
      { title: 'Users', items: d.users, getLabel: (x) => x.fullName ?? x.email ?? x.id },
    ]
  }, [data])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Search"
      className="max-w-3xl"
      footer={<div className="text-xs text-slate-500">Type at least 2 characters.</div>}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks, projects, users…"
            className="pl-10"
          />
        </div>

        {isFetching ? <div className="text-sm text-slate-500">Searching…</div> : null}

        <div className="grid gap-4 md:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500">{g.title}</div>
              <div className="mt-2 space-y-1">
                {(g.items ?? []).slice(0, 5).map((it) => (
                  <div key={it.id ?? g.getLabel(it)} className="truncate text-sm">
                    {g.getLabel(it)}
                  </div>
                ))}
                {(g.items ?? []).length === 0 ? (
                  <div className="text-sm text-slate-400">No results</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

