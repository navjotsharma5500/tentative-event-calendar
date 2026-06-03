import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Download, Upload, Edit2, Trash2, Plus, AlertTriangle,
  CheckCircle, X, Eye, EyeOff, Search, LogOut, ChevronLeft,
  Calendar, MapPin, Clock, Users, FileSpreadsheet, Shield
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatDate, formatTime } from '../utils/dateUtils'

const THAPAR_LOGO = 'https://ik.imagekit.io/7khjnlfow/email-assets/thapar_logo.png?updatedAt=1776888126772'

const EMPTY_FORM = {
  society: '', event: '', startDate: '', startTime: '',
  endDate: '', endTime: '', venue: '', description: '',
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(() => !!localStorage.getItem('adminPassword'))
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const fileInputRef = useRef()

  // Modals
  const [editModal, setEditModal] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [targetEvent, setTargetEvent] = useState(null)

  useEffect(() => {
    if (authenticated) fetchEvents()
  }, [authenticated])

  async function handleLogin(e) {
    e.preventDefault()
    setAuthLoading(true)
    try {
      await api.post('/admin/verify-password', { password })
      localStorage.setItem('adminPassword', password)
      setAuthenticated(true)
      toast.success('Welcome, Admin!')
    } catch {
      toast.error('Invalid password. Try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('adminPassword')
    setAuthenticated(false)
    setPassword('')
  }

  async function fetchEvents() {
    setLoading(true)
    try {
      const res = await api.get('/events')
      setEvents(res.data)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  async function downloadTemplate() {
    try {
      const res = await api.get('/admin/template', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = 'event-import-template.xlsx'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Template downloaded!')
    } catch {
      toast.error('Failed to download template')
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.xlsx')) { toast.error('Only .xlsx files are accepted'); return }

    const formData = new FormData()
    formData.append('file', file)
    const toastId = toast.loading('Importing events...')
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(res.data.message, { id: toastId })
      fetchEvents()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed', { id: toastId })
    } finally {
      e.target.value = ''
    }
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setAddModal(true)
  }

  function openEdit(ev) {
    setTargetEvent(ev)
    setForm({
      society: ev.society, event: ev.event,
      startDate: ev.startDate, startTime: ev.startTime,
      endDate: ev.endDate, endTime: ev.endTime,
      venue: ev.venue, description: ev.description || '',
    })
    setEditModal(true)
  }

  function openDelete(ev) {
    setTargetEvent(ev)
    setDeleteModal(true)
  }

  function openDetail(ev) {
    setTargetEvent(ev)
    setDetailModal(true)
  }

  async function handleSave(isEdit) {
    setFormLoading(true)
    try {
      if (isEdit) {
        await api.put(`/events/${targetEvent._id}`, form)
        toast.success('Event updated!')
        setEditModal(false)
      } else {
        await api.post('/events', form)
        toast.success('Event created!')
        setAddModal(false)
      }
      fetchEvents()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete() {
    setFormLoading(true)
    try {
      await api.delete(`/events/${targetEvent._id}`)
      toast.success('Event deleted!')
      setDeleteModal(false)
      fetchEvents()
    } catch {
      toast.error('Delete failed')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredEvents = events.filter(ev =>
    !search ||
    ev.event.toLowerCase().includes(search.toLowerCase()) ||
    ev.society.toLowerCase().includes(search.toLowerCase()) ||
    ev.venue.toLowerCase().includes(search.toLowerCase())
  )

  // ── Auth Screen ──────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1a2c89] to-[#8b0000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#8b0000] to-[#c62828] p-8 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 inline-block mb-4">
                <img src={THAPAR_LOGO} alt="Thapar" className="h-12 w-auto object-contain" />
              </div>
              <h1 className="font-display font-bold text-white text-2xl">Admin Access</h1>
              <p className="text-white/70 text-sm mt-1">Tentative Event Calendar</p>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Shield size={28} className="text-slate-600" />
                </div>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      className="input pl-9 pr-10"
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={authLoading}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  {authLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Lock size={16} /> Sign In</>
                  )}
                </button>
              </form>
              <div className="mt-6 text-center">
                <Link to="/" className="text-sm text-slate-500 hover:text-brand-600 flex items-center justify-center gap-1.5 transition-colors">
                  <ChevronLeft size={14} /> Back to Calendar
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Admin Dashboard ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#8b0000] via-[#c62828] to-[#1d4aeb] sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-xl p-1.5">
              <img src={THAPAR_LOGO} alt="Thapar" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg">Admin Dashboard</h1>
              <p className="text-white/60 text-xs">Tentative Event Calendar</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="btn-secondary text-xs px-3 py-1.5 hidden sm:flex">
              <ChevronLeft size={13} /> Public View
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: events.length, color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Conflicts', value: events.filter(e => e.conflict).length, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Upcoming', value: events.filter(e => e.status === 'Upcoming').length, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Live Now', value: events.filter(e => e.status === 'Live').length, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`card p-4 ${s.bg}`}>
              <p className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadTemplate} className="btn-secondary">
                <Download size={15} /> Download Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                <Upload size={15} /> Import Excel
              </button>
              <input type="file" ref={fileInputRef} accept=".xlsx" onChange={handleFileUpload} className="hidden" />
              <button onClick={openAdd} className="btn-primary">
                <Plus size={15} /> Add Event
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9 w-64" placeholder="Search events..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-display font-semibold text-slate-900">
              Events <span className="text-slate-400 font-normal text-sm ml-1">({filteredEvents.length})</span>
            </h2>
            <button onClick={fetchEvents} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center">
              <FileSpreadsheet size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No events found</p>
              <p className="text-slate-400 text-sm mt-1">Import an Excel file or add events manually</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Society', 'Event', 'Venue', 'Start Date', 'End Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {filteredEvents.map((ev, i) => (
                      <motion.tr
                        key={ev._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className={`hover:bg-slate-50 transition-colors ${ev.conflict ? 'bg-red-50/30' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700 whitespace-nowrap">{ev.society}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {ev.conflict && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                            <span className="font-medium text-slate-900 max-w-[180px] truncate">{ev.event}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{ev.venue}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <div>{formatDate(ev.startDate)}</div>
                          <div className="text-xs text-slate-400">{formatTime(ev.startTime)}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <div>{formatDate(ev.endDate)}</div>
                          <div className="text-xs text-slate-400">{formatTime(ev.endTime)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={ev.status} />
                            {ev.conflict && <span className="badge-conflict text-[10px] py-0.5"><AlertTriangle size={8} />Conflict</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openDetail(ev)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="View"
                            >
                              <Eye size={15} />
                            </button>
                            <button onClick={() => openEdit(ev)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => openDelete(ev)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={addModal || editModal}
        onClose={() => { setAddModal(false); setEditModal(false) }}
        title={editModal ? 'Edit Event' : 'Add New Event'}
        size="lg"
      >
        <EventForm
          form={form}
          setForm={setForm}
          onSave={() => handleSave(editModal)}
          onCancel={() => { setAddModal(false); setEditModal(false) }}
          loading={formLoading}
          isEdit={editModal}
        />
      </Modal>

      {/* ── Detail Modal ── */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Event Details">
        {targetEvent && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={targetEvent.status} />
              {targetEvent.conflict && <span className="badge-conflict"><AlertTriangle size={10} />Conflict</span>}
            </div>
            <h2 className="font-display font-bold text-slate-900 text-2xl">{targetEvent.event}</h2>
            <p className="text-brand-600 font-semibold">{targetEvent.society}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={14} className="text-brand-500" />{targetEvent.venue}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar size={14} className="text-green-500" />
                {formatDate(targetEvent.startDate)} → {formatDate(targetEvent.endDate)}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={14} className="text-amber-500" />
                {formatTime(targetEvent.startTime)} – {formatTime(targetEvent.endTime)}
              </div>
            </div>
            {targetEvent.description && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Description</p>
                <p className="text-sm text-slate-700">{targetEvent.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Event" size="sm">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Are you sure?</p>
              <p className="text-red-600 text-xs mt-0.5">This will permanently delete <strong>{targetEvent?.event}</strong>.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal(false)} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={formLoading} className="btn-danger flex-1 justify-center">
              {formLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 size={14} />Delete</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function EventForm({ form, setForm, onSave, onCancel, loading, isEdit }) {
  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Society *</label>
          <input className="input" placeholder="e.g. Computer Society" value={form.society} onChange={update('society')} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Event Name *</label>
          <input className="input" placeholder="e.g. Annual Hackathon" value={form.event} onChange={update('event')} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Start Date *</label>
          <input className="input" type="date" value={form.startDate} onChange={update('startDate')} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Start Time *</label>
          <input className="input" type="time" value={form.startTime} onChange={update('startTime')} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">End Date *</label>
          <input className="input" type="date" value={form.endDate} onChange={update('endDate')} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">End Time *</label>
          <input className="input" type="time" value={form.endTime} onChange={update('endTime')} required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Venue *</label>
          <input className="input" placeholder="e.g. Main Auditorium" value={form.venue} onChange={update('venue')} required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
          <textarea className="input min-h-[80px] resize-none" placeholder="Optional event description..."
            value={form.description} onChange={update('description')} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button onClick={onSave} disabled={loading} className="btn-primary flex-1 justify-center">
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><CheckCircle size={15} />{isEdit ? 'Save Changes' : 'Create Event'}</>
          }
        </button>
      </div>
    </div>
  )
}
