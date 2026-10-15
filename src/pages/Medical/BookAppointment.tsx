import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarIcon, CalendarPlus, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { appointmentMobileService } from '@/lib/services/appointmentService'
import type { L1AppointmentListItem } from '@/lib/types/appointment'
import { toast } from 'sonner'
import { formatDateLabel, formatDay, formatMonth, todayYmd, ymdToDate } from './components/bookingFormat'
import { EmptyState } from './components/EmptyState'

export default function BookAppointmentPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<L1AppointmentListItem[]>([])
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
        const list = await appointmentMobileService.listAppointments()
        if (!ignore) setAppointments(list)
      } catch (err) {
        console.error('Failed to load visiting doctors:', err)
        if (!ignore) toast.error('Failed to load visiting doctors')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [])

  const shiftDates = useMemo(() => [...new Set(appointments.map((a) => a.date))].map(ymdToDate), [appointments])

  const visibleAppointments = useMemo(
    () => (selectedDate ? appointments.filter((a) => a.date === selectedDate) : appointments),
    [appointments, selectedDate],
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
            <h2 className="text-base font-black tracking-tight">Book Appointment</h2>
            <p className="text-[11px] text-blue-100 font-medium">Choose a visiting doctor shift</p>
          </div>
          <CalendarPlus className="w-5 h-5 text-teal-200 shrink-0" />
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
              defaultMonth={selectedDate ? ymdToDate(selectedDate) : undefined}
              onSelect={(date) => {
                if (!date) return
                setSelectedDate(todayYmd(date))
                setCalendarOpen(false)
              }}
              disabled={{ before: ymdToDate(todayYmd()) }}
              modifiers={{ hasShift: shiftDates }}
              modifiersClassNames={{
                hasShift:
                  '[&_button]:font-black [&_button]:text-teal-600 dark:[&_button]:text-teal-400 [&_button]:underline [&_button]:underline-offset-4',
              }}
            />
            <p className="px-3 pb-3 text-[10px] text-muted-foreground font-semibold">
              Underlined dates have visiting doctors.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Loading...</p>
        </Card>
      ) : visibleAppointments.length === 0 ? (
        <EmptyState
          icon="stethoscope"
          title="No Visiting Doctors"
          description={
            selectedDate
              ? `No visiting doctors on ${formatDateLabel(selectedDate)}.`
              : 'There are no upcoming visiting doctor shifts available to book.'
          }
        />
      ) : (
        <Card className="rounded-3xl border border-teal-200/60 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {visibleAppointments.map((item, index) => (
              <div key={item.shiftEmployeeDateId}>
                <button
                  type="button"
                  onClick={() => navigate(`/medical/appointments/${item.shiftEmployeeDateId}`)}
                  className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors cursor-pointer"
                >
                  <div className="w-12 shrink-0 rounded-xl overflow-hidden border border-teal-200 dark:border-teal-800 shadow-sm">
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[9px] font-extrabold text-center py-1 uppercase tracking-wide">
                      {formatMonth(item.date)}
                    </div>
                    <div className="bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 text-sm font-black text-center py-1.5">
                      {formatDay(item.date)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                      {item.doctor?.fullName || 'Visiting Doctor'}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                      {item.doctor?.specialization || 'Visiting Doctor'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        className={`text-[9px] font-extrabold border-none ${
                          item.isFullyBooked
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        }`}
                      >
                        {item.isFullyBooked
                          ? 'Fully Booked'
                          : `${item.availableSlots} slot${item.availableSlots === 1 ? '' : 's'} left`}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
                {index < visibleAppointments.length - 1 && (
                  <div className="h-px bg-teal-100/80 dark:bg-teal-900/40 mx-3.5" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
