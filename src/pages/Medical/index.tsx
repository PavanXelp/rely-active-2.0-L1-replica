import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ChevronRight, Clock, MapPin, Stethoscope, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { appointmentMobileService } from '@/lib/services/appointmentService'
import type { L1AppointmentListItem, L1InhouseAppointmentListItem, L1MyBooking } from '@/lib/types/appointment'
import { toast } from 'sonner'

type DoctorTab = 'inhouse' | 'visiting'
type VisitingSubTab = 'appointments' | 'booking' | 'history'
type InhouseSubTab = 'appointments' | 'history'

function formatMonth(dateStr: string): string {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })
  } catch {
    return '—'
  }
}

function formatDay(dateStr: string): string {
  try {
    return String(new Date(`${dateStr}T00:00:00`).getDate())
  } catch {
    return '—'
  }
}

function formatDateLabel(dateStr: string): string {
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

function tabButtonClass(active: boolean): string {
  return `flex-1 px-2.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
    active
      ? 'bg-teal-600 text-white shadow-md'
      : 'bg-white dark:bg-slate-900 border border-border text-muted-foreground'
  }`
}

function BookingCard({
  booking,
  clickable,
  onClick,
}: {
  booking: L1MyBooking
  clickable?: boolean
  onClick?: () => void
}) {
  const content = (
    <CardContent className="p-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{booking.doctorName}</h4>
          <p className="text-[11px] text-muted-foreground font-medium">
            {booking.shiftName} · {formatDateLabel(booking.appointmentDate)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-none text-[9px] font-extrabold">
            {booking.status}
          </Badge>
          {clickable && <ChevronRight className="w-4 h-4 text-gray-300" />}
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-semibold">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {booking.slotTimeRange}
        </span>
        <span className="inline-flex items-center gap-1">
          <User className="w-3 h-3" />
          {booking.memberName}
          {booking.memberRelation ? ` · ${booking.memberRelation}` : ''}
        </span>
      </div>
    </CardContent>
  )

  if (clickable && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-3xl border border-teal-200/60 dark:border-teal-900/40 bg-white dark:bg-slate-900 shadow-sm hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors cursor-pointer"
      >
        {content}
      </button>
    )
  }

  return (
    <Card className="rounded-3xl border border-teal-200/60 dark:border-teal-900/40 bg-white dark:bg-slate-900 shadow-sm">
      {content}
    </Card>
  )
}

function EmptyState({
  title,
  description,
  icon = 'calendar',
}: {
  title: string
  description: string
  icon?: 'calendar' | 'stethoscope'
}) {
  return (
    <Card className="rounded-3xl border border-border/60 p-8 text-center space-y-2">
      {icon === 'stethoscope' ? (
        <Stethoscope className="w-10 h-10 mx-auto text-teal-300" />
      ) : (
        <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40" />
      )}
      <h4 className="font-bold text-sm text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  )
}

export default function MedicalPage() {
  const navigate = useNavigate()
  const [doctorTab, setDoctorTab] = useState<DoctorTab>('visiting')
  const [visitingSubTab, setVisitingSubTab] = useState<VisitingSubTab>('appointments')
  const [inhouseSubTab, setInhouseSubTab] = useState<InhouseSubTab>('appointments')
  const [appointments, setAppointments] = useState<L1AppointmentListItem[]>([])
  const [inhouseAppointments, setInhouseAppointments] = useState<L1InhouseAppointmentListItem[]>([])
  const [myBookings, setMyBookings] = useState<L1MyBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const [visitingList, inhouseList, bookings] = await Promise.all([
          appointmentMobileService.listAppointments(),
          appointmentMobileService.listInhouseAppointments(),
          appointmentMobileService.getMyBookings(),
        ])
        if (ignore) return
        setAppointments(visitingList)
        setInhouseAppointments(inhouseList)
        setMyBookings(bookings)
      } catch (err) {
        console.error('Failed to load medical appointments:', err)
        if (!ignore) toast.error('Failed to load appointments')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [])

  const visitingBookings = useMemo(
    () => myBookings.filter((b) => !b.doctorCategory || b.doctorCategory === 'VISITING'),
    [myBookings],
  )
  const inhouseBookings = useMemo(() => myBookings.filter((b) => b.doctorCategory === 'INHOUSE'), [myBookings])

  const upcomingVisitingCount = appointments.filter((a) => !a.isFullyBooked).length
  const activeVisitingBookings = useMemo(
    () => visitingBookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING'),
    [visitingBookings],
  )
  const visitingHistory = useMemo(() => visitingBookings.filter((b) => b.status === 'ATTENDED'), [visitingBookings])
  const inhouseHistory = useMemo(() => inhouseBookings.filter((b) => b.status === 'ATTENDED'), [inhouseBookings])

  const headerSubtitle =
    doctorTab === 'inhouse' ? 'In-house doctors assigned to your flat' : 'Book visiting doctor slots'

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black tracking-tight">Medical</h2>
            <p className="text-[11px] text-blue-100 font-medium">{headerSubtitle}</p>
          </div>
          <Stethoscope className="w-5 h-5 text-teal-200 shrink-0" />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDoctorTab('inhouse')}
          className={tabButtonClass(doctorTab === 'inhouse')}
        >
          In-house Dr
        </button>
        <button
          type="button"
          onClick={() => setDoctorTab('visiting')}
          className={tabButtonClass(doctorTab === 'visiting')}
        >
          Visiting Dr
        </button>
      </div>

      {doctorTab === 'inhouse' ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInhouseSubTab('appointments')}
            className={tabButtonClass(inhouseSubTab === 'appointments')}
          >
            Appointments
            {inhouseAppointments.length > 0 && (
              <span className="ml-1 text-[10px] opacity-90">({inhouseAppointments.length})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setInhouseSubTab('history')}
            className={tabButtonClass(inhouseSubTab === 'history')}
          >
            History
            {inhouseHistory.length > 0 && (
              <span className="ml-1 text-[10px] opacity-90">({inhouseHistory.length})</span>
            )}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVisitingSubTab('appointments')}
            className={tabButtonClass(visitingSubTab === 'appointments')}
          >
            Appointments
            {upcomingVisitingCount > 0 && (
              <span className="ml-1 text-[10px] opacity-90">({upcomingVisitingCount})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setVisitingSubTab('booking')}
            className={tabButtonClass(visitingSubTab === 'booking')}
          >
            Booking
            {activeVisitingBookings.length > 0 && (
              <span className="ml-1 text-[10px] opacity-90">({activeVisitingBookings.length})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setVisitingSubTab('history')}
            className={tabButtonClass(visitingSubTab === 'history')}
          >
            History
            {visitingHistory.length > 0 && (
              <span className="ml-1 text-[10px] opacity-90">({visitingHistory.length})</span>
            )}
          </button>
        </div>
      )}

      {loading ? (
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Loading...</p>
        </Card>
      ) : doctorTab === 'inhouse' ? (
        inhouseSubTab === 'appointments' ? (
          inhouseAppointments.length === 0 ? (
            <EmptyState
              icon="stethoscope"
              title="No In-house Doctors"
              description="No in-house doctor shifts are currently assigned for your flat."
            />
          ) : (
            <Card className="rounded-3xl border border-teal-200/60 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {inhouseAppointments.map((item, index) => (
                  <div key={item.shiftEmployeeDateId}>
                    <div className="w-full flex items-center gap-3 p-3.5">
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
                          {item.doctor?.fullName || 'In-house Doctor'}
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                          {item.doctor?.specialization || 'In-house Doctor'}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-muted-foreground font-semibold">
                          {item.effectiveTime && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.effectiveTime}
                            </span>
                          )}
                          {item.scopeLabel && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.scopeLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < inhouseAppointments.length - 1 && (
                      <div className="h-px bg-teal-100/80 dark:bg-teal-900/40 mx-3.5" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        ) : inhouseHistory.length === 0 ? (
          <EmptyState title="No History Yet" description="Attended in-house doctor visits will appear here." />
        ) : (
          <div className="space-y-2.5">
            {inhouseHistory.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                clickable
                onClick={() => navigate(`/medical/bookings/${b.id}/diagnosis`)}
              />
            ))}
          </div>
        )
      ) : visitingSubTab === 'appointments' ? (
        appointments.length === 0 ? (
          <EmptyState
            icon="stethoscope"
            title="No Visiting Doctors"
            description="There are no upcoming visiting doctor shifts available to book."
          />
        ) : (
          <Card className="rounded-3xl border border-teal-200/60 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {appointments.map((item, index) => (
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
                  {index < appointments.length - 1 && (
                    <div className="h-px bg-teal-100/80 dark:bg-teal-900/40 mx-3.5" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )
      ) : visitingSubTab === 'booking' ? (
        activeVisitingBookings.length === 0 ? (
          <EmptyState title="No Bookings Yet" description="Your flat's appointment bookings will appear here." />
        ) : (
          <div className="space-y-2.5">
            {activeVisitingBookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )
      ) : visitingHistory.length === 0 ? (
        <EmptyState title="No History Yet" description="Attended appointments will appear here after your visit." />
      ) : (
        <div className="space-y-2.5">
          {visitingHistory.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              clickable
              onClick={() => navigate(`/medical/bookings/${b.id}/diagnosis`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
