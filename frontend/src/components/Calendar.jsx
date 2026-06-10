import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { daysInMonth, firstDayOfMonth, monthName, toDateStr } from '../utils/dateUtils'
import api from '../utils/api'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDateColors(dateColorValue) {
  if (!dateColorValue) return []
  return Array.isArray(dateColorValue) ? dateColorValue.filter(Boolean) : [dateColorValue]
}

function getContrastTextColor(hex) {
  const value = String(hex || '').replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) return '#111827'
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#111827' : '#FFFFFF'
}

export default function Calendar({ selectedDate, onSelectDate, onMonthChange }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [calendarData, setCalendarData] = useState({})
  const [colorMap, setColorMap] = useState({})
  const [colorCategories, setColorCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    fetchCalendarData()
  }, [viewYear, viewMonth])

  useEffect(() => {
    onMonthChange?.({ year: viewYear, month: viewMonth })
  }, [onMonthChange, viewMonth, viewYear])

  async function fetchCalendarData() {
    setLoading(true)
    try {
      const lastDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(daysInMonth(viewYear, viewMonth)).padStart(2, '0')}`
      const firstDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`
      const [calendarRes, colorMapRes, categoriesRes] = await Promise.all([
        api.get(`/events/calendar/${viewYear}/${viewMonth}`),
        api.get(`/calendar-color-map?start=${firstDate}&end=${lastDate}`),
        api.get('/color-categories'),
      ])
      setCalendarData(calendarRes.data)
      setColorMap(colorMapRes.data)
      setColorCategories(categoriesRes.data.filter(category => category.isActive))
    } catch {
      setCalendarData({})
      setColorMap({})
      setColorCategories([])
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

  const usedColorCategoryIds = new Set(
    Object.values(colorMap).flatMap(dateColorValue => (
      getDateColors(dateColorValue).map(color => String(color._id))
    ))
  )
  const visibleColorCategories = colorCategories.filter(category => (
    usedColorCategoryIds.has(String(category._id))
  ))

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden select-none relative h-[650px] flex flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-7 flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg text-white hover:bg-white/15 transition-colors" aria-label="Previous month">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-white text-2xl sm:text-3xl">{monthName(viewMonth)} {viewYear}</h2>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-lg text-white hover:bg-white/15 transition-colors" aria-label="Next month">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-7 px-7 sm:px-10 pt-7 pb-2">
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
          className="grid grid-cols-7 gap-y-2 px-7 sm:px-10 pb-3 shrink-0"
        >
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-14" />
            const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const info = calendarData[dateStr]
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const hasEvent = info?.hasEvent
            const hasConflict = info?.hasConflict
            const dateColors = getDateColors(colorMap[dateStr])
            const boxColor = dateColors[0]
            const circleColor = dateColors[1]
            const hasDateColor = Boolean(boxColor)
            const stateClass = isSelected
              ? `${hasDateColor ? '' : 'bg-white'} text-gray-900 ring-2 ring-blue-500 shadow-sm`
              : isToday
              ? `${hasDateColor ? '' : 'bg-blue-50'} text-blue-700 font-semibold`
              : hasDateColor
              ? 'text-gray-950 hover:ring-2 hover:ring-gray-300'
              : 'hover:bg-gray-50 text-gray-900'
            const colorTitle = dateColors.length > 0
              ? dateColors.map(color => `${color.name}${color.description ? `: ${color.description}` : ''}`).join('\n')
              : undefined

            return (
              <motion.button
                key={dateStr}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectDate(isSelected ? null : dateStr)}
                style={boxColor ? { background: boxColor.color, backgroundColor: boxColor.color } : undefined}
                title={colorTitle}
                className={`
                  relative mx-auto h-14 w-14 flex flex-col items-center justify-center rounded-xl transition-all duration-150
                  ${stateClass}
                `}
              >
                <span
                  className={`relative z-10 flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-base ${circleColor ? 'shadow-sm' : ''} ${isToday || isSelected ? 'font-bold' : 'font-semibold'}`}
                  style={circleColor ? { backgroundColor: circleColor.color, color: getContrastTextColor(circleColor.color) } : undefined}
                >
                  {day}
                </span>
                {hasEvent && (
                  <span className="relative z-10 mt-1 flex items-center justify-center gap-1">
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

      {visibleColorCategories.length > 0 && (
        <div className="px-7 sm:px-10 pb-4 shrink-0">
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Calendar Legend</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-1">
              {visibleColorCategories.map(category => (
                <div key={category._id} className="flex items-start gap-2 min-w-0">
                  <span className="mt-1 h-3 w-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: category.color }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{category.name}</p>
                    {category.showDescription !== false && (
                      <p className="text-[11px] text-gray-500 truncate">{category.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
