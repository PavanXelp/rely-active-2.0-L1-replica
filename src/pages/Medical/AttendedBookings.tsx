import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarIcon, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { appointmentMobileService } from '@/lib/services/appointmentService'
import type { L1MyBooking } from '@/lib/types/appointment'
import { toast } from 'sonner'
import { BookingCard } from './components/BookingCard'
import {
  compareAttendedDesc,
  formatDateLabel,
  isVisitingBooking,
  todayYmd,
  ymdToDate,
} from './components/bookingFormat'
import { EmptyState } from './components/EmptyState'

export default function AttendedBookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<L1MyBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null
  const [calendarOpen, setCalendarOpen] = useState(false)

  const setSelectedDate = (date: string | null) => setSearchParams(date ? { date } : {}, { replace: true })

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const list = await appointmentMobileService.getMyBookings(undefined, 'ATTENDED')
        if (!ignore) {
          setBookings(list.filter((b) => b.status === 'ATTENDED' && isVisitingBooking(b)).sort(compareAttendedDesc))
        }
      } catch (err) {
        console.error('Failed to load attended bookings:', err)
        if (!ignore) toast.error('Failed to load attended appointments')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [])

  const attendedDates = useMemo(() => [...new Set(bookings.map((b) => b.appointmentDate))].map(ymdToDate), [bookings])

  const visibleBookings = useMemo(
    () => (selectedDate ? bookings.filter((b) => b.appointmentDate === selectedDate) : bookings),
    [bookings, selectedDate],
  )

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/medical?tab=booking')}
            className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black tracking-tight">Attended Appointments</h2>
            <p className="text-[11px] text-blue-100 font-medium">
              {loading
                ? 'Loading...'
                : `${visibleBookings.length} appointment${visibleBookings.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <ClipboardCheck className="w-5 h-5 text-teal-200 shrink-0" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedDate(null)}
          className={`px-3.5 py-2 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
            !selectedDate
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 border border-border text-muted-foreground'
          }`}
        >
          All
        </button>
        <Popover open={calendarOpen} onOpenChange={(open) => setCalendarOpen(open)}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className={`flex-1 justify-start rounded-2xl text-[11px] font-bold h-9 ${
                  selectedDate ? 'border-teal-500 text-teal-700 dark:text-teal-300' : 'text-muted-foreground'
                }`}
              />
            }
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {selectedDate ? formatDateLabel(selectedDate) : 'Filter by date'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate ? ymdToDate(selectedDate) : undefined}
              onSelect={(date) => {
                if (!date) return
                setSelectedDate(todayYmd(date))
                setCalendarOpen(false)
              }}
              modifiers={{ hasAttended: attendedDates }}
              modifiersClassNames={{
                hasAttended:
                  '[&_button]:font-black [&_button]:text-teal-600 dark:[&_button]:text-teal-400 [&_button]:underline [&_button]:underline-offset-4',
              }}
            />
            <p className="px-3 pb-3 text-[10px] text-muted-foreground font-semibold">
              Underlined dates have attended appointments.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Loading...</p>
        </Card>
      ) : visibleBookings.length === 0 ? (
        <EmptyState
          title="No Attended Appointments"
          description={
            selectedDate
              ? `No attended appointments on ${formatDateLabel(selectedDate)}.`
              : 'Attended appointments will appear here.'
          }
        />
      ) : (
        <div className="space-y-2.5">
          {visibleBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              clickable
              diagnosed
              onClick={() => navigate(`/medical/bookings/${b.id}/diagnosis`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
