import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Pages
import LoginPage        from './pages/LoginPage'
import DashboardPage    from './pages/DashboardPage'
import VisitsPage       from './pages/VisitsPage'
import VisitDetailPage  from './pages/VisitDetailPage'
import NewVisitPage     from './pages/NewVisitPage'
import NetworkAuditPage from './pages/NetworkAuditPage'
import CredentialsPage  from './pages/CredentialsPage'
import EquipmentPage    from './pages/EquipmentPage'
import TicketsPage      from './pages/TicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import ReportsPage      from './pages/ReportsPage'
import ClientsPage      from './pages/ClientsPage'
import UsersPage        from './pages/UsersPage'
import ProfilePage      from './pages/ProfilePage'
// Client portal
import ClientDashboard  from './pages/client/ClientDashboard'
import ClientVisits     from './pages/client/ClientVisits'
import ClientTickets    from './pages/client/ClientTickets'
import ClientReports    from './pages/client/ClientReports'
import NewTicketPage    from './pages/client/NewTicketPage'

import Layout from './components/Layout'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

function ProtectedRoute({ children, roles }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RoleRouter() {
  const { user } = useAuth()
  if (user?.role === 'client') return <Navigate to="/client" replace />
  return <Navigate to="/dashboard" replace />
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Role redirect */}
            <Route path="/" element={
              <ProtectedRoute><RoleRouter /></ProtectedRoute>
            } />

            {/* ── STAFF PORTAL (admin, manager, technician) ── */}
            <Route path="/" element={
              <ProtectedRoute roles={['super_admin','manager','technician']}>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard"   element={<DashboardPage />} />
              <Route path="visits"      element={<VisitsPage />} />
              <Route path="visits/new"  element={<NewVisitPage />} />
              <Route path="visits/:id"  element={<VisitDetailPage />} />
              <Route path="visits/:id/network" element={<NetworkAuditPage />} />
              <Route path="credentials" element={<CredentialsPage />} />
              <Route path="equipment"   element={<EquipmentPage />} />
              <Route path="tickets"     element={<TicketsPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage />} />
              <Route path="reports"     element={<ReportsPage />} />
              <Route path="profile"     element={<ProfilePage />} />

              {/* Admin + Manager only */}
              <Route path="clients" element={
                <ProtectedRoute roles={['super_admin','manager']}>
                  <ClientsPage />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute roles={['super_admin']}>
                  <UsersPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* ── CLIENT PORTAL ── */}
            <Route path="/client" element={
              <ProtectedRoute roles={['client']}>
                <Layout isClientPortal />
              </ProtectedRoute>
            }>
              <Route index          element={<ClientDashboard />} />
              <Route path="visits"  element={<ClientVisits />} />
              <Route path="visits/:id" element={<VisitDetailPage clientView />} />
              <Route path="tickets"    element={<ClientTickets />} />
              <Route path="tickets/new" element={<NewTicketPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage clientView />} />
              <Route path="reports"    element={<ClientReports />} />
              <Route path="profile"    element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
