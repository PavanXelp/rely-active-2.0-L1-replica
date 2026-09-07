import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { eventMobileService } from '@/lib/services/eventService'
import type { DayScheduleTimes, L1VenueDetail } from '@/lib/types/event'
import { getFileUrl } from '@/lib/utils'
import {
  buildScheduleOccurrences,
  formatDisplayDateKey,
  getDateKeysInRange,
  loadBookingDraft,
  saveBookingDraft,
  type DayTimeSlot,
} from '@/pages/Events/book/bookingState'
import { toast } from 'sonner'

const ORANGE = '#F97316'

/** Hide native picker glyph so only the orange Lucide icon shows */
const pickerInputClass =
  'h-11 rounded-xl text-sm pr-10 ' +
  '[&::-webkit-calendar-picker-indicator]:absolute ' +
  '[&::-webkit-calendar-picker-indicator]:inset-0 ' +
  '[&::-webkit-calendar-picker-indicator]:h-full ' +
  '[&::-webkit-calendar-picker-indicator]:w-full ' +
  '[&::-webkit-calendar-picker-indicator]:cursor-pointer ' +
  '[&::-webkit-calendar-picker-indicator]:opacity-0'

function todayDateString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function nowTimeString(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function initScheduleTimes(
  dateKeys: string[],
  existing?: Record<string, DayScheduleTimes>,
  fallbackStart = '',
  fallbackEnd = '',
): Record<string, DayTimeSlot> {
  const next: Record<string, DayTimeSlot> = {}
  dateKeys.forEach((key, index) => {
    const prior = existing?.[key]
    if (prior?.startTime || prior?.endTime) {
      next[key] = { startTime: prior.startTime || '', endTime: prior.endTime || '' }
      return
    }
    // Seed first day from legacy single start/end when restoring a draft
    if (index === 0 && (fallbackStart || fallbackEnd) && dateKeys.length === 1) {
      next[key] = { startTime: fallbackStart, endTime: fallbackEnd }
      return
    }
    next[key] = { startTime: '', endTime: '' }
  })
  return next
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const existing = loadBookingDraft()
  const today = todayDateString()

  const [title, setTitle] = useState(existing?.title || '')
  const [startDate, setStartDate] = useState(existing?.startDate || '')
  const [endDate, setEndDate] = useState(existing?.endDate || '')
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, DayTimeSlot>>(() => {
    const keys = getDateKeysInRange(existing?.startDate || '', existing?.endDate || '')
    return initScheduleTimes(keys, existing?.scheduleTimes, existing?.startTime, existing?.endTime)
  })
  const [occupancy, setOccupancy] = useState(existing?.occupancy ? String(existing.occupancy) : '')
  const [venues, setVenues] = useState<L1VenueDetail[]>([])
  const [loadingVenues, setLoadingVenues] = useState(false)

  const occupancyNum = useMemo(() => {
    const n = Number(occupancy)
    return Number.isInteger(n) && n > 0 ? n : null
  }, [occupancy])

  const dateKeys = useMemo(() => getDateKeysInRange(startDate, endDate), [startDate, endDate])
  const isMultiDay = dateKeys.length > 1
  const endDateMin = startDate || today

  const syncScheduleTimesForKeys = (keys: string[], prev: Record<string, DayTimeSlot>) => {
    const next: Record<string, DayTimeSlot> = {}
    for (const key of keys) {
      next[key] = prev[key] || { startTime: '', endTime: '' }
    }
    return next
  }

  useEffect(() => {
    if (occupancyNum == null) return
    let ignore = false
    const load = async () => {
      try {
        setLoadingVenues(true)
        const data = await eventMobileService.getVenues(occupancyNum)
        if (!ignore) setVenues(data)
      } catch (err) {
        console.error(err)
        if (!ignore) {
          toast.error('Failed to load available venues')
          setVenues([])
        }
      } finally {
        if (!ignore) setLoadingVenues(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [occupancyNum])

  const displayedVenues = occupancyNum == null ? [] : venues
  const allTimesFilled =
    dateKeys.length > 0 &&
    dateKeys.every((key) => {
      const slot = scheduleTimes[key]
      return Boolean(slot?.startTime && slot?.endTime)
    })

  const canShowVenues = Boolean(title.trim() && startDate && endDate && allTimesFilled && occupancyNum)

  const buildDraftBase = () => {
    const firstKey = dateKeys[0]
    const lastKey = dateKeys[dateKeys.length - 1]
    const first = firstKey ? scheduleTimes[firstKey] : undefined
    const last = lastKey ? scheduleTimes[lastKey] : undefined
    return {
      title: title.trim(),
      startDate,
      endDate,
      startTime: first?.startTime || '',
      endTime: last?.endTime || '',
      scheduleTimes: { ...scheduleTimes },
      occupancy: occupancyNum || 0,
    }
  }

  const validateSchedule = (): string | null => {
    if (!startDate || !endDate) {
      return 'Please select start and end date'
    }
    if (startDate < today) {
      return 'Start date cannot be in the past'
    }
    if (endDate < startDate) {
      return 'End date cannot be before start date'
    }
    if (dateKeys.length === 0) {
      return 'Please select start and end date'
    }
    for (const key of dateKeys) {
      const slot = scheduleTimes[key]
      if (!slot?.startTime || !slot?.endTime) {
        return isMultiDay
          ? `Please set start and end time for ${formatDisplayDateKey(key)}`
          : 'Please select start and end time'
      }
      if (slot.endTime <= slot.startTime) {
        return isMultiDay
          ? `End time must be after start time on ${formatDisplayDateKey(key)}`
          : 'End time must be after start time'
      }
      if (key === today && slot.startTime < nowTimeString()) {
        return 'Start time cannot be in the past'
      }
    }
    return null
  }

  const handleStartDateChange = (value: string) => {
    if (value && value < today) {
      toast.error('Start date cannot be in the past')
      setStartDate(today)
      const keys = getDateKeysInRange(today, endDate && endDate >= today ? endDate : today)
      setScheduleTimes((prev) => syncScheduleTimesForKeys(keys, prev))
      if (!endDate || endDate < today) setEndDate(today)
      return
    }
    const nextEnd = !endDate || (value && endDate < value) ? value : endDate
    setStartDate(value)
    if (!endDate || (value && endDate < value)) {
      setEndDate(value)
    }
    const keys = getDateKeysInRange(value, nextEnd)
    setScheduleTimes((prev) => syncScheduleTimesForKeys(keys, prev))
  }

  const handleEndDateChange = (value: string) => {
    const minEnd = startDate || today
    if (value && value < minEnd) {
      toast.error('End date cannot be before start date')
      setEndDate(minEnd)
      const keys = getDateKeysInRange(startDate || minEnd, minEnd)
      setScheduleTimes((prev) => syncScheduleTimesForKeys(keys, prev))
      return
    }
    setEndDate(value)
    const keys = getDateKeysInRange(startDate, value)
    setScheduleTimes((prev) => syncScheduleTimesForKeys(keys, prev))
  }

  const handleOccupancyChange = (value: string) => {
    setOccupancy(value)
    const n = Number(value)
    if (!Number.isInteger(n) || n <= 0) {
      setVenues([])
    }
  }

  const handleDayStartTimeChange = (dateKey: string, value: string) => {
    if (dateKey === today && value && value < nowTimeString()) {
      toast.error('Start time cannot be in the past')
      return
    }
    setScheduleTimes((prev) => {
      const current = prev[dateKey] || { startTime: '', endTime: '' }
      const endTime = current.endTime && value && current.endTime <= value ? '' : current.endTime
      return { ...prev, [dateKey]: { startTime: value, endTime } }
    })
  }

  const handleDayEndTimeChange = (dateKey: string, value: string) => {
    const startTime = scheduleTimes[dateKey]?.startTime || ''
    if (startTime && value && value <= startTime) {
      toast.error('End time must be after start time')
      return
    }
    setScheduleTimes((prev) => ({
      ...prev,
      [dateKey]: { startTime: prev[dateKey]?.startTime || '', endTime: value },
    }))
  }

  const handleViewVenue = async (venue: L1VenueDetail) => {
    if (!title.trim()) {
      toast.error('Please enter event title')
      return
    }
    const scheduleError = validateSchedule()
    if (scheduleError) {
      toast.error(scheduleError)
      return
    }
    if (!occupancyNum) {
      toast.error('Please enter expected people')
      return
    }

    const occurrences = buildScheduleOccurrences(dateKeys, scheduleTimes)
    if (occurrences.length !== dateKeys.length) {
      toast.error('Invalid date/time')
      return
    }

    try {
      for (const occ of occurrences) {
        const availability = await eventMobileService.checkVenueAvailability(venue.id, occ.startDate, occ.endDate)
        if (!availability.available) {
          toast.error(availability.message || 'This Venue is booked for the selected schedule')
          return
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to check venue availability')
      return
    }

    const draft = {
      ...buildDraftBase(),
      venueId: venue.id,
      venueName: venue.name,
      venueCoverPhoto: venue.coverPhoto,
      venuePrice: Number(venue.price ?? 0),
      venueAddOnServices: Array.isArray(venue.addOnServices) ? venue.addOnServices : [],
    }
    saveBookingDraft(draft)
    navigate(`/events/book/venue/${venue.id}`, { state: { draft } })
  }

  const renderTimePair = (dateKey: string) => {
    const slot = scheduleTimes[dateKey] || { startTime: '', endTime: '' }
    const startMin = dateKey === today ? nowTimeString() : undefined
    const endMin = slot.startTime || undefined
    const startId = `start-time-${dateKey}`
    const endId = `end-time-${dateKey}`
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor={startId} className="text-xs font-semibold text-gray-700">
            Start Time
          </label>
          <div className="relative">
            <Input
              id={startId}
              type="time"
              value={slot.startTime}
              min={startMin}
              onChange={(e) => handleDayStartTimeChange(dateKey, e.target.value)}
              className={pickerInputClass}
            />
            <Clock
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: ORANGE }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor={endId} className="text-xs font-semibold text-gray-700">
            End Time
          </label>
          <div className="relative">
            <Input
              id={endId}
              type="time"
              value={slot.endTime}
              min={endMin}
              disabled={!slot.startTime}
              onChange={(e) => handleDayEndTimeChange(dateKey, e.target.value)}
              className={pickerInputClass}
            />
            <Clock
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: ORANGE }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8 font-sans select-none">
      <div className="bg-white sticky top-0 z-20 -mx-1 px-1 pt-1 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h2 className="flex-1 text-center text-base font-black tracking-tight pr-9">Create Event</h2>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="event-title" className="text-sm font-semibold text-gray-800">
            Name of Event
          </label>
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event name"
            className="h-11 rounded-xl text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="event-start-date" className="text-sm font-semibold text-gray-800">
            Select Start date
          </label>
          <div className="relative">
            <Input
              id="event-start-date"
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className={pickerInputClass}
            />
            <CalendarDays
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
              style={{ color: ORANGE }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="event-end-date" className="text-sm font-semibold text-gray-800">
            Select End date
          </label>
          <div className="relative">
            <Input
              id="event-end-date"
              type="date"
              value={endDate}
              min={endDateMin}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className={pickerInputClass}
            />
            <CalendarDays
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
              style={{ color: ORANGE }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Add Times</h3>
          {!startDate || !endDate ? (
            <p className="text-xs text-gray-500">Select start and end dates to set times</p>
          ) : isMultiDay ? (
            <div className="space-y-3">
              {dateKeys.map((dateKey) => (
                <div key={dateKey} className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 shrink-0" style={{ color: ORANGE }} />
                    <p className="text-sm font-semibold text-gray-800">{formatDisplayDateKey(dateKey)}</p>
                  </div>
                  {renderTimePair(dateKey)}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600">{formatDisplayDateKey(dateKeys[0]!)}</p>
              {renderTimePair(dateKeys[0]!)}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="event-occupancy" className="text-sm font-semibold text-gray-800">
            Expected People
          </label>
          <Input
            id="event-occupancy"
            type="number"
            min={1}
            value={occupancy}
            onChange={(e) => handleOccupancyChange(e.target.value)}
            placeholder="e.g. 20"
            className="h-11 rounded-xl text-sm"
          />
        </div>
      </div>

      {canShowVenues && (
        <section className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-gray-900">Available Venue</h3>
          {loadingVenues ? (
            <Card className="rounded-2xl p-6 text-center text-muted-foreground">
              <p className="text-xs font-semibold">Loading venues...</p>
            </Card>
          ) : displayedVenues.length === 0 ? (
            <Card className="rounded-2xl p-6 text-center text-muted-foreground">
              <p className="text-xs font-semibold">No venues available for {occupancyNum} people</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayedVenues.map((venue) => {
                const cover = getFileUrl(venue.coverPhoto)
                const addOns = Array.isArray(venue.addOnServices) ? venue.addOnServices : []
                return (
                  <Card key={venue.id} className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="font-bold text-base text-gray-900">{venue.name}</h4>
                          <p className="text-xs text-gray-500">Capacity :{venue.occupancy}</p>
                          {addOns.slice(0, 2).map((svc) => (
                            <p key={svc.name} className="text-xs text-gray-500">
                              {svc.name} :{svc.quantity != null ? `${svc.quantity}` : ''}
                              {svc.keyFeatures ? ` ${svc.keyFeatures}` : ''}
                            </p>
                          ))}
                        </div>
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {cover ? (
                            <img src={cover} alt={venue.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageOff className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-gray-900">
                          {venue.price != null ? `₹${Number(venue.price).toLocaleString('en-IN')}` : '₹0'}
                        </p>
                        <Button
                          type="button"
                          onClick={() => void handleViewVenue(venue)}
                          className="h-9 px-6 rounded-xl text-white font-bold text-sm"
                          style={{ backgroundColor: ORANGE }}
                        >
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
