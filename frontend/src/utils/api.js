import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — auto logout
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (data) => api.post('/login', data),
  logout:         ()     => api.post('/logout'),
  me:             ()     => api.get('/me'),
  changePassword: (data) => api.put('/me/password', data),
  updateProfile:  (data) => api.put('/me', data),
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get:       (params) => api.get('/dashboard', { params }),
  getClient: ()       => api.get('/my/dashboard'),
}

// ── CLIENTS ───────────────────────────────────────────────────────────────────
export const clientsApi = {
  list:   (params) => api.get('/clients', { params }),
  get:    (id)     => api.get(`/clients/${id}`),
  create: (data)   => api.post('/clients', data),
  update: (id, d)  => api.put(`/clients/${id}`, d),
  delete: (id)     => api.delete(`/clients/${id}`),
}

// ── DEPARTMENTS ───────────────────────────────────────────────────────────────
export const departmentsApi = {
  list:   (clientId)          => api.get(`/clients/${clientId}/departments`),
  create: (clientId, data)    => api.post(`/clients/${clientId}/departments`, data),
  update: (clientId, id, data)=> api.put(`/clients/${clientId}/departments/${id}`, data),
  delete: (clientId, id)      => api.delete(`/clients/${clientId}/departments/${id}`),
}

// ── SITE VISITS ───────────────────────────────────────────────────────────────
export const visitsApi = {
  list:        (params)     => api.get('/site-visits', { params }),
  get:         (id)         => api.get(`/site-visits/${id}`),
  create:      (data)       => api.post('/site-visits', data),
  update:      (id, data)   => api.put(`/site-visits/${id}`, data),
  delete:      (id)         => api.delete(`/site-visits/${id}`),
  sign:        (id, data)   => api.post(`/site-visits/${id}/sign`, data),
  exportPdf:   (id)         => api.get(`/site-visits/${id}/pdf`, { responseType: 'blob' }),
  exportExcel: (id)         => api.get(`/site-visits/${id}/excel`, { responseType: 'blob' }),
  myVisits:    (params)     => api.get('/my/visits', { params }),
  myVisitDetail: (id)       => api.get(`/my/visits/${id}`),
}

// ── ISSUES ────────────────────────────────────────────────────────────────────
export const issuesApi = {
  list:   (visitId, params) => api.get(`/site-visits/${visitId}/issues`, { params }),
  create: (visitId, data)   => api.post(`/site-visits/${visitId}/issues`, data),
  update: (visitId, id, d)  => api.put(`/site-visits/${visitId}/issues/${id}`, d),
  delete: (visitId, id)     => api.delete(`/site-visits/${visitId}/issues/${id}`),
}

// ── NETWORK POINTS ────────────────────────────────────────────────────────────
export const networkApi = {
  list:   (visitId, params) => api.get(`/site-visits/${visitId}/network-points`, { params }),
  create: (visitId, data)   => api.post(`/site-visits/${visitId}/network-points`, data),
  update: (visitId, id, d)  => api.put(`/site-visits/${visitId}/network-points/${id}`, d),
  delete: (visitId, id)     => api.delete(`/site-visits/${visitId}/network-points/${id}`),
  lookup: (pointId)         => api.get(`/network-points/lookup/${pointId}`),
}

// ── EQUIPMENT ─────────────────────────────────────────────────────────────────
export const equipmentApi = {
  list:   (params) => api.get('/equipment', { params }),
  create: (data)   => api.post('/equipment', data),
  update: (id, d)  => api.put(`/equipment/${id}`, d),
  delete: (id)     => api.delete(`/equipment/${id}`),
}

// ── CREDENTIALS ───────────────────────────────────────────────────────────────
export const credentialsApi = {
  list:   (params) => api.get('/credentials', { params }),
  get:    (id)     => api.get(`/credentials/${id}`),
  create: (data)   => api.post('/credentials', data),
  update: (id, d)  => api.put(`/credentials/${id}`, d),
  delete: (id)     => api.delete(`/credentials/${id}`),
}

// ── TICKETS ───────────────────────────────────────────────────────────────────
export const ticketsApi = {
  list:           (params)     => api.get('/tickets', { params }),
  get:            (id)         => api.get(`/tickets/${id}`),
  update:         (id, data)   => api.put(`/tickets/${id}`, data),
  assign:         (id, data)   => api.post(`/tickets/${id}/assign`, data),
  addComment:     (id, data)   => api.post(`/tickets/${id}/comments`, data),
  // Client
  myList:         (params)     => api.get('/my/tickets', { params }),
  myCreate:       (data)       => api.post('/my/tickets', data),
  myGet:          (id)         => api.get(`/my/tickets/${id}`),
  myAddComment:   (id, data)   => api.post(`/my/tickets/${id}/comments`, data),
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  weekly:    (params) => api.get('/reports/weekly', { params }),
  monthly:   (params) => api.get('/reports/monthly', { params }),
  export:    (params) => api.get('/reports/export', { params, responseType: 'blob' }),
  myWeekly:  (params) => api.get('/my/reports/weekly', { params }),
  myMonthly: (params) => api.get('/my/reports/monthly', { params }),
}

// ── USERS ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list:         (params) => api.get('/users', { params }),
  get:          (id)     => api.get(`/users/${id}`),
  create:       (data)   => api.post('/users', data),
  update:       (id, d)  => api.put(`/users/${id}`, d),
  toggleActive: (id)     => api.put(`/users/${id}/toggle-active`),
}
