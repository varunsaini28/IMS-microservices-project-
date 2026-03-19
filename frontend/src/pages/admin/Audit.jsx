import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { auditApi } from '../../services/auditApi'
import { exportToCsv } from '../../utils/exportToCsv'

export default function Audit() {
  const [routingKey, setRoutingKey] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const query = useQuery({
    queryKey: ['audit', { routingKey, startDate, endDate, page, limit }],
    queryFn: () => auditApi.list({ routingKey, startDate, endDate, page, limit }),
    placeholderData: keepPreviousData,
  })

  const logs = query.data?.logs ?? []
  const pagination = query.data?.pagination

  const exportRows = useMemo(
    () =>
      logs.map((l) => ({
        id: l._id,
        routingKey: l.routingKey,
        timestamp: l.timestamp,
        event: JSON.stringify(l.event ?? l.payload ?? l.data ?? {}),
      })),
    [logs]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Audit Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Filter by routing key and date range.
          </p>
        </div>
        <Button variant="outline" onClick={() => exportToCsv('audit.csv', exportRows)} disabled={logs.length === 0}>
          Export CSV (page)
        </Button>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <Input value={routingKey} onChange={(e) => setRoutingKey(e.target.value)} placeholder="routingKey (optional)" />
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button variant="outline" onClick={() => setPage(1)}>
            Apply
          </Button>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Routing key</th>
                <th className="px-2 py-2">Timestamp</th>
                <th className="px-2 py-2">Event (preview)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-t border-slate-200 dark:border-slate-800 align-top">
                  <td className="px-2 py-2 font-medium">{l.routingKey}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-2 py-2">
                    <pre className="max-w-[60ch] whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {JSON.stringify(l.event ?? l.payload ?? l.data ?? {}, null, 2).slice(0, 500)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {query.isLoading ? <div className="mt-3 text-sm text-slate-500">Loading…</div> : null}
          {!query.isLoading && logs.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">No logs found.</div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Page {pagination?.page ?? page} of {pagination?.pages ?? '—'} (total {pagination?.total ?? '—'})
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination ? page >= pagination.pages : false}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

