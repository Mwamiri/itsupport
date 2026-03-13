import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { visitsApi, clientsApi, departmentsApi, issuesApi, networkApi } from '../utils/api'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Save, ChevronRight, ChevronLeft, CheckCircle,
  Loader2, Search, AlertTriangle, Network, ClipboardList
} from 'lucide-react'
import clsx from 'clsx'

const STEPS = ['Site Cover', 'Visit Log', 'Network Audit', 'Sign Off']

const STATUSES   = ['resolved','in_progress','unresolved','recurring','pending_parts']
const PRIORITIES = ['critical','high','medium','low']
const SCOPE_ITEMS = [
  'General IT Support','Network / Cabling Audit','CCTV / NVR Check',
  'Printer Maintenance','Access Point Config','Server / UPS Check',
  'Laptop / Desktop Repair','Software / OS Issues','New Equipment Setup',
  'User Training','Procurement / Quotation','Emergency Callout',
]
const PORT_STATUSES = ['active','dead','intermittent','not_patched','disabled','reterminate']

function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
              i < current  ? 'bg-blue-600 border-blue-600 text-white'
            : i === current ? 'bg-white border-blue-600 text-blue-600'
            : 'bg-white border-gray-300 text-gray-400'
            )}>
              {i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={clsx('text-xs mt-1 whitespace-nowrap hidden sm:block',
              i === current ? 'text-blue-600 font-medium' : 'text-gray-400')}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={clsx('h-0.5 flex-1 mx-1 transition-colors',
              i < current ? 'bg-blue-600' : 'bg-gray-200')} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function NewVisitPage() {
  const navigate     = useNavigate()
  const qc           = useQueryClient()
  const [step, setStep] = useState(0)

  // ── COVER DATA ────────────────────────────────────────────────────────────
  const [cover, setCover] = useState({
    client_id: '', site_id: '', visit_date: new Date().toISOString().split('T')[0],
    time_in: '', time_out: '', next_visit_date: '', contract_number: '',
    client_representative: '', client_designation: '', scope: [], summary: '',
  })

  // ── ISSUES ────────────────────────────────────────────────────────────────
  const [issues, setIssues] = useState([{
    department_id:'', sub_area:'', equipment_type_id:'', equipment_custom:'',
    network_point_id:'', issue_description:'', root_cause:'', action_taken:'',
    status:'in_progress', resolved:'no', resolution_hours:'', parts_used:'',
    parts_cost:'', further_request:'', priority:'medium', followup_date:'', remarks:'',
  }])

  // ── NETWORK POINTS ────────────────────────────────────────────────────────
  const [netPoints, setNetPoints] = useState([{
    point_id:'', office_room:'', department_id:'', device_type:'',
    connected_to:'', switch_port:'', port_status:'active', speed_mbps:'',
    device_connected:'', issue:'', remarks:'', accompanied_by:'',
  }])

  const [visitId, setVisitId] = useState(null)
  const [saving, setSaving]   = useState(false)

  // Clients list
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn:  () => clientsApi.list({ per_page: 100 }).then(r => r.data.data),
  })

  // Departments for selected client
  const { data: departments } = useQuery({
    queryKey: ['departments', cover.client_id],
    queryFn:  () => departmentsApi.list(cover.client_id).then(r => r.data),
    enabled:  !!cover.client_id,
  })

  // Equipment types
  const { data: equipTypes } = useQuery({
    queryKey: ['equipment-types'],
    queryFn:  () => import('../utils/api').then(m => m.default.get('/equipment-types')).then(r => r.data),
  })

  const toggleScope = (item) => {
    setCover(p => ({
      ...p,
      scope: p.scope.includes(item) ? p.scope.filter(s => s !== item) : [...p.scope, item]
    }))
  }

  // ── CREATE VISIT (after step 0) ───────────────────────────────────────────
  const handleCoverNext = async () => {
    if (!cover.client_id || !cover.visit_date) {
      toast.error('Client and visit date are required')
      return
    }
    setSaving(true)
    try {
      const res = await visitsApi.create(cover)
      setVisitId(res.data.id)
      toast.success(`Visit ${res.data.visit_reference} created!`)
      setStep(1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create visit')
    } finally {
      setSaving(false)
    }
  }

  // ── SAVE ISSUES ───────────────────────────────────────────────────────────
  const handleIssuesSave = async () => {
    setSaving(true)
    try {
      for (const issue of issues) {
        if (!issue.issue_description) continue
        await issuesApi.create(visitId, issue)
      }
      toast.success('Issues saved!')
      setStep(2)
    } catch (err) {
      toast.error('Failed to save some issues')
    } finally {
      setSaving(false)
    }
  }

  // ── SAVE NETWORK POINTS ───────────────────────────────────────────────────
  const handleNetworkSave = async () => {
    setSaving(true)
    try {
      for (const pt of netPoints) {
        if (!pt.point_id) continue
        await networkApi.create(visitId, pt)
      }
      toast.success('Network points saved!')
      setStep(3)
    } catch (err) {
      toast.error('Failed to save network points')
    } finally {
      setSaving(false)
    }
  }

  // ── SIGN OFF ──────────────────────────────────────────────────────────────
  const [sigName, setSigName] = useState('')
  const handleSignOff = async () => {
    if (!sigName) { toast.error('Enter your name to sign'); return }
    setSaving(true)
    try {
      await visitsApi.sign(visitId, { signer_type: 'technician', signer_name: sigName })
      await visitsApi.update(visitId, { status: 'completed' })
      toast.success('Visit completed and signed!')
      qc.invalidateQueries(['visits'])
      navigate(`/visits/${visitId}`)
    } catch (err) {
      toast.error('Failed to sign off')
    } finally {
      setSaving(false)
    }
  }

  const addIssue = () => setIssues(p => [...p, {
    department_id:'', sub_area:'', equipment_type_id:'', equipment_custom:'',
    network_point_id:'', issue_description:'', root_cause:'', action_taken:'',
    status:'in_progress', resolved:'no', resolution_hours:'', parts_used:'',
    parts_cost:'', further_request:'', priority:'medium', followup_date:'', remarks:'',
  }])

  const updateIssue = (i, field, val) =>
    setIssues(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const removeIssue = (i) => setIssues(p => p.filter((_, idx) => idx !== i))

  const addNetPoint = () => setNetPoints(p => [...p, {
    point_id:'', office_room:'', department_id:'', device_type:'',
    connected_to:'', switch_port:'', port_status:'active', speed_mbps:'',
    device_connected:'', issue:'', remarks:'', accompanied_by:'',
  }])

  const updateNet = (i, field, val) =>
    setNetPoints(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const removeNet = (i) => setNetPoints(p => p.filter((_, idx) => idx !== i))

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'
  const selectCls = inputCls + ' bg-white'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Site Visit</h1>
        <p className="text-gray-500 text-sm mt-0.5">Complete all steps to log a full site visit report</p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {/* ── STEP 0: SITE COVER ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" /> Site Cover Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Client / Organisation *</label>
              <select className={selectCls} value={cover.client_id}
                onChange={e => setCover(p => ({ ...p, client_id: e.target.value, site_id: '' }))}>
                <option value="">Select client...</option>
                {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Site / Location</label>
              <input className={inputCls} value={cover.site_id} placeholder="Site or building"
                onChange={e => setCover(p => ({ ...p, site_id: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Visit Date *</label>
              <input type="date" className={inputCls} value={cover.visit_date}
                onChange={e => setCover(p => ({ ...p, visit_date: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Next Visit Date</label>
              <input type="date" className={inputCls} value={cover.next_visit_date}
                onChange={e => setCover(p => ({ ...p, next_visit_date: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Time In</label>
              <input type="time" className={inputCls} value={cover.time_in}
                onChange={e => setCover(p => ({ ...p, time_in: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Time Out</label>
              <input type="time" className={inputCls} value={cover.time_out}
                onChange={e => setCover(p => ({ ...p, time_out: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Contract / PO Number</label>
              <input className={inputCls} value={cover.contract_number}
                onChange={e => setCover(p => ({ ...p, contract_number: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Client Representative</label>
              <input className={inputCls} value={cover.client_representative}
                onChange={e => setCover(p => ({ ...p, client_representative: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Client Designation</label>
              <input className={inputCls} value={cover.client_designation}
                onChange={e => setCover(p => ({ ...p, client_designation: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Scope of Visit (tick all that apply)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {SCOPE_ITEMS.map(item => (
                <label key={item} className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors',
                  cover.scope.includes(item)
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                )}>
                  <input type="checkbox" className="rounded" checked={cover.scope.includes(item)}
                    onChange={() => toggleScope(item)} />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Visit Summary / Notes</label>
            <textarea className={inputCls} rows={3} value={cover.summary}
              onChange={e => setCover(p => ({ ...p, summary: e.target.value }))}
              placeholder="Overall notes for this visit..." />
          </div>

          <div className="flex justify-end">
            <button onClick={handleCoverNext} disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Next: Log Issues <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 1: VISIT LOG / ISSUES ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            💡 Enter a <strong>Network Point ID</strong> in any issue row to auto-link it to a network point logged in Step 3.
          </div>

          {issues.map((issue, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Issue #{i + 1}</h3>
                {issues.length > 1 && (
                  <button onClick={() => removeIssue(i)}
                    className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Department</label>
                  <select className={selectCls} value={issue.department_id}
                    onChange={e => updateIssue(i, 'department_id', e.target.value)}>
                    <option value="">Select...</option>
                    {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Sub-Area / Room</label>
                  <input className={inputCls} value={issue.sub_area} placeholder="e.g. Server Room"
                    onChange={e => updateIssue(i, 'sub_area', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Equipment Type</label>
                  <select className={selectCls} value={issue.equipment_type_id}
                    onChange={e => updateIssue(i, 'equipment_type_id', e.target.value)}>
                    <option value="">Select...</option>
                    {equipTypes?.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                  </select>
                </div>
                {issue.equipment_type_id === 'other' && (
                  <div>
                    <label className={labelCls}>Custom Equipment (specify)</label>
                    <input className={inputCls} value={issue.equipment_custom}
                      placeholder="Describe the equipment..."
                      onChange={e => updateIssue(i, 'equipment_custom', e.target.value)} />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Network Point ID (auto-links)</label>
                  <input className={inputCls} value={issue.network_point_id} placeholder="e.g. AP-01"
                    onChange={e => updateIssue(i, 'network_point_id', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <select className={selectCls} value={issue.priority}
                    onChange={e => updateIssue(i, 'priority', e.target.value)}>
                    {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={selectCls} value={issue.status}
                    onChange={e => updateIssue(i, 'status', e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Resolved</label>
                  <select className={selectCls} value={issue.resolved}
                    onChange={e => updateIssue(i, 'resolved', e.target.value)}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Resolution Time (hrs)</label>
                  <input type="number" className={inputCls} value={issue.resolution_hours}
                    min="0" step="0.5"
                    onChange={e => updateIssue(i, 'resolution_hours', e.target.value)} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Issue Description *</label>
                  <textarea className={inputCls} rows={2} value={issue.issue_description}
                    placeholder="Describe the issue clearly..."
                    onChange={e => updateIssue(i, 'issue_description', e.target.value)} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Root Cause</label>
                  <textarea className={inputCls} rows={2} value={issue.root_cause}
                    onChange={e => updateIssue(i, 'root_cause', e.target.value)} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Action Taken</label>
                  <textarea className={inputCls} rows={2} value={issue.action_taken}
                    onChange={e => updateIssue(i, 'action_taken', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Parts / Materials Used</label>
                  <input className={inputCls} value={issue.parts_used}
                    onChange={e => updateIssue(i, 'parts_used', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Parts Cost</label>
                  <input type="number" className={inputCls} value={issue.parts_cost}
                    min="0" step="0.01"
                    onChange={e => updateIssue(i, 'parts_cost', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Follow-up Date</label>
                  <input type="date" className={inputCls} value={issue.followup_date}
                    onChange={e => updateIssue(i, 'followup_date', e.target.value)} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Further Request</label>
                  <textarea className={inputCls} rows={2} value={issue.further_request}
                    placeholder="Any follow-up procurement, upgrade or action needed..."
                    onChange={e => updateIssue(i, 'further_request', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addIssue}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-300 hover:border-blue-400 px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Another Issue
          </button>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleIssuesSave} disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save & Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: NETWORK AUDIT ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 text-sm text-teal-700">
            🌐 Walk each office with the admin. The <strong>Point ID</strong> you enter (e.g. AP-01, SW-B3) will auto-populate into the visit log issues that reference it.
          </div>

          {netPoints.map((pt, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Network className="w-4 h-4 text-teal-600" /> Point #{i + 1}
                </h3>
                {netPoints.length > 1 && (
                  <button onClick={() => removeNet(i)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Point ID * (e.g. AP-01)</label>
                  <input className={inputCls} value={pt.point_id} placeholder="AP-01"
                    onChange={e => updateNet(i, 'point_id', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Office / Room</label>
                  <input className={inputCls} value={pt.office_room} placeholder="e.g. Server Room"
                    onChange={e => updateNet(i, 'office_room', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <select className={selectCls} value={pt.department_id}
                    onChange={e => updateNet(i, 'department_id', e.target.value)}>
                    <option value="">Select...</option>
                    {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Device Type</label>
                  <input className={inputCls} value={pt.device_type} placeholder="Access Point, Switch..."
                    onChange={e => updateNet(i, 'device_type', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Connected To</label>
                  <input className={inputCls} value={pt.connected_to} placeholder="SW-01 Port 5"
                    onChange={e => updateNet(i, 'connected_to', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Switch Port / VLAN</label>
                  <input className={inputCls} value={pt.switch_port}
                    onChange={e => updateNet(i, 'switch_port', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Port Status</label>
                  <select className={selectCls} value={pt.port_status}
                    onChange={e => updateNet(i, 'port_status', e.target.value)}>
                    {PORT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Speed (Mbps)</label>
                  <input className={inputCls} value={pt.speed_mbps} placeholder="100 / 1000"
                    onChange={e => updateNet(i, 'speed_mbps', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Device Connected</label>
                  <input className={inputCls} value={pt.device_connected} placeholder="PC name or device"
                    onChange={e => updateNet(i, 'device_connected', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Accompanied By (Admin)</label>
                  <input className={inputCls} value={pt.accompanied_by}
                    onChange={e => updateNet(i, 'accompanied_by', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Issue / Remarks</label>
                  <textarea className={inputCls} rows={2} value={pt.issue}
                    onChange={e => updateNet(i, 'issue', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addNetPoint}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium border border-teal-300 hover:border-teal-400 px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Network Point
          </button>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-600 border border-gray-300 hover:border-gray-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleNetworkSave} disabled={saving}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save & Sign Off <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: SIGN OFF ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Ready to Sign Off</h2>
            <p className="text-gray-500 text-sm mt-1">
              All visit data has been saved. Sign to complete this report.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Technician */}
            <div className="border border-blue-200 rounded-xl p-5 bg-blue-50">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">🔧 Technician Sign-Off</h3>
              <label className={labelCls}>Full Name *</label>
              <input className={inputCls + ' bg-white'} value={sigName}
                placeholder="Your full name"
                onChange={e => setSigName(e.target.value)} />
              <div className="mt-3 h-16 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                <span className="text-xs text-blue-400">Digital signature — name above acts as signature</span>
              </div>
            </div>

            {/* Client */}
            <div className="border border-green-200 rounded-xl p-5 bg-green-50">
              <h3 className="text-sm font-semibold text-green-800 mb-3">✅ Client Counter-Signature</h3>
              <p className="text-xs text-green-700">
                The client can sign via the <strong>Client Portal</strong> after you submit, or you can record their acknowledgement here.
              </p>
              <div className="mt-3 h-16 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center">
                <span className="text-xs text-green-400">Client signs via portal or on-site</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 text-center">
            I confirm that issues, actions and findings documented in this report are accurate and reflect the work carried out during this visit.
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)}
              className="flex items-center gap-2 text-gray-600 border border-gray-300 text-sm font-medium px-4 py-2 rounded-lg">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleSignOff} disabled={saving || !sigName}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <CheckCircle className="w-4 h-4" /> Complete & Sign Visit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
