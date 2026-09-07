import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ChevronRight, MapPin, PartyPopper } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { eventMobileService } from '@/lib/services/eventService'
import type { L1Event, L1EventRequest } from '@/lib/types/event'
import { toast } from 'sonner'

function formatMonth(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' })
  } catch {
    return '—'
  }
}

function formatDay(dateStr: string): string {
  try {
    return String(new Date(dateStr).getDate())
  } catch {
    return '—'
  }
}

function formatBookingSubtitle(request: L1EventRequest): string {
  if (request.status?.toUpperCase() === 'CANCELLED' && request.cancellationReason?.trim()) {
    return `Canceled: ${request.cancellationReason.trim()}`
  }
  if (request.status?.toUpperCase() === 'IN_PROGRESS' && request.meetingScheduledAt) {
    try {
      const meetingLabel = new Date(request.meetingScheduledAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      return `Meeting: ${meetingLabel}`
    } catch {
      // fall through
    }
  }
  const venueName = request.venue?.name
  const dateLabel = (() => {
    try {
      return new Date(request.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return null
    }
  })()
  if (venueName && dateLabel) return `${venueName} · ${dateLabel}`
  if (venueName) return venueName
  if (request.requestNumber) return request.requestNumber
  return statusLabel(request.status)
}

function statusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case 'OPEN':
      return 'Open'
    case 'IN_PROGRESS':
      return 'In-Progress'
    case 'CLOSED':
      return 'Confirm'
    case 'REJECTED':
      return 'Rejected'
    case 'CANCELLED':
      return 'Canceled'
    default:
      return status || '—'
  }
}

function statusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case 'CLOSED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
    case 'IN_PROGRESS':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
    case 'OPEN':
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
  }
}

function EventListRows({ events, onSelect }: { events: L1Event[]; onSelect: (id: string) => void }) {
  return (
    <Card className="rounded-3xl border border-rose-200/60 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {events.map((event, index) => (
          <div key={event.id}>
            <button
              type="button"
              onClick={() => onSelect(event.id)}
              className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            >
              <div className="w-12 shrink-0 rounded-xl overflow-hidden border border-rose-200 dark:border-rose-800 shadow-sm">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-extrabold text-center py-1 uppercase tracking-wide">
                  {formatMonth(event.startDate)}
                </div>
                <div className="bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-sm font-black text-center py-1.5">
                  {formatDay(event.startDate)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{event.title}</h4>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                  {event.description || event.venue?.name || 'Community event'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
            {index < events.length - 1 && (
              <div className="mx-3.5 border-b border-dashed border-rose-100 dark:border-rose-900/40" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function EventsPage() {
  const navigate = useNavigate()
  const [upcoming, setUpcoming] = useState<L1Event[]>([])
  const [todayEvents, setTodayEvents] = useState<L1Event[]>([])
  const [bookings, setBookings] = useState<L1EventRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)

  useEffect(() => {
    let ignore = false
    const loadEvents = async () => {
      try {
        setLoading(true)
        const [upcomingData, todayData, bookingData] = await Promise.all([
          eventMobileService.getEvents('upcoming'),
          eventMobileService.getEvents('today'),
          eventMobileService.getMyEventRequests(),
        ])
        if (!ignore) {
          setUpcoming(upcomingData)
          setTodayEvents(todayData)
          setBookings(bookingData)
        }
      } catch (err) {
        console.error('Failed to load events:', err)
        if (!ignore) {
          toast.error('Failed to load events')
          setUpcoming([])
          setTodayEvents([])
          setBookings([])
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void loadEvents()
    return () => {
      ignore = true
    }
  }, [])

  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, 2)

  return (
    <div className="space-y-5 pb-8 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer shrink-0"
            aria-label="Back to overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white backdrop-blur">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Events</h2>
              <p className="text-[11px] text-blue-100 font-semibold mt-0.5">
                Celebrations, today&apos;s schedule &amp; venue booking
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            Upcoming Events
          </h3>
          <Badge className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-none text-[9px] font-extrabold">
            {upcoming.length} Total
          </Badge>
        </div>

        {loading ? (
          <Card className="rounded-3xl border border-border/60 p-6 text-center text-muted-foreground">
            <p className="text-xs font-semibold">Loading upcoming events...</p>
          </Card>
        ) : upcoming.length === 0 ? (
          <Card className="rounded-3xl border border-border/60 p-6 text-center text-muted-foreground space-y-2">
            <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <h4 className="font-bold text-sm text-foreground">No Upcoming Events</h4>
            <p className="text-xs">There are no upcoming celebrations scheduled yet.</p>
          </Card>
        ) : (
          <>
            <EventListRows events={visibleUpcoming} onSelect={(id) => navigate(`/events/${id}`)} />
            {upcoming.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllUpcoming((prev) => !prev)}
                className="w-full text-center text-xs font-extrabold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                {showAllUpcoming ? 'Show Less' : 'View All'}
              </button>
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider px-1">
          Today&apos;s Events
        </h3>

        {loading ? (
          <Card className="rounded-3xl border border-border/60 p-6 text-center text-muted-foreground">
            <p className="text-xs font-semibold">Loading today&apos;s events...</p>
          </Card>
        ) : todayEvents.length === 0 ? (
          <Card className="rounded-3xl border border-border/60 p-6 text-center text-muted-foreground space-y-2">
            <PartyPopper className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <h4 className="font-bold text-sm text-foreground">No Events Today</h4>
            <p className="text-xs">There are no events for today</p>
          </Card>
        ) : (
          <EventListRows events={todayEvents} onSelect={(id) => navigate(`/events/${id}`)} />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            Requested List
          </h3>
          {bookings.length > 0 && (
            <Badge className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-none text-[9px] font-extrabold">
              {bookings.length} Request{bookings.length === 1 ? '' : 's'}
            </Badge>
          )}
        </div>

        <Card
          onClick={() => navigate('/events/book')}
          className="rounded-3xl border-2 border-rose-200/80 dark:border-rose-900/40 bg-gradient-to-br from-white via-white to-rose-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm hover:shadow-md hover:border-rose-400 transition-all cursor-pointer group"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">
                  Book a Venue
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Reserve community spaces for your event
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
          </CardContent>
        </Card>

        {!loading && bookings.length > 0 && (
          <Card className="rounded-3xl border border-rose-200/60 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {bookings.map((booking, index) => (
                <div key={booking.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/events/bookings/${booking.id}`)}
                    className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                  >
                    <div className="w-12 shrink-0 rounded-xl overflow-hidden border border-rose-200 dark:border-rose-800 shadow-sm">
                      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-extrabold text-center py-1 uppercase tracking-wide">
                        {formatMonth(booking.startDate)}
                      </div>
                      <div className="bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-sm font-black text-center py-1.5">
                        {formatDay(booking.startDate)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                          {booking.title}
                        </h4>
                        <Badge
                          className={`${statusBadgeClass(booking.status)} border-none text-[8px] font-extrabold shrink-0`}
                        >
                          {statusLabel(booking.status)}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                        {formatBookingSubtitle(booking)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                  {index < bookings.length - 1 && (
                    <div className="mx-3.5 border-b border-dashed border-rose-100 dark:border-rose-900/40" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
