import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Clock, Users, AlertTriangle, X, Calendar,
  ChevronRight, Filter, Building2, Tag
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import CalendarWidget from '../components/Calendar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatDate, formatTime, humanDate, toDateStr } from '../utils/dateUtils'

const THAPAR_LOGO = 'https://ik.imagekit.io/7khjnlfow/email-assets/thapar_logo.png?updatedAt=1776888126772'

export default function PublicPage() {
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [dateEvents, setDateEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState([])
  const [societies, setSocieties] = useState([])

  // Filters
  const [search, setSearch] = useState('')
  const [filterVenue, setFilterVenue] = useState('')
  const [filterSociety, setFilterSociety] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterConflict, setFilterConflict] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    api.get('/events/venues').then(r => setVenues(r.data)).catch(() => {})
    api.get('/events/societies').then(r => setSocieties(r.data)).catch(() => {})
  }, [])

  const fetchDateEvents = useCallback(async (date) => {
    if (!date) { setDateEvents([]); return }
    setLoading(true)
    try {
      const res = await api.get(`/events/by-date/${date}`)
      setDateEvents(res.data)
    } catch {
      setDateEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDateEvents(selectedDate)
    setSelectedEvent(null)
  }, [selectedDate, fetchDateEvents])

  const filteredEvents = dateEvents.filter(ev => {
    if (search && !ev.event.toLowerCase().includes(search.toLowerCase()) &&
        !ev.society.toLowerCase().includes(search.toLowerCase())) return false
    if (filterVenue && ev.venue !== filterVenue) return false
    if (filterSociety && !ev.society.toLowerCase().includes(filterSociety.toLowerCase())) return false
    if (filterStatus && ev.status !== filterStatus) return false
    if (filterConflict && !ev.conflict) return false
    return true
  })

  const hasFilters = search || filterVenue || filterSociety || filterStatus || filterConflict

  function clearFilters() {
    setSearch(''); setFilterVenue(''); setFilterSociety('')
    setFilterStatus(''); setFilterConflict(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#8b0000] via-[#c62828] to-[#1d4aeb]" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2">
              <img src={THAPAR_LOGO} alt="Thapar Institute" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-xl sm:text-2xl tracking-tight leading-tight">
                Tentative Event Calendar
              </h1>
              <p className="text-white/70 text-xs sm:text-sm font-medium">
                Thapar Institute of Engineering &amp; Technology
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">Live</span>
            </div>
            <Link to="/admin"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 border border-white/20"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

          {/* Left: Calendar */}
          <div className="space-y-4">
            <CalendarWidget selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            {/* Quick Stats */}
            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Today's Summary</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Events', value: dateEvents.length, color: 'text-brand-600' },
                  { label: 'Conflicts', value: dateEvents.filter(e => e.conflict).length, color: 'text-red-500' },
                  { label: 'Live Now', value: dateEvents.filter(e => e.status === 'Live').length, color: 'text-green-600' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Event Details */}
          <div className="space-y-4">
            {/* Date header + filters */}
            <div className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-display font-bold text-slate-900 text-xl">
                    {selectedDate ? humanDate(selectedDate) : 'Select a Date'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hasFilters && (
                    <button onClick={clearFilters}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                  <button onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all
                      ${showFilters || hasFilters
                        ? 'bg-brand-50 border-brand-200 text-brand-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <Filter size={14} />
                    Filters
                    {hasFilters && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />}
                  </button>
                </div>
              </div>

              {/* Filter panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className="input pl-8" placeholder="Search event or society..."
                          value={search} onChange={e => setSearch(e.target.value)} />
                      </div>
                      <div className="relative">
                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select className="input pl-8" value={filterVenue} onChange={e => setFilterVenue(e.target.value)}>
                          <option value="">All Venues</option>
                          {venues.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="relative">
                        <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className="input pl-8" placeholder="Filter by society..."
                          value={filterSociety} onChange={e => setFilterSociety(e.target.value)} />
                      </div>
                      <div className="relative">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select className="input pl-8" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                          <option value="">All Statuses</option>
                          {['Live', 'Active', 'Upcoming', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="checkbox" checked={filterConflict} onChange={e => setFilterConflict(e.target.checked)}
                          className="w-4 h-4 accent-red-500 rounded" />
                        <span className="text-sm text-slate-600 font-medium">Conflicts only</span>
                        <AlertTriangle size={13} className="text-red-400 ml-auto" />
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Events list / detail */}
            <AnimatePresence mode="wait">
              {selectedEvent ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="card overflow-hidden"
                >
                  {/* Detail header */}
                  <div className={`p-5 ${selectedEvent.conflict ? 'bg-red-50 border-b border-red-100' : 'bg-gradient-to-r from-brand-50 to-slate-50 border-b border-slate-100'}`}>
                    <div className="flex items-start gap-3">
                      <button onClick={() => setSelectedEvent(null)}
                        className="p-1.5 rounded-lg hover:bg-white/80 text-slate-500 transition-colors mt-0.5"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <StatusBadge status={selectedEvent.status} />
                          {selectedEvent.conflict && (
                            <span className="badge-conflict"><AlertTriangle size={10} /> Conflict</span>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-slate-900 text-xl leading-tight">
                          {selectedEvent.event}
                        </h3>
                        <p className="text-brand-600 font-medium text-sm mt-1">{selectedEvent.society}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detail body */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                          <MapPin size={15} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Venue</p>
                          <p className="text-slate-800 font-semibold text-sm mt-0.5">{selectedEvent.venue}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <Calendar size={15} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Date Range</p>
                          <p className="text-slate-800 font-semibold text-sm mt-0.5">
                            {formatDate(selectedEvent.startDate)}
                            {selectedEvent.startDate !== selectedEvent.endDate && ` → ${formatDate(selectedEvent.endDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                          <Clock size={15} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Time</p>
                          <p className="text-slate-800 font-semibold text-sm mt-0.5">
                            {formatTime(selectedEvent.startTime)} – {formatTime(selectedEvent.endTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <Users size={15} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Society</p>
                          <p className="text-slate-800 font-semibold text-sm mt-0.5">{selectedEvent.society}</p>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.description && (
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Description</p>
                        <p className="text-slate-700 text-sm leading-relaxed">{selectedEvent.description}</p>
                      </div>
                    )}

                    {selectedEvent.conflict && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-700 font-semibold text-sm">Venue Conflict Detected</p>
                          <p className="text-red-600 text-xs mt-1">
                            This event overlaps with another event at the same venue during the same time period.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {loading ? (
                    <div className="card p-12 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="card p-12 text-center">
                      <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">
                        {selectedDate ? 'No events on this day' : 'Select a date to view events'}
                      </p>
                      {hasFilters && (
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                      )}
                    </div>
                  ) : (
                    filteredEvents.map((ev, i) => (
                      <motion.div
                        key={ev._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedEvent(ev)}
                        className={`card p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group
                          ${ev.conflict ? 'border-red-200 hover:border-red-300' : 'hover:border-brand-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Color bar */}
                          <div className={`w-1 self-stretch rounded-full shrink-0
                            ${ev.conflict ? 'bg-red-400' :
                              ev.status === 'Live' ? 'bg-green-400' :
                              ev.status === 'Active' ? 'bg-amber-400' :
                              ev.status === 'Completed' ? 'bg-slate-300' : 'bg-brand-400'}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-brand-700 transition-colors truncate">
                                {ev.event}
                              </h3>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {ev.conflict && <span className="badge-conflict"><AlertTriangle size={9} /> Conflict</span>}
                                <StatusBadge status={ev.status} />
                              </div>
                            </div>
                            <p className="text-brand-600 text-xs font-medium mt-0.5">{ev.society}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin size={11} /> {ev.venue}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={11} /> {formatTime(ev.startTime)} – {formatTime(ev.endTime)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-400 transition-colors shrink-0 mt-1" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <h3 className="font-display font-bold text-slate-900">General Query</h3>
              <p className="text-xs text-slate-500">For any assistance:</p>
              <a href="mailto:shabnam.rani@thapar.edu" className="text-xs text-brand-600 hover:underline block">
                shabnam.rani@thapar.edu
              </a>
              <p className="text-xs font-semibold text-slate-400 uppercase">Technical Support</p>
              <a href="mailto:itmh@thapar.edu" className="text-xs text-brand-600 hover:underline block">itmh@thapar.edu</a>
            </div>
            <div className="space-y-3">
              <h3 className="font-display font-bold text-slate-900">Contact Us</h3>
              <p className="text-xs text-slate-500">Timings: 9 AM to 5:30 PM, Mon–Fri</p>
              <a href="mailto:dosa.office@thapar.edu" className="text-xs text-brand-600 hover:underline block">
                dosa.office@thapar.edu
              </a>
              <p className="text-xs text-slate-500 mt-3">Powered by Thapar Institute</p>
              <p className="text-xs text-slate-500">Created and Maintained by <span className="font-semibold text-slate-700">DoSA Office</span></p>
            </div>
            <div className="space-y-3">
              <h3 className="font-display font-bold text-slate-900">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/admin" className="text-xs text-slate-500 hover:text-brand-600 transition-colors block">Admin Panel</Link>
                <a href="https://www.thapar.edu" target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-brand-600 transition-colors block">Thapar Website</a>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3">
              <h3 className="font-display font-bold text-slate-900">Thapar Event Calendar</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-3 text-center w-full">
                <img src={THAPAR_LOGO} alt="Thapar Logo" className="h-9 w-auto object-contain" />
                <div className="w-7 h-0.5 rounded-full bg-[#c62828]" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Keeping all event-related information in one accessible place for a well-organized campus environment.
                </p>
                <p className="text-[10px] font-bold tracking-widest text-slate-400">EVENT CALENDAR</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
