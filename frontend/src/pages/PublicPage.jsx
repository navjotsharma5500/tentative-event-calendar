import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  ArrowLeft,
  Filter,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react'
import api from '../utils/api'
import CalendarWidget from '../components/Calendar.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatDate, formatTime, humanDate, toDateStr } from '../utils/dateUtils'

const THAPAR_LOGO = 'https://ik.imagekit.io/7khjnlfow/email-assets/Thapar_Logo.png?updatedAt=1769371086744'

function formatHyphenDate(dateStr) {
  return formatDate(dateStr).replaceAll(' ', '-')
}

export default function PublicPage() {
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [dateEvents, setDateEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState([])
  const [societies, setSocieties] = useState([])
  const [dateDescriptions, setDateDescriptions] = useState({ holidays: [], teachingMappings: [] })
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [search, setSearch] = useState('')
  const [filterVenue, setFilterVenue] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterConflict, setFilterConflict] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    api.get('/events/venues').then(r => setVenues(r.data)).catch(() => {})
    api.get('/events/societies').then(r => setSocieties(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const start = `${visibleMonth.year}-${String(visibleMonth.month).padStart(2, '0')}-01`
    const end = `${visibleMonth.year}-${String(visibleMonth.month).padStart(2, '0')}-${String(new Date(visibleMonth.year, visibleMonth.month, 0).getDate()).padStart(2, '0')}`
    api.get('/date-descriptions', {
      params: {
        start,
        end,
      },
    }).then(r => setDateDescriptions(r.data)).catch(() => {})
  }, [visibleMonth])

  const handleMonthChange = useCallback((monthInfo) => {
    setVisibleMonth(current => (
      current.year === monthInfo.year && current.month === monthInfo.month ? current : monthInfo
    ))
  }, [])

  const fetchDateEvents = useCallback(async (date) => {
    setLoading(true)
    try {
      const hasBookingFilters = Boolean(
        search.trim() ||
        filterVenue ||
        filterDepartment ||
        filterStartDate ||
        filterEndDate ||
        filterConflict
      )

      if (!hasBookingFilters && date) {
        const res = await api.get(`/events/by-date/${date}`)
        setDateEvents(res.data)
        return
      }

      const params = {}
      if (search.trim()) params.search = search.trim()
      if (filterVenue) params.venue = filterVenue
      if (filterDepartment) params.department = filterDepartment
      if (filterStartDate) params.startDate = filterStartDate
      if (filterEndDate) params.endDate = filterEndDate
      if (filterConflict) params.conflictOnly = true

      const res = await api.get('/events', { params })
      setDateEvents(res.data)
    } catch {
      setDateEvents([])
    } finally {
      setLoading(false)
    }
  }, [filterConflict, filterDepartment, filterEndDate, filterStartDate, filterVenue, search])

  useEffect(() => {
    fetchDateEvents(selectedDate)
  }, [selectedDate, fetchDateEvents])

  useEffect(() => {
    const timer = setInterval(() => {
      fetchDateEvents(selectedDate)
    }, 60000)
    return () => clearInterval(timer)
  }, [selectedDate, fetchDateEvents])

  const filteredEvents = useMemo(() => {
    const searchText = search.trim().toLowerCase()
    return dateEvents.filter(ev => {
      if (searchText && !ev.event.toLowerCase().includes(searchText) && !ev.society.toLowerCase().includes(searchText)) return false
      if (filterVenue && ev.venue !== filterVenue) return false
      if (filterDepartment && ev.society !== filterDepartment) return false
      if (filterConflict && !ev.conflict) return false
      return true
    })
  }, [dateEvents, filterConflict, filterDepartment, filterVenue, search])

  const hasFilters = search || filterVenue || filterDepartment || filterStartDate || filterEndDate || filterConflict
  const bookingTitle = hasFilters
    ? 'Filtered Bookings'
    : selectedDate
    ? `Bookings on ${humanDate(selectedDate)}`
    : 'Select a date'

  function clearFilters() {
    setSearch('')
    setFilterVenue('')
    setFilterDepartment('')
    setFilterStartDate('')
    setFilterEndDate('')
    setFilterConflict(false)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 min-h-[96px] flex items-center justify-between gap-3 flex-wrap xl:flex-nowrap">
          <div className="flex items-center gap-3 shrink min-w-[220px]">
            <img src={THAPAR_LOGO} alt="Thapar Logo" className="h-14 sm:h-[72px] w-auto object-contain" />
            <div>
              <p className="text-sm font-semibold leading-tight text-gray-900">Thapar Institute of Engineering and Technology</p>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">Student Event Calendar</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <CalendarIcon size={19} className="text-blue-600" />
            <h1 className="text-2xl font-bold tracking-normal">Thapar Event Calendar</h1>
          </div>

          <a
            href="https://campusconnect.thapar.edu/event-calendar"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 sm:px-4"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span>Back</span>
          </a>
        </div>
      </header>

      <main className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <CalendarWidget selectedDate={selectedDate} onSelectDate={setSelectedDate} onMonthChange={handleMonthChange} />

            <section className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden h-[650px] flex flex-col">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    {bookingTitle}
                  </h2>
                  {hasFilters && (filterStartDate || filterEndDate) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {filterStartDate ? formatDate(filterStartDate) : 'Any date'} to {filterEndDate ? formatDate(filterEndDate) : 'Any date'}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{filteredEvents.length} booking{filteredEvents.length !== 1 ? 's' : ''} shown</p>
                </div>
                <div className="flex items-center gap-2">
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <X size={13} /> Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFilters(value => !value)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      showFilters || hasFilters
                        ? 'border-blue-500 text-blue-700 bg-blue-50'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Filter size={15} /> Filters
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">From Date</span>
                    <input className="input rounded-lg" type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                  </label>
                  <label>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">To Date</span>
                    <input className="input rounded-lg" type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                  </label>
                  <label className="relative">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Search</span>
                    <Search size={14} className="absolute left-3 top-[34px] text-gray-400" />
                    <input className="input pl-9 rounded-lg" placeholder="Event name or society name" value={search} onChange={e => setSearch(e.target.value)} />
                  </label>
                  <label className="relative">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Venue</span>
                    <Building2 size={14} className="absolute left-3 top-[34px] text-gray-400" />
                    <select className="input pl-9 rounded-lg" value={filterVenue} onChange={e => setFilterVenue(e.target.value)}>
                      <option value="">All Venues</option>
                      {venues.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                  <label className="relative">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Department</span>
                    <Users size={14} className="absolute left-3 top-[34px] text-gray-400" />
                    <select className="input pl-9 rounded-lg" value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
                      <option value="">All Departments</option>
                      {societies.map(society => <option key={society} value={society}>{society}</option>)}
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-600 cursor-pointer self-end">
                    <input type="checkbox" checked={filterConflict} onChange={e => setFilterConflict(e.target.checked)} className="w-4 h-4 accent-red-500" />
                    Conflicts only
                  </label>
                </div>
              )}

              <div className="p-4 space-y-2 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
                {loading ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center">
                    <CalendarIcon size={36} className="text-gray-300 mb-3" />
                    <p className="font-semibold text-gray-500">{hasFilters ? 'No matching bookings found' : selectedDate ? 'No bookings on this day' : 'Select a date to view bookings'}</p>
                    {hasFilters && <p className="text-sm text-gray-400 mt-1">Try changing the filters.</p>}
                  </div>
                ) : (
                  filteredEvents.map((ev, index) => (
                    <motion.article
                      key={ev._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedEvent(ev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedEvent(ev)
                      }}
                      className={`cursor-pointer rounded-lg border bg-gray-50 px-3 py-2.5 shadow-sm transition-colors hover:bg-white hover:border-blue-300 ${
                        ev.conflict ? 'border-red-200 bg-red-50/70 hover:border-red-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="grid grid-cols-1 min-[1180px]:grid-cols-[minmax(0,1.15fr)_132px_minmax(0,0.95fr)_92px] gap-2 min-[1180px]:gap-3 items-center">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-sm font-bold text-gray-950 truncate">{ev.event}</h3>
                            {ev.conflict && <span className="badge-conflict rounded-lg"><AlertTriangle size={10} /> Conflict</span>}
                          </div>
                          <p className="text-xs font-semibold text-blue-800 mt-1 uppercase truncate">{ev.society}</p>
                          {ev.description && <p className="text-xs text-gray-500 mt-1 truncate">{ev.description}</p>}
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap min-[1180px]:justify-self-start">
                          <Clock size={14} className="text-red-500" /> {formatTime(ev.startTime)} - {formatTime(ev.endTime)}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <span className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
                            <MapPin size={14} className="text-red-500 shrink-0" /> {ev.venue}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
                            <CalendarIcon size={14} className="text-red-500 shrink-0" /> {formatDate(ev.startDate)}{ev.startDate !== ev.endDate ? ` to ${formatDate(ev.endDate)}` : ''}
                          </span>
                        </div>
                        <div className="justify-self-start min-[1180px]:justify-self-end max-w-full overflow-hidden">
                          <span className="inline-flex max-w-full [&>span]:max-w-full [&>span]:truncate [&>span]:px-2 [&>span]:py-0.5 [&>span]:text-[11px]">
                            <StatusBadge status={ev.status} />
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-950">Holidays</h2>
              <p className="text-xs font-semibold text-gray-500 mt-1">
                {new Date(visibleMonth.year, visibleMonth.month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                {(dateDescriptions.holidays || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No holidays added.</p>
                ) : (
                  <div className="space-y-2">
                    {dateDescriptions.holidays.map(holiday => (
                      <div key={holiday._id} className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-1 sm:gap-4 text-sm">
                        <p className="font-semibold text-gray-900">{formatHyphenDate(holiday.date)}</p>
                        <p className="text-gray-700">{holiday.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-base font-bold text-gray-950">Teaching Days in Lieu of Non-Teaching Days</h3>
                <p className="text-xs font-semibold text-gray-500 mt-1">{visibleMonth.year}</p>
                {(dateDescriptions.teachingMappings || []).length === 0 ? (
                  <p className="text-sm text-gray-500 mt-3">No teaching day mappings added.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left">
                          <th className="py-2 pr-6 text-xs font-bold uppercase tracking-wider text-gray-500">Non-Teaching Date</th>
                          <th className="py-2 text-xs font-bold uppercase tracking-wider text-gray-500">Teaching Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {dateDescriptions.teachingMappings.map(mapping => (
                          <tr key={mapping._id}>
                            <td className="py-2 pr-6 font-semibold text-gray-900 whitespace-nowrap">{formatHyphenDate(mapping.nonTeachingDate)}</td>
                            <td className="py-2 text-gray-700">{mapping.teachingDates.map(formatHyphenDate).join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Booking Details"
        size="lg"
      >
        {selectedEvent && (
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <StatusBadge status={selectedEvent.status} />
                  {selectedEvent.conflict && <span className="badge-conflict rounded-lg"><AlertTriangle size={10} /> Conflict</span>}
                </div>
                <h3 className="text-2xl font-bold text-gray-950 leading-tight">{selectedEvent.event}</h3>
                <p className="text-blue-800 font-semibold mt-1 uppercase">{selectedEvent.society}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Time</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Venue</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedEvent.venue}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Start Date</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(selectedEvent.startDate)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">End Date</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(selectedEvent.endDate)}</p>
              </div>
            </div>

            {selectedEvent.description && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</p>
                <p className="text-sm leading-relaxed text-gray-700">{selectedEvent.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
