export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

export function firstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay()
}

export function monthName(month) {
  return new Date(2024, month - 1, 1).toLocaleString('en-US', { month: 'long' })
}

export function humanDate(dateStr) {
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}
