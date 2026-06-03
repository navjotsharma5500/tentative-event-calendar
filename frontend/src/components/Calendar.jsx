import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { daysInMonth, firstDayOfMonth, monthName, toDateStr } from '../utils/dateUtils'
import api from '../utils/api'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden select-none relative h-[580px] flex flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-7 flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg text-red-500 hover:bg-white/15 transition-colors" aria-label="Previous month">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-white text-2xl sm:text-3xl">{monthName(viewMonth)} {viewYear}</h2>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-lg text-red-500 hover:bg-white/15 transition-colors" aria-label="Next month">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-7 px-7 sm:px-10 pt-9 pb-4">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-base font-semibold text-gray-700 py-1">{day}</div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewYear}-${viewMonth}`}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-y-3 px-7 sm:px-10 pb-8 flex-1"
        >
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-16" />
            const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const info = calendarData[dateStr]
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const hasEvent = info?.hasEvent
            const hasConflict = info?.hasConflict

            return (
              <motion.button
                key={dateStr}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectDate(isSelected ? null : dateStr)}
                className={`
                  relative mx-auto h-16 w-16 flex flex-col items-center justify-center rounded-xl transition-all duration-150
                  ${isSelected
                    ? 'bg-white text-gray-900 ring-2 ring-blue-500 shadow-sm'
                    : isToday
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-gray-50 text-gray-900'
                  }
                `}
              >
                <span className={`text-base ${isToday || isSelected ? 'font-bold' : 'font-semibold'}`}>{day}</span>
                {hasEvent && (
                  <span className="mt-1 flex items-center justify-center gap-1">
                    {Array.from({ length: Math.min(info?.count || 1, 3) }).map((_, dotIndex) => (
                      <span
                        key={dotIndex}
                        className={`w-1.5 h-1.5 rounded-full ${hasConflict ? 'bg-red-500' : 'bg-indigo-400'}`}
                      />
                    ))}
                  </span>
                )}
              </motion.button>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
