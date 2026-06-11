import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Download, Upload, Edit2, Trash2, Plus, AlertTriangle,
  CheckCircle, X, Eye, EyeOff, Search, LogOut, ChevronLeft,
  Calendar, MapPin, Clock, Users, FileSpreadsheet, Shield, Settings, Palette
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatDate, formatTime } from '../utils/dateUtils'
import { clearTcAdminSession, isTcAdminAuthenticated, setTcAdminSession } from '../utils/adminAuth'

const THAPAR_LOGO = 'https://ik.imagekit.io/7khjnlfow/email-assets/Thapar_Logo.png?updatedAt=1769371086744'

const EMPTY_FORM = {
  society: '', event: '', startDate: '', startTime: '',
  endDate: '', endTime: '', venue: '', description: '',
}

const EMPTY_CATEGORY_FORM = {
  name: '',
  color: '#4CAF50',
  description: '',
  isActive: true,
  showDescription: true,
}

const EMPTY_ASSIGNMENT_FORM = {
  type: 'single',
  date: '',
  startDate: '',
  endDate: '',
  categoryId: '',
}

const EMPTY_HOLIDAY_FORM = {
  date: '',
  description: '',
}

const EMPTY_TEACHING_MAPPING_FORM = {
  nonTeachingDate: '',
  teachingDates: [''],
}

const EMPTY_EXPORT_FILTERS = {
  startDate: '',
  endDate: '',
  venue: '',
  society: '',
}

export default function AdminPage({ loginOnly = false }) {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(() => !loginOnly && isTcAdminAuthenticated())
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
  const [exportModal, setExportModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [exportFilters, setExportFilters] = useState(EMPTY_EXPORT_FILTERS)
  const [formLoading, setFormLoading] = useState(false)
  const [targetEvent, setTargetEvent] = useState(null)
  const [colorSettingsModal, setColorSettingsModal] = useState(false)
  const [colorTab, setColorTab] = useState('categories')
  const [colorCategories, setColorCategories] = useState([])
  const [dateAssignments, setDateAssignments] = useState({ single: [], ranges: [] })
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM)
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT_FORM)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [colorLoading, setColorLoading] = useState(false)
  const [dateDescriptionModal, setDateDescriptionModal] = useState(false)
  const [dateDescriptionTab, setDateDescriptionTab] = useState('holidays')
  const [dateDescriptions, setDateDescriptions] = useState({ holidays: [], teachingMappings: [] })
  const [holidayForm, setHolidayForm] = useState(EMPTY_HOLIDAY_FORM)
  const [teachingMappingForm, setTeachingMappingForm] = useState(EMPTY_TEACHING_MAPPING_FORM)
  const [editingHoliday, setEditingHoliday] = useState(null)
  const [editingTeachingMapping, setEditingTeachingMapping] = useState(null)
  const [dateDescriptionLoading, setDateDescriptionLoading] = useState(false)

  useEffect(() => {
    if (authenticated) {
      fetchEvents()
      fetchColorSettings()
      fetchDateDescriptions()
    }
  }, [authenticated])

  async function handleLogin(e) {
    e.preventDefault()
    setAuthLoading(true)
    try {
      await api.post('/admin/verify-password', { password })
      setTcAdminSession(password)
      setAuthenticated(true)
      navigate('/admin', { replace: true })
      toast.success('Welcome, Admin!')
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Invalid password. Try again.')
      } else {
        toast.error('Admin API is not reachable. Start the backend server and try again.')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    clearTcAdminSession()
    setAuthenticated(false)
    setPassword('')
    navigate('/admin/login', { replace: true })
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

  async function fetchColorSettings() {
    try {
      const [categoriesRes, assignmentsRes] = await Promise.all([
        api.get('/color-categories'),
        api.get('/date-color-assignments'),
      ])
      setColorCategories(categoriesRes.data)
      setDateAssignments(assignmentsRes.data)
      setAssignmentForm(f => ({
        ...f,
        categoryId: f.categoryId || categoriesRes.data[0]?._id || '',
      }))
    } catch {
      toast.error('Failed to load colour settings')
    }
  }

  function openColorSettings() {
    setColorSettingsModal(true)
    fetchColorSettings()
  }

  async function fetchDateDescriptions() {
    try {
      const res = await api.get('/date-descriptions')
      setDateDescriptions(res.data)
    } catch {
      toast.error('Failed to load date descriptions')
    }
  }

  function openDateDescriptions() {
    setDateDescriptionModal(true)
    fetchDateDescriptions()
  }

  function resetHolidayForm() {
    setEditingHoliday(null)
    setHolidayForm(EMPTY_HOLIDAY_FORM)
  }

  function editHoliday(holiday) {
    setEditingHoliday(holiday)
    setHolidayForm({
      date: holiday.date,
      description: holiday.description,
    })
  }

  async function saveHoliday() {
    if (!holidayForm.date || !holidayForm.description.trim()) {
      toast.error('Date and description are required')
      return
    }
    setDateDescriptionLoading(true)
    try {
      if (editingHoliday) {
        await api.put(`/date-descriptions/holidays/${editingHoliday._id}`, holidayForm)
        toast.success('Holiday updated')
      } else {
        await api.post('/date-descriptions/holidays', holidayForm)
        toast.success('Holiday saved')
      }
      resetHolidayForm()
      fetchDateDescriptions()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save holiday')
    } finally {
      setDateDescriptionLoading(false)
    }
  }

  async function deleteHoliday(holiday) {
    setDateDescriptionLoading(true)
    try {
      await api.delete(`/date-descriptions/holidays/${holiday._id}`)
      toast.success('Holiday deleted')
      fetchDateDescriptions()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete holiday')
    } finally {
      setDateDescriptionLoading(false)
    }
  }

  function resetTeachingMappingForm() {
    setEditingTeachingMapping(null)
    setTeachingMappingForm(EMPTY_TEACHING_MAPPING_FORM)
  }

  function editTeachingMapping(mapping) {
    setEditingTeachingMapping(mapping)
    setTeachingMappingForm({
      nonTeachingDate: mapping.nonTeachingDate,
      teachingDates: mapping.teachingDates?.length ? mapping.teachingDates : [''],
    })
  }

  async function saveTeachingMapping() {
    const teachingDates = teachingMappingForm.teachingDates.map(date => date.trim()).filter(Boolean)
    if (!teachingMappingForm.nonTeachingDate || teachingDates.length === 0) {
      toast.error('Non-teaching date and at least one teaching date are required')
      return
    }
    setDateDescriptionLoading(true)
    try {
      const payload = { nonTeachingDate: teachingMappingForm.nonTeachingDate, teachingDates }
      if (editingTeachingMapping) {
        await api.put(`/date-descriptions/teaching-mappings/${editingTeachingMapping._id}`, payload)
        toast.success('Teaching mapping updated')
      } else {
        await api.post('/date-descriptions/teaching-mappings', payload)
        toast.success('Teaching mapping saved')
      }
      resetTeachingMappingForm()
      fetchDateDescriptions()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save teaching mapping')
    } finally {
      setDateDescriptionLoading(false)
    }
  }

  async function deleteTeachingMapping(mapping) {
    setDateDescriptionLoading(true)
    try {
      await api.delete(`/date-descriptions/teaching-mappings/${mapping._id}`)
      toast.success('Teaching mapping deleted')
      fetchDateDescriptions()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete teaching mapping')
    } finally {
      setDateDescriptionLoading(false)
    }
  }

  function resetCategoryForm() {
    setEditingCategory(null)
    setCategoryForm(EMPTY_CATEGORY_FORM)
  }

  function editCategory(category) {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      color: category.color,
      description: category.description,
      isActive: category.isActive,
      showDescription: category.showDescription !== false,
    })
  }

  async function saveCategory() {
    if (!categoryForm.name.trim() || !categoryForm.description.trim()) {
      toast.error('Category name and description are required')
      return
    }
    setColorLoading(true)
    try {
      if (editingCategory) {
        await api.put(`/color-categories/${editingCategory._id}`, categoryForm)
        toast.success('Colour category updated')
      } else {
        await api.post('/color-categories', categoryForm)
        toast.success('Colour category created')
      }
      resetCategoryForm()
      fetchColorSettings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save category')
    } finally {
      setColorLoading(false)
    }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Delete "${category.name}" and its date assignments?`)) return
    setColorLoading(true)
    try {
      await api.delete(`/color-categories/${category._id}`)
      toast.success('Colour category deleted')
      fetchColorSettings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete category')
    } finally {
      setColorLoading(false)
    }
  }

  function resetAssignmentForm() {
    setEditingAssignment(null)
    setAssignmentForm({
      ...EMPTY_ASSIGNMENT_FORM,
      categoryId: colorCategories[0]?._id || '',
    })
  }

  function editAssignment(assignment, type) {
    setEditingAssignment({ ...assignment, type })
    setAssignmentForm({
      type,
      date: assignment.date || '',
      startDate: assignment.startDate || '',
      endDate: assignment.endDate || '',
      categoryId: assignment.categoryId?._id || assignment.categoryId || '',
    })
  }

  async function saveAssignment() {
    if (!assignmentForm.categoryId) {
      toast.error('Select a colour category')
      return
    }
    if (assignmentForm.type === 'single' && !assignmentForm.date) {
      toast.error('Select a date')
      return
    }
    if (assignmentForm.type === 'range' && (!assignmentForm.startDate || !assignmentForm.endDate)) {
      toast.error('Select start and end dates')
      return
    }
    setColorLoading(true)
    try {
      if (editingAssignment) {
        if (editingAssignment.type !== assignmentForm.type) {
          await api.delete(`/date-color-assignments/${editingAssignment._id}`)
          await api.post('/date-color-assignments', assignmentForm)
        } else {
          await api.put(`/date-color-assignments/${editingAssignment._id}`, assignmentForm)
        }
        toast.success('Date assignment updated')
      } else {
        await api.post('/date-color-assignments', assignmentForm)
        toast.success('Date assignment saved')
      }
      resetAssignmentForm()
      fetchColorSettings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save assignment')
    } finally {
      setColorLoading(false)
    }
  }

  async function deleteAssignment(assignment) {
    setColorLoading(true)
    try {
      await api.delete(`/date-color-assignments/${assignment._id}`)
      toast.success('Date assignment removed')
      fetchColorSettings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove assignment')
    } finally {
      setColorLoading(false)
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

  async function downloadEventsExcel() {
    try {
      const params = {}
      if (exportFilters.startDate) params.startDate = exportFilters.startDate
      if (exportFilters.endDate) params.endDate = exportFilters.endDate
      if (exportFilters.venue) params.venue = exportFilters.venue
      if (exportFilters.society) params.society = exportFilters.society

      const res = await api.get('/admin/export-events', { params, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'tentative-calendar-events.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Events Excel downloaded')
      setExportModal(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to download events Excel')
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

  async function handleIgnoreConflict(ev) {
    setFormLoading(true)
    try {
      await api.patch(`/events/${ev._id}/ignore-conflict`)
      toast.success('Conflict ignored')
      fetchEvents()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to ignore conflict')
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

  const eventVenues = [...new Set(events.map(ev => ev.venue).filter(Boolean))].sort()
  const eventSocieties = [...new Set(events.map(ev => ev.society).filter(Boolean))].sort()

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
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl p-1 bg-white">
              <img src={THAPAR_LOGO} alt="Thapar" className="h-12 w-auto object-contain" />
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-900 text-lg">Admin Dashboard</h1>
              <p className="text-brand-600 font-semibold text-xs">Tentative Event Calendar</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="btn-secondary text-xs px-3 py-1.5 hidden sm:flex">
              <ChevronLeft size={13} /> Public View
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-600 hover:text-red-600 text-sm font-semibold px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
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
              <button onClick={() => setExportModal(true)} className="btn-secondary">
                <Download size={15} /> Download Excel
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                <Upload size={15} /> Import Excel
              </button>
              <input type="file" ref={fileInputRef} accept=".xlsx" onChange={handleFileUpload} className="hidden" />
              <button onClick={openAdd} className="btn-primary">
                <Plus size={15} /> Add Event
              </button>
              <button onClick={openColorSettings} className="btn-secondary">
                <Settings size={15} /> Colour Settings
              </button>
              <button onClick={openDateDescriptions} className="btn-secondary">
                <Calendar size={15} /> Dates Description
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
                            {ev.conflict && (
                              <button onClick={() => handleIgnoreConflict(ev)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                                title="Ignore Conflicts"
                              >
                                Ignore Conflicts
                              </button>
                            )}
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

      <Modal isOpen={exportModal} onClose={() => setExportModal(false)} title="Download Events Excel" size="md">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">From Date</label>
              <input
                type="date"
                className="input"
                value={exportFilters.startDate}
                onChange={e => setExportFilters(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                className="input"
                value={exportFilters.endDate}
                onChange={e => setExportFilters(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Venue</label>
              <select
                className="input"
                value={exportFilters.venue}
                onChange={e => setExportFilters(f => ({ ...f, venue: e.target.value }))}
              >
                <option value="">All Venues</option>
                {eventVenues.map(venue => <option key={venue} value={venue}>{venue}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Society</label>
              <select
                className="input"
                value={exportFilters.society}
                onChange={e => setExportFilters(f => ({ ...f, society: e.target.value }))}
              >
                <option value="">All Societies</option>
                {eventSocieties.map(society => <option key={society} value={society}>{society}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setExportFilters(EMPTY_EXPORT_FILTERS)}
              className="btn-secondary flex-1 justify-center"
            >
              Clear
            </button>
            <button onClick={downloadEventsExcel} className="btn-primary flex-1 justify-center">
              <Download size={15} /> Download
            </button>
          </div>
        </div>
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

      <Modal
        isOpen={colorSettingsModal}
        onClose={() => setColorSettingsModal(false)}
        title="Colour Settings Management"
        size="xl"
      >
        <div className="p-6 space-y-5">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {[
              { id: 'categories', label: 'Colour Legend' },
              { id: 'assignments', label: 'Date Assignments' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setColorTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  colorTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {colorTab === 'categories' ? (
            <ColorCategoryPanel
              categories={colorCategories}
              form={categoryForm}
              setForm={setCategoryForm}
              editingCategory={editingCategory}
              onSave={saveCategory}
              onEdit={editCategory}
              onDelete={deleteCategory}
              onCancel={resetCategoryForm}
              loading={colorLoading}
            />
          ) : (
            <DateAssignmentPanel
              categories={colorCategories}
              assignments={dateAssignments}
              form={assignmentForm}
              setForm={setAssignmentForm}
              editingAssignment={editingAssignment}
              onSave={saveAssignment}
              onEdit={editAssignment}
              onDelete={deleteAssignment}
              onCancel={resetAssignmentForm}
              loading={colorLoading}
            />
          )}
        </div>
      </Modal>

      <Modal
        isOpen={dateDescriptionModal}
        onClose={() => setDateDescriptionModal(false)}
        title="Dates Description"
        size="xl"
      >
        <div className="p-6 space-y-5">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {[
              { id: 'holidays', label: 'Holiday' },
              { id: 'teaching', label: 'Non Teaching to Teaching' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateDescriptionTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateDescriptionTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {dateDescriptionTab === 'holidays' ? (
            <HolidayDescriptionPanel
              holidays={dateDescriptions.holidays || []}
              form={holidayForm}
              setForm={setHolidayForm}
              editingHoliday={editingHoliday}
              onSave={saveHoliday}
              onEdit={editHoliday}
              onDelete={deleteHoliday}
              onCancel={resetHolidayForm}
              loading={dateDescriptionLoading}
            />
          ) : (
            <TeachingMappingPanel
              mappings={dateDescriptions.teachingMappings || []}
              form={teachingMappingForm}
              setForm={setTeachingMappingForm}
              editingMapping={editingTeachingMapping}
              onSave={saveTeachingMapping}
              onEdit={editTeachingMapping}
              onDelete={deleteTeachingMapping}
              onCancel={resetTeachingMappingForm}
              loading={dateDescriptionLoading}
            />
          )}
        </div>
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

function HolidayDescriptionPanel({
  holidays,
  form,
  setForm,
  editingHoliday,
  onSave,
  onEdit,
  onDelete,
  onCancel,
  loading,
}) {
  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div>
          <h3 className="font-display font-bold text-slate-900">{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</h3>
          <p className="text-xs text-slate-500 mt-1">This list appears under the public calendar.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Date *</label>
          <input type="date" className="input" value={form.date} onChange={update('date')} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Description *</label>
          <input className="input" value={form.description} onChange={update('description')} placeholder="Gurupurab Diwas" />
        </div>
        <div className="flex gap-2">
          <button onClick={onSave} disabled={loading} className="btn-primary flex-1 justify-center">
            <CheckCircle size={15} /> {editingHoliday ? 'Update' : 'Save'}
          </button>
          {editingHoliday && <button onClick={onCancel} className="btn-secondary justify-center">Cancel</button>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-display font-bold text-slate-900">Holidays</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {holidays.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No holidays added yet.</div>
          ) : (
            holidays.map(holiday => (
              <div key={holiday._id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{formatDate(holiday.date)}</p>
                  <p className="text-sm text-slate-500 mt-1">{holiday.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onEdit(holiday)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => onDelete(holiday)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function TeachingMappingPanel({
  mappings,
  form,
  setForm,
  editingMapping,
  onSave,
  onEdit,
  onDelete,
  onCancel,
  loading,
}) {
  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function updateTeachingDate(index, value) {
    setForm(f => ({
      ...f,
      teachingDates: f.teachingDates.map((date, i) => (i === index ? value : date)),
    }))
  }

  function addTeachingDate() {
    setForm(f => ({ ...f, teachingDates: [...f.teachingDates, ''] }))
  }

  function removeTeachingDate(index) {
    setForm(f => ({
      ...f,
      teachingDates: f.teachingDates.length > 1 ? f.teachingDates.filter((_, i) => i !== index) : [''],
    }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div>
          <h3 className="font-display font-bold text-slate-900">{editingMapping ? 'Edit Mapping' : 'Add Mapping'}</h3>
          <p className="text-xs text-slate-500 mt-1">Map one non-teaching date to one or more teaching dates.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Non Teaching Date *</label>
          <input type="date" className="input" value={form.nonTeachingDate} onChange={update('nonTeachingDate')} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Teaching Date *</label>
            <button type="button" onClick={addTeachingDate} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              + Add Date
            </button>
          </div>
          {form.teachingDates.map((date, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
              <input type="date" className="input" value={date} onChange={e => updateTeachingDate(index, e.target.value)} />
              <button type="button" onClick={() => removeTeachingDate(index)} className="btn-secondary px-3">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onSave} disabled={loading} className="btn-primary flex-1 justify-center">
            <CheckCircle size={15} /> {editingMapping ? 'Update' : 'Save'}
          </button>
          {editingMapping && <button onClick={onCancel} className="btn-secondary justify-center">Cancel</button>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-display font-bold text-slate-900">Teaching Days in Lieu of Non-Teaching Days</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {mappings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No mappings added yet.</div>
          ) : (
            mappings.map(mapping => (
              <div key={mapping._id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{formatDate(mapping.nonTeachingDate)}</p>
                  <p className="text-sm text-slate-500 mt-1">{mapping.teachingDates.map(formatDate).join(', ')}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onEdit(mapping)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => onDelete(mapping)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ColorCategoryPanel({
  categories,
  form,
  setForm,
  editingCategory,
  onSave,
  onEdit,
  onDelete,
  onCancel,
  loading,
}) {
  function update(field) {
    return e => {
      const value = ['isActive', 'showDescription'].includes(field) ? e.target.checked : e.target.value
      setForm(f => ({ ...f, [field]: value }))
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div>
          <h3 className="font-display font-bold text-slate-900">
            {editingCategory ? 'Edit Category' : 'Create Category'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Define reusable calendar legend colours.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Category Name *</label>
          <input className="input" value={form.name} onChange={update('name')} placeholder="Holiday" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Colour *</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.color}
              onChange={update('color')}
              className="h-10 w-14 rounded-lg border border-slate-200 bg-white p-1"
            />
            <input className="input uppercase" value={form.color} onChange={update('color')} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Description *</label>
          <textarea className="input min-h-[82px] resize-none" value={form.description} onChange={update('description')} placeholder="Institute Holiday" />
        </div>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-sm font-semibold text-slate-700">Active</span>
          <input type="checkbox" checked={form.isActive} onChange={update('isActive')} className="h-4 w-4 accent-brand-600" />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-sm font-semibold text-slate-700">Show Description</span>
          <input type="checkbox" checked={form.showDescription !== false} onChange={update('showDescription')} className="h-4 w-4 accent-brand-600" />
        </label>

        <div className="flex gap-2">
          <button onClick={onSave} disabled={loading} className="btn-primary flex-1 justify-center">
            <CheckCircle size={15} /> {editingCategory ? 'Update' : 'Create'}
          </button>
          {editingCategory && (
            <button onClick={onCancel} className="btn-secondary justify-center">Cancel</button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Palette size={16} className="text-brand-600" />
          <h3 className="font-display font-bold text-slate-900">Calendar Legend</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No colour categories yet.</div>
          ) : (
            categories.map(category => (
              <div key={category._id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-1 h-4 w-4 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: category.color }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{category.name}</p>
                      {!category.isActive && <span className="badge-completed text-[10px] py-0.5">Disabled</span>}
                      {category.showDescription === false && <span className="badge-upcoming text-[10px] py-0.5">Description Hidden</span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{category.description}</p>
                    <p className="text-xs text-slate-400 mt-1">{category.color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onEdit(category)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => onDelete(category)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function DateAssignmentPanel({
  categories,
  assignments,
  form,
  setForm,
  editingAssignment,
  onSave,
  onEdit,
  onDelete,
  onCancel,
  loading,
}) {
  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const assignmentRows = [
    ...(assignments.single || []).map(item => ({ ...item, assignmentType: 'single' })),
    ...(assignments.ranges || []).map(item => ({ ...item, assignmentType: 'range' })),
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div>
          <h3 className="font-display font-bold text-slate-900">
            {editingAssignment ? 'Edit Assignment' : 'Assign Date Colour'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">This colour layer is independent from event data.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-white border border-slate-200 p-1">
          {[
            { id: 'single', label: 'Single Date' },
            { id: 'range', label: 'Date Range' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setForm(f => ({ ...f, type: mode.id }))}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                form.type === mode.id ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {form.type === 'single' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Select Date *</label>
            <input type="date" className="input" value={form.date} onChange={update('date')} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Start Date *</label>
              <input type="date" className="input" value={form.startDate} onChange={update('startDate')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">End Date *</label>
              <input type="date" className="input" value={form.endDate} onChange={update('endDate')} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Colour Category *</label>
          <select className="input" value={form.categoryId} onChange={update('categoryId')}>
            <option value="">Select category</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={onSave} disabled={loading || categories.length === 0} className="btn-primary flex-1 justify-center">
            <CheckCircle size={15} /> {editingAssignment ? 'Update' : 'Save'}
          </button>
          {editingAssignment && (
            <button onClick={onCancel} className="btn-secondary justify-center">Cancel</button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-display font-bold text-slate-900">Date Assignments</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {assignmentRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No date colour assignments yet.</div>
          ) : (
            assignmentRows.map(assignment => {
              const category = assignment.categoryId
              return (
                <div key={`${assignment.assignmentType}-${assignment._id}`} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border border-slate-200" style={{ backgroundColor: category?.color || '#CBD5E1' }} />
                      <p className="font-semibold text-slate-900 truncate">{category?.name || 'Deleted category'}</p>
                      <span className="badge-upcoming text-[10px] py-0.5">{assignment.assignmentType}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {assignment.assignmentType === 'single'
                        ? assignment.date
                        : `${assignment.startDate} to ${assignment.endDate}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onEdit(assignment, assignment.assignmentType)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(assignment)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
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
