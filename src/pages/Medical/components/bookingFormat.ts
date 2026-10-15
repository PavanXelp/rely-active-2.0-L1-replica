import type { L1MyBooking } from '@/lib/types/appointment'

export function formatMonth(dateStr: string): string {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })
  } catch {
    return '—'
  }
}

export function formatDay(dateStr: string): string {
  try {
    return String(new Date(`${dateStr}T00:00:00`).getDate())
  } catch {
    return '—'
  }
}

export function formatDateLabel(dateStr: string): string {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function parseTimeToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function formatMinutes(total: number): string {
  const hours24 = Math.floor(total / 60) % 24
  const minutes = total % 60
  const suffix = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${hours12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function formatTimeRange(range: string | null | undefined): string {
  if (!range) return ''
  const [startRaw, endRaw] = range.split('-')
  if (!startRaw || !endRaw) return range
  const start = parseTimeToMinutes(startRaw)
  const end = parseTimeToMinutes(endRaw)
  if (start == null || end == null) return range
  return `${formatMinutes(start)} - ${formatMinutes(end)}`
}

export function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return value
  }
}

export function isVisitingBooking(booking: L1MyBooking): boolean {
  return !booking.doctorCategory || booking.doctorCategory === 'VISITING'
}

export function compareAttendedDesc(a: L1MyBooking, b: L1MyBooking): number {
  return (b.attendedAt || b.appointmentDate).localeCompare(a.attendedAt || a.appointmentDate)
}

export function ymdToDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

export function todayYmd(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
