import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, ImageOff, Minus, PartyPopper, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { eventMobileService } from '@/lib/services/eventService'
import type { L1EventDetail } from '@/lib/types/event'
import { getFileUrl } from '@/lib/utils'
import { toast } from 'sonner'
import axios from 'axios'

function formatEventDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatEventTime(dateStr: string): string {
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

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<L1EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [seatCount, setSeatCount] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const loadEvent = async () => {
    if (!eventId) return
    try {
      setLoading(true)
      const data = await eventMobileService.getEventById(eventId)
      setEvent(data)
      if (data?.myRegistration?.seatCount) {
        setSeatCount(data.myRegistration.seatCount)
      } else {
        setSeatCount(1)
      }
    } catch (err) {
      console.error('Failed to load event detail:', err)
      toast.error('Failed to load event details')
      setEvent(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!eventId) return
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const data = await eventMobileService.getEventById(eventId)
        if (ignore) return
        setEvent(data)
        if (data?.myRegistration?.seatCount) {
          setSeatCount(data.myRegistration.seatCount)
        } else {
          setSeatCount(1)
        }
      } catch (err) {
        console.error('Failed to load event detail:', err)
        if (!ignore) {
          toast.error('Failed to load event details')
          setEvent(null)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [eventId])

  const maxSeats = useMemo(() => {
    if (!event) return 1
    const perFlat = event.reservationPerFlat && event.reservationPerFlat > 0 ? event.reservationPerFlat : 1
    const available = event.capacity.availableSpots
    if (available === null) return perFlat
    if (available <= 0) return 1
    return Math.min(perFlat, available)
  }, [event])

  const effectiveSeatCount = Math.min(seatCount, maxSeats)

  const alreadyReserved = Boolean(event?.myRegistration)
  const canReserve =
    Boolean(event?.allowReservation) &&
    !alreadyReserved &&
    !event?.capacity.isFullyBooked &&
    (event?.capacity.availableSpots === null || (event?.capacity.availableSpots ?? 0) > 0)

  const posterUrl = getFileUrl(event?.poster || event?.venue?.coverPhoto)

  const handleReserve = async () => {
    if (!eventId || !event || !canReserve) return
    try {
      setSubmitting(true)
      const res = await eventMobileService.reserveSeats(eventId, { seatCount: effectiveSeatCount })
      if (res?.success) {
        toast.success(res.message || `Reserved ${effectiveSeatCount} seat(s)`)
        await loadEvent()
      } else {
        toast.error(res?.message || 'Failed to reserve seats')
      }
    } catch (err) {
      console.error('Reserve seats failed:', err)
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to reserve seats'
        : 'Failed to reserve seats'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-8 font-sans select-none">
        <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-black tracking-tight">Event Details</h2>
          </div>
        </div>
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Loading event details...</p>
        </Card>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-4 pb-8 font-sans select-none">
        <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-black tracking-tight">Event Details</h2>
          </div>
        </div>
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground space-y-2">
          <PartyPopper className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h4 className="font-bold text-sm text-foreground">Event Not Found</h4>
          <p className="text-xs">This event may have been removed or is unavailable.</p>
          <Button
            onClick={() => navigate('/events')}
            className="mt-2 bg-[#005390] hover:bg-[#004070] text-white text-xs rounded-xl"
          >
            Back to Events
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      {/* Header */}
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer shrink-0"
            aria-label="Back to events"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white backdrop-blur">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Event Details</h2>
              <p className="text-[11px] text-blue-100 font-semibold mt-0.5 truncate max-w-[220px]">{event.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Poster */}
      <Card className="rounded-3xl border border-rose-200/60 dark:border-rose-900/40 overflow-hidden shadow-sm">
        <div className="aspect-square bg-gradient-to-br from-rose-50 to-pink-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
          {posterUrl ? (
            <img src={posterUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageOff className="w-12 h-12 opacity-40" />
              <span className="text-xs font-semibold">No poster available</span>
            </div>
          )}
        </div>
      </Card>

      {/* Event details */}
      <Card className="rounded-3xl border border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Event Name</span>
              <p className="font-extrabold text-gray-900 dark:text-white mt-0.5">{event.title}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                Event Description
              </span>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">
                {event.description || '—'}
              </p>
            </div>
            <div className="flex items-start gap-4 pt-1">
              <div className="flex-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-rose-500" /> Date
                </span>
                <p className="text-xs font-extrabold text-gray-900 dark:text-white mt-0.5">
                  {formatEventDate(event.startDate)}
                </p>
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-500" /> Time
                </span>
                <p className="text-xs font-extrabold text-gray-900 dark:text-white mt-0.5">
                  {formatEventTime(event.startDate)} – {formatEventTime(event.endDate)}
                </p>
              </div>
            </div>
            {event.venue?.name && (
              <p className="text-[11px] text-muted-foreground font-medium">Venue: {event.venue.name}</p>
            )}
          </div>

          <div className="border-t border-dashed border-border/60 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Reserve your seat</h3>
              {alreadyReserved ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-none text-[9px] font-extrabold">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Reserved
                </Badge>
              ) : event.capacity.isFullyBooked ? (
                <Badge className="bg-amber-100 text-amber-800 border-none text-[9px] font-extrabold">
                  Fully Booked
                </Badge>
              ) : !event.allowReservation ? (
                <Badge className="bg-gray-100 text-gray-600 border-none text-[9px] font-extrabold">
                  No Reservation
                </Badge>
              ) : event.capacity.availableSpots !== null ? (
                <Badge className="bg-rose-100 text-rose-800 border-none text-[9px] font-extrabold">
                  {event.capacity.availableSpots} left
                </Badge>
              ) : null}
            </div>

            {alreadyReserved ? (
              <p className="text-xs text-muted-foreground font-medium">
                You reserved <span className="font-extrabold text-foreground">{event.myRegistration?.seatCount}</span>{' '}
                seat(s) · Status: {event.myRegistration?.status}
              </p>
            ) : canReserve ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSeatCount((n) => Math.max(1, Math.min(n, maxSeats) - 1))}
                  disabled={effectiveSeatCount <= 1}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground disabled:opacity-40 cursor-pointer"
                  aria-label="Decrease seats"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <span className="text-lg font-black">{effectiveSeatCount}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSeatCount((n) => Math.min(maxSeats, Math.min(n, maxSeats) + 1))}
                  disabled={effectiveSeatCount >= maxSeats}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground disabled:opacity-40 cursor-pointer"
                  aria-label="Increase seats"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-[11px] text-muted-foreground font-semibold ml-1">Max {maxSeats} per flat</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-medium">
                {!event.allowReservation
                  ? 'Seat reservation is not enabled for this event.'
                  : 'No seats are currently available.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => void handleReserve()}
        disabled={!canReserve || submitting}
        className="w-full h-12 rounded-2xl bg-[#005390] hover:bg-[#004070] text-white font-extrabold text-sm shadow-lg disabled:opacity-50 cursor-pointer"
      >
        {submitting
          ? 'Reserving...'
          : alreadyReserved
            ? 'Already Reserved'
            : !event.allowReservation
              ? 'Reservation Unavailable'
              : event.capacity.isFullyBooked
                ? 'Fully Booked'
                : 'Reserve Seats'}
      </Button>
    </div>
  )
}
