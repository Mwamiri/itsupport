import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketsApi, departmentsApi } from '../../utils/api'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Loader2, Send, ChevronLeft, AlertTriangle } from 'lucide-react'

const PRIORITIES = [
  { value: 'low',      label: '🟢 Low',      desc: 'Non-urgent, can wait' },
  { value: 'medium',   label: '🟡 Medium',   desc: 'Needs attention soon' },
  { value: 'high',     label: '🟠 High',     desc: 'Impacting work' },
  { value: 'critical', label: '🔴 Critical', desc: 'System down / urgent' },
]

export default function NewTicketPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', department_id: '',
    equipment: '', location: '', priority: 'medium',
  })

  const { data: departments } = useQuery({
    queryKey: ['departments', user?.client_id],
    queryFn:  () => departmentsApi.list(user.client_id).then(r => r.data),
    enabled:  !!user?.client_id,
  })

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description) {
      toast.error('Title and description are required')
      return
    }
    setSaving(true)
    try {
      const res = await ticketsApi.myCreate(form)
      toast.success(`Ticket ${res.data.ticket_number} submitted!`)
      qc.invalidateQueries(['my-tickets'])
      navigate(`/client/tickets/${res.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket')
    } finally {
      setSaving(false)
    }
  }

  const inputCls  = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls  = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit a Support Ticket</h1>
          <p className="text-gray-500 text-sm">Describe your issue and our team will respond promptly.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className={labelCls}>Issue Title *</label>
          <input className={inputCls} value={form.title} required
            placeholder="e.g. Printer not working in Finance office"
            onChange={e => set('title', e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>Description *</label>
          <textarea className={inputCls} rows={5} value={form.description} required
            placeholder="Please describe the issue in detail — when it started, what happens, any error messages..."
            onChange={e => set('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Department</label>
            <select className={inputCls + ' bg-white'} value={form.department_id}
              onChange={e => set('department_id', e.target.value)}>
              <option value="">Select department...</option>
              {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Location / Office</label>
            <input className={inputCls} value={form.location}
              placeholder="e.g. Block B, Room 3"
              onChange={e => set('location', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Equipment / Device</label>
            <input className={inputCls} value={form.equipment}
              placeholder="e.g. HP LaserJet Printer, Dell Laptop"
              onChange={e => set('equipment', e.target.value)} />
          </div>
        </div>

        {/* Priority selector */}
        <div>
          <label className={labelCls}>Priority</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIORITIES.map(p => (
              <label key={p.value} className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                form.priority === p.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name="priority" value={p.value} className="sr-only"
                  checked={form.priority === p.value}
                  onChange={() => set('priority', p.value)} />
                <span className="text-sm font-medium">{p.label}</span>
                <span className="text-xs text-gray-400">{p.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {form.priority === 'critical' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              <strong>Critical priority</strong> — For system-down emergencies, also contact your IT technician directly by phone for the fastest response.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {saving ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}
