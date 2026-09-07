import type { VenueBookingDraft } from '@/lib/types/event'

const BOOKING_DRAFT_KEY = 'l1_venue_booking_draft'

export type DayTimeSlot = { startTime: string; endTime: string }

export function saveBookingDraft(draft: VenueBookingDraft): void {
  try {
    sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // ignore storage failures
  }
}

export function loadBookingDraft(): VenueBookingDraft | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as VenueBookingDraft
  } catch {
    return null
  }
}

export function clearBookingDraft(): void {
  try {
    sessionStorage.removeItem(BOOKING_DRAFT_KEY)
  } catch {
    // ignore
  }
}

export function combineDateAndTime(date: string, time: string): string {
  // time expected as HH:mm (24h from <input type="time">)
  if (!date || !time) return ''
  const iso = `${date}T${time}:00`
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

/** Inclusive YYYY-MM-DD keys from startDate through endDate. */
export function getDateKeysInRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate || endDate < startDate) return []
  const keys: string[] = []
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const current = new Date(sy!, sm! - 1, sd)
  const end = new Date(ey!, em! - 1, ed)
  while (current <= end) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    keys.push(`${y}-${m}-${d}`)
    current.setDate(current.getDate() + 1)
  }
  return keys
}

export function buildScheduleOccurrences(
  dateKeys: string[],
  times: Record<string, DayTimeSlot>,
): Array<{ startDate: string; endDate: string }> {
  return dateKeys
    .map((dateKey) => {
      const slot = times[dateKey]
      if (!slot?.startTime || !slot?.endTime) return null
      const startDate = combineDateAndTime(dateKey, slot.startTime)
      const endDate = combineDateAndTime(dateKey, slot.endTime)
      if (!startDate || !endDate) return null
      return { startDate, endDate }
    })
    .filter((occ): occ is { startDate: string; endDate: string } => occ !== null)
}

export function formatDisplayDate(dateStr: string): string {
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return formatDisplayDateKey(dateStr)
    }
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr || '—'
  }
}

export function formatDisplayDateKey(dateKey: string): string {
  try {
    const [y, m, d] = dateKey.split('-').map(Number)
    const date = new Date(y!, m! - 1, d)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateKey || '—'
  }
}

export function formatDisplayTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

export function formatDisplayTimeOfDay(time: string): string {
  if (!time) return '—'
  try {
    const [h, min] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(h!, min!, 0, 0)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return time
  }
}

export function splitKeyFeatures(features?: string | null): string[] {
  if (!features?.trim()) return []
  return features
    .split(/\r?\n|•|;/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}
