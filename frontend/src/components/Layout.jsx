import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, ClipboardList, Network, Monitor, KeyRound,
  Ticket, BarChart3, Users, Building2, UserCircle, LogOut,
  Menu, X, ChevronDown, Bell, Wrench, FileText
} from 'lucide-react'
import clsx from 'clsx'

const STAFF_NAV = [
  { to: '/dashboard',   label: 'Dashboard',     icon: LayoutDashboard, roles: ['super_admin','manager','technician'] },
  { to: '/visits',      label: 'Site Visits',   icon: ClipboardList,   roles: ['super_admin','manager','technician'] },
  { to: '/tickets',     label: 'Tickets',       icon: Ticket,          roles: ['super_admin','manager','technician'] },
  { to: '/equipment',   label: 'Equipment',     icon: Monitor,         roles: ['super_admin','manager','technician'] },
  { to: '/credentials', label: 'Credentials',   icon: KeyRound,        roles: ['super_admin','technician'] },
  { to: '/reports',     label: 'Reports',       icon: BarChart3,       roles: ['super_admin','manager'] },
  { to: '/clients',     label: 'Clients',       icon: Building2,       roles: ['super_admin','manager'] },
  { to: '/users',       label: 'Users',         icon: Users,           roles: ['super_admin'] },
]

const CLIENT_NAV = [
  { to: '/client',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/client/visits',   label: 'Visit Reports', icon: FileText },
  { to: '/client/tickets',  label: 'My Tickets', icon: Ticket },
  { to: '/client/reports',  label: 'Reports',    icon: BarChart3 },
]

const ROLE_COLORS = {
  super_admin: 'bg-red-600',
  manager:     'bg-purple-600',
  technician:  'bg-blue-600',
  client:      'bg-green-600',
}
const ROLE_LABELS = {
  super_admin: 'Super Admin',
  manager:     'Manager',
  technician:  'Technician',
  client:      'Client',
}

export default function Layout({ isClientPortal = false }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const navItems = isClientPortal
    ? CLIENT_NAV
    : STAFF_NAV.filter(n => n.roles.includes(user?.role))

  const basePath = isClientPortal ? '/client' : ''

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">IT Support</p>
            <p className="text-slate-400 text-xs">
              {isClientPortal ? 'Client Portal' : 'Management'}
            </p>
          </div>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-white"
                  onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/client' || item.to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <span className={clsx(
                'inline-block text-white text-xs px-2 py-0.5 rounded-full mt-0.5',
                ROLE_COLORS[user?.role]
              )}>
                {ROLE_LABELS[user?.role]}
              </span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <NavLink to={`${basePath}/profile`}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <UserCircle className="w-3.5 h-3.5" /> Profile
            </NavLink>
            <button onClick={logout}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-red-400 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden text-gray-500 hover:text-gray-700"
                  onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {/* Client name for staff */}
          {!isClientPortal && user?.role !== 'client' && (
            <div className="hidden sm:block text-xs text-gray-500">
              {user?.designation && <span>{user.designation}</span>}
            </div>
          )}
          {/* Client badge for client portal */}
          {isClientPortal && user?.client && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <Building2 className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">{user.client.name}</span>
            </div>
          )}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Bell className="w-4 h-4" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
