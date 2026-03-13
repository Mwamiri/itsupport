// ── CLIENT DASHBOARD ─────────────────────────────────────────────────────────
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, visitsApi, ticketsApi, reportsApi } from '../../utils/api'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  ClipboardList, Ticket, CheckCircle, Clock, Plus, ArrowRight,
  AlertTriangle, BarChart3, Loader2
} from 'lucide-react'
import clsx from 'clsx'

function StatCard({ label, value, icon: Icon, color, to }) {
  const card = (
    <div className={clsx('bg-white rounded-xl border p-5 flex items-center gap-4 transition-shadow hover:shadow-md', to && 'cursor-pointer')}>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

function StatusBadge({ status }) {
  const map = {
    open:'bg-yellow-100 text-yellow-700', assigned:'bg-blue-100 text-blue-700',
    in_progress:'bg-orange-100 text-orange-700', resolved:'bg-green-100 text-green-700',
    closed:'bg-gray-100 text-gray-500', completed:'bg-green-100 text-green-700',
    signed:'bg-purple-100 text-purple-700',
  }
  return <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize', map[status] || 'bg-gray-100 text-gray-500')}>{status?.replace('_',' ')}</span>
}

export default function ClientDashboard() {
  const { user } = useAuth()

  const { data: visits } = useQuery({
    queryKey: ['my-visits'],
    queryFn:  () => visitsApi.myVisits({ per_page: 5 }).then(r => r.data),
  })

  const { data: tickets } = useQuery({
    queryKey: ['my-tickets'],
    queryFn:  () => ticketsApi.myList({ per_page: 5 }).then(r => r.data),
  })

  const openTickets    = tickets?.data?.filter(t => ['open','assigned','in_progress'].includes(t.status)).length ?? 0
  const resolvedTickets= tickets?.data?.filter(t => t.status === 'resolved').length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user?.client?.name} — Client Portal</p>
        </div>
        <Link to="/client/tickets/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Submit Ticket
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Visits"    value={visits?.total ?? 0}     icon={ClipboardList} color="bg-blue-600"   to="/client/visits" />
        <StatCard label="Open Tickets"    value={openTickets}            icon={Ticket}        color="bg-orange-500" to="/client/tickets" />
        <StatCard label="Resolved"        value={resolvedTickets}        icon={CheckCircle}   color="bg-green-600"  to="/client/tickets" />
        <StatCard label="Reports"         value="View"                   icon={BarChart3}     color="bg-purple-600" to="/client/reports" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visits */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Site Visits</h2>
            <Link to="/client/visits" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              All visits <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {visits?.data?.map(v => (
              <Link key={v.id} to={`/client/visits/${v.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800">{v.visit_reference}</p>
                  <p className="text-xs text-gray-400">{new Date(v.visit_date).toLocaleDateString('en-GB')} · {v.site?.name || 'Main Site'}</p>
                </div>
                <StatusBadge status={v.status} />
              </Link>
            ))}
            {!visits?.data?.length && <p className="text-sm text-gray-400 text-center py-8">No visits yet</p>}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">My Tickets</h2>
            <Link to="/client/tickets" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              All tickets <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {tickets?.data?.map(t => (
              <Link key={t.id} to={`/client/tickets/${t.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.ticket_number} · {new Date(t.created_at).toLocaleDateString('en-GB')}</p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
            {!tickets?.data?.length && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400 mb-3">No tickets yet</p>
                <Link to="/client/tickets/new" className="text-xs text-blue-600 hover:underline">Submit your first ticket →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
