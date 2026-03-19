import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { authApi } from '../../services/authApi'
import { tasksApi } from '../../services/tasksApi'
import { projectsApi } from '../../services/projectsApi'

function uniq(arr) {
  return [...new Set(arr)]
}

function makeBatchId(prefix) {
  try {
    return `${prefix}_${crypto.randomUUID()}`
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
  }
}

function MultiSelectList({ title, items, selectedIds, onToggle, search, setSearch, hint }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((x) => {
      const hay = `${x.label ?? ''} ${x.subLabel ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, search])

  const allVisibleSelected = useMemo(() => filtered.every((x) => selectedIds.has(String(x.id))), [filtered, selectedIds])

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {hint ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const ids = filtered.map((x) => String(x.id))
              if (ids.length === 0) return
              if (allVisibleSelected) {
                ids.forEach((id) => onToggle(id, false))
              } else {
                ids.forEach((id) => onToggle(id, true))
              }
            }}
          >
            {allVisibleSelected ? 'Unselect visible' : 'Select visible'}
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
      </div>

      <div className="mt-3 max-h-[360px] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {filtered.map((x) => {
            const id = String(x.id)
            const checked = selectedIds.has(id)
            return (
              <li key={id} className="flex items-start gap-3 p-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={checked}
                  onChange={(e) => onToggle(id, e.target.checked)}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{x.label}</div>
                  {x.subLabel ? <div className="truncate text-xs text-slate-500 dark:text-slate-400">{x.subLabel}</div> : null}
                </div>
              </li>
            )
          })}
          {filtered.length === 0 ? (
            <li className="p-3 text-sm text-slate-500 dark:text-slate-400">No matches.</li>
          ) : null}
        </ul>
      </div>
    </Card>
  )
}

export default function BulkAssign() {
  const qc = useQueryClient()
  const interns = useQuery({
    queryKey: ['users', { role: 'intern' }],
    queryFn: () => authApi.listUsers({ role: 'intern' }),
  })
  const projects = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => projectsApi.list(),
  })

  const [tab, setTab] = useState('tasks') // tasks | projects

  const [internSearch, setInternSearch] = useState('')
  const [selectedInternIds, setSelectedInternIds] = useState(() => new Set())

  const internItems = useMemo(
    () =>
      (interns.data ?? []).map((u) => ({
        id: String(u.id),
        label: u.fullName || u.email || u.id,
        subLabel: u.email ? `${u.email} • ${u.id}` : String(u.id),
        email: u.email,
      })),
    [interns.data]
  )

  const selectedInternsPayload = useMemo(() => {
    const byId = new Map(internItems.map((x) => [String(x.id), x]))
    return [...selectedInternIds].map((id) => ({ id, email: byId.get(id)?.email }))
  }, [internItems, selectedInternIds])

  const toggleIntern = (id, on) => {
    setSelectedInternIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(String(id))
      else next.delete(String(id))
      return next
    })
  }

  // Task bulk
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskProjectId, setTaskProjectId] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [extraTasks, setExtraTasks] = useState([])

  const addTaskRow = () => {
    const t = taskTitle.trim()
    if (t.length < 3) {
      toast.error('Task title must be at least 3 characters')
      return
    }
    setExtraTasks((prev) =>
      prev.concat({
        title: t,
        description: taskDescription.trim() || undefined,
        projectId: taskProjectId || undefined,
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
      })
    )
    setTaskTitle('')
    setTaskDescription('')
  }

  const tasksToAssign = useMemo(() => extraTasks, [extraTasks])

  const bulkAssignTasks = useMutation({
    mutationFn: async () => {
      const batchId = makeBatchId('tasks_bulk')
      return await tasksApi.bulkAssign({
        batchId,
        interns: selectedInternsPayload,
        tasks: tasksToAssign,
      })
    },
    onSuccess: (data) => {
      toast.success(`Bulk assignment queued (inserted: ${data?.insertedCount ?? 0})`)
      setExtraTasks([])
      setSelectedInternIds(new Set())
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Bulk assign failed'),
  })

  // Project bulk
  const [projectId, setProjectId] = useState('')
  const bulkAssignProject = useMutation({
    mutationFn: async () => {
      const batchId = makeBatchId('projects_bulk')
      return await projectsApi.bulkAssignInterns({
        projectId,
        internIds: uniq([...selectedInternIds]),
        batchId,
      })
    },
    onSuccess: (data) => {
      toast.success(`Bulk assignment queued (inserted: ${data?.insertedCount ?? 0})`)
      setSelectedInternIds(new Set())
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'interns'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Bulk assign failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bulk assignment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Assign tasks or projects to many interns in a single action (optimized for large scale).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === 'tasks' ? 'default' : 'outline'} onClick={() => setTab('tasks')}>
            Bulk tasks
          </Button>
          <Button variant={tab === 'projects' ? 'default' : 'outline'} onClick={() => setTab('projects')}>
            Bulk projects
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MultiSelectList
          title="Select interns"
          hint="Tip: use search + select visible to target large sets quickly."
          items={internItems}
          selectedIds={selectedInternIds}
          onToggle={toggleIntern}
          search={internSearch}
          setSearch={setInternSearch}
        />

        {tab === 'tasks' ? (
          <Card>
            <div className="text-sm font-semibold">Create tasks to assign</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Build onboarding checklist" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Project (optional)</label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                >
                  <option value="">—</option>
                  {(projects.data ?? []).map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name || p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Due date (optional)</label>
                <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={addTaskRow} className="w-full">
                  Add to batch
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Batch tasks</div>
                <div className="text-xs text-slate-500">{tasksToAssign.length}</div>
              </div>
              <div className="mt-2 space-y-2">
                {tasksToAssign.map((t, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t.projectId ? `Project: ${t.projectId} • ` : ''}
                      {t.priority ? `Priority: ${t.priority}` : ''}
                      {t.dueDate ? ` • Due: ${String(t.dueDate).slice(0, 10)}` : ''}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setExtraTasks((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {tasksToAssign.length === 0 ? <div className="text-sm text-slate-500">Add at least one task.</div> : null}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Assignments created: {selectedInternIds.size} interns × {tasksToAssign.length} tasks ={' '}
                {selectedInternIds.size * tasksToAssign.length}
              </div>
              <Button
                onClick={() => bulkAssignTasks.mutate()}
                disabled={bulkAssignTasks.isPending || selectedInternIds.size === 0 || tasksToAssign.length === 0}
              >
                {bulkAssignTasks.isPending ? 'Assigning…' : 'Assign tasks'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-sm font-semibold">Assign interns to a project</div>
            <div className="mt-3 space-y-2">
              <label className="text-sm font-medium">Project</label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Select project…</option>
                {(projects.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Assignments created: {selectedInternIds.size} interns
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => bulkAssignProject.mutate()}
                  disabled={bulkAssignProject.isPending || !projectId || selectedInternIds.size === 0}
                >
                  {bulkAssignProject.isPending ? 'Assigning…' : 'Assign interns'}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {interns.isLoading ? <div className="text-sm text-slate-500">Loading interns…</div> : null}
      {projects.isLoading ? <div className="text-sm text-slate-500">Loading projects…</div> : null}
    </div>
  )
}

