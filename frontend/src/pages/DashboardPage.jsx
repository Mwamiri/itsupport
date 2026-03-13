import { useQuery } from '@tanstack/react-query'
import { dashboardApi, visitsApi, ticketsApi } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  ClipboardList, CheckCircle, XCircle, Clock, AlertTriangle,
  Ticket, TrendingUp, Building2, Plus, ArrowRight, Loader2
} from 'lucide-react'
import clsx from 'clsx'

const COLORS = ['#2E75B6','#70AD47','#ED7D31','#C00000','#7030A0']

function KpiCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    open:        'bg-yellow-100 text-yellow-700',
    assigned:    'bg-blue-100 text-blue-700',
    in_progress: 'bg-orange-100 text-orange-700',
    resolved:    'bg-green-100 text-green-700',
    closed:      'bg-gray-100 text-gray-600',
    draft:       'bg-gray-100 text-gray-600',
    completed:   'bg-green-100 text-green-700',
    signed:      'bg-purple-100 text-purple-700',
  }
  return (
    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize', map[status] || 'bg-gray-100 text-gray-600')}>
      {status?.replace('_', ' ')}
    </span>
  )
}

const PRIORITY_COLOR = {
  critical: 'text-red-600', high: 'text-orange-500',
  medium:   'text-yellow-600', low: 'text-green-600'
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ['visits', 'recent'],
    queryFn:  () => visitsApi.list({ per_page: 5 }).then(r => r.data),
  })

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets', 'recent'],
    queryFn:  () => ticketsApi.list({ per_page: 5 }).then(r => r.data),
  })

  // Mock KPI data (replace with real API call)
  const kpis = {
    totalVisits:   visits?.total ?? 0,
    openTickets:   tickets?.data?.filter(t => ['open','assigned','in_progress'].includes(t.status)).length ?? 0,
    criticalIssues: tickets?.data?.filter(t => t.priority === 'critical').length ?? 0,
    resolved:      tickets?.data?.filter(t => t.status === 'resolved').length ?? 0,
  }

  // Chart data from visits
  const deptData = [
    { name: 'School',     issues: 12 },
    { name: 'Clinic',     issues: 8  },
    { name: 'Admin',      issues: 6  },
    { name: 'Finance',    issues: 4  },
    { name: 'HR',         issues: 3  },
  ]

  const statusData = [
    { name: 'Resolved',    value: 34 },
    { name: 'In Progress', value: 12 },
    { name: 'Unresolved',  value: 8  },
    { name: 'Pending',     value: 5  },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Welcome back, {user?.name} · {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        {['super_admin','technician'].includes(user?.role) && (
          <Link to="/visits/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Visit
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Visits"    value={kpis.totalVisits}    icon={ClipboardList}   color="bg-blue-600" />
        <KpiCard label="Open Tickets"    value={kpis.openTickets}    icon={Ticket}          color="bg-orange-500" />
        <KpiCard label="Critical Issues" value={kpis.criticalIssues} icon={AlertTriangle}   color="bg-red-600" />
        <KpiCard label="Resolved"        value={kpis.resolved}       icon={CheckCircle}     color="bg-green-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Issues by Department</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="issues" fill="#2E75B6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Issue Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                   dataKey="value" paddingAngle={3}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent visits + tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visits */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Site Visits</h2>
            <Link to="/visits" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {visitsLoading && (
              <div className="p-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
            {visits?.data?.map(visit => (
              <Link key={visit.id} to={`/visits/${visit.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800">{visit.client?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {visit.visit_reference} · {new Date(visit.visit_date).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <StatusBadge status={visit.status} />
              </Link>
            ))}
            {!visitsLoading && !visits?.data?.length && (
              <p className="text-sm text-gray-400 text-center py-8">No visits yet</p>
            )}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Tickets</h2>
            <Link to="/tickets" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {ticketsLoading && (
              <div className="p-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
            {tickets?.data?.map(ticket => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-gray-800 truncate">{ticket.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ticket.ticket_number} · {ticket.client?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={clsx('text-xs font-semibold capitalize', PRIORITY_COLOR[ticket.priority])}>
                    {ticket.priority}
                  </span>
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
            {!ticketsLoading && !tickets?.data?.length && (
              <p className="text-sm text-gray-400 text-center py-8">No tickets yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
