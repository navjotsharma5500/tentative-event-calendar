import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { daysInMonth, firstDayOfMonth, monthName, toDateStr } from '../utils/dateUtils'
import api from '../utils/api'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function Calendar({ selectedDate, onSelectDate }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [calendarData, setCalendarData] = useState({})
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    fetchCalendarData()
  }, [viewYear, viewMonth])

  async function fetchCalendarData() {
    setLoading(true)
    try {
      const res = await api.get(`/events/calendar/${viewYear}/${viewMonth}`)
      setCalendarData(res.data)
    } catch {
      setCalendarData({})
    } finally {
      setLoading(false)
    }
  }

  function prevMonth() {
    setDirection(-1)
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    setDirection(1)
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDay = firstDayOfMonth(viewYear, viewMonth)
  const todayStr = toDateStr(today)

  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  return (
    <div className="card p-5 select-none relative">
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="font-display font-semibold text-slate-900 text-lg">{monthName(viewMonth)}</h2>
          <p className="text-slate-400 text-xs">{viewYear}</p>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-400 py-1">{day}</div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewYear}-${viewMonth}`}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-y-1"
        >
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />
            const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const info = calendarData[dateStr]
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const hasEvent = info?.hasEvent
            const hasConflict = info?.hasConflict

            return (
              <motion.button
                key={dateStr}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectDate(isSelected ? null : dateStr)}
                className={`
                  relative flex flex-col items-center justify-center rounded-xl py-2 mx-0.5 transition-all duration-150
                  ${isSelected
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-200'
                    : isToday
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'hover:bg-slate-100 text-slate-700'
                  }
                `}
              >
                <span className={`text-sm ${isToday && !isSelected ? 'font-bold' : 'font-medium'}`}>{day}</span>
                {hasEvent && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full
                    ${isSelected ? 'bg-white/80' : hasConflict ? 'bg-red-500' : 'bg-brand-500'}`}
                  />
                )}
              </motion.button>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" /> Events
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Conflict
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-brand-100 border border-brand-300 inline-block" /> Today
        </div>
      </div>
    </div>
  )
}
