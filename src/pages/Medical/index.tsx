import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarPlus, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { appointmentMobileService } from '@/lib/services/appointmentService'
import type { L1MyBooking } from '@/lib/types/appointment'
import { toast } from 'sonner'
import { BookingCard } from './components/BookingCard'
import { compareAttendedDesc, isVisitingBooking, todayYmd } from './components/bookingFormat'
import { EmptyState } from './components/EmptyState'
import { MedicalHistoryTab } from './components/MedicalHistoryTab'

type MedicalTab = 'booking' | 'history'

const ACTIVE_STATUSES = ['CONFIRMED', 'PENDING']
const ATTENDED_PREVIEW_LIMIT = 2

function tabButtonClass(active: boolean): string {
  return `flex-1 px-2.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
    active
      ? 'bg-teal-600 text-white shadow-md'
      : 'bg-white dark:bg-slate-900 border border-border text-muted-foreground'
  }`
}

function BookingSection({
  title,
  emptyText,
  bookings,
  diagnosed,
  limit,
  onViewAll,
  onOpen,
}: {
  title: string
  emptyText: string
  bookings: L1MyBooking[]
  diagnosed?: boolean
  limit?: number
  onViewAll?: () => void
  onOpen: (booking: L1MyBooking) => void
}) {
  const visible = limit ? bookings.slice(0, limit) : bookings
  const showViewAll = Boolean(onViewAll && limit && bookings.length > limit)

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-extrabold text-foreground">{title}</h3>
        {showViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
          >
            View all ({bookings.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">{bookings.length}</span>
        )}
      </div>
      {bookings.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-border/60 px-4 py-3">
          <p className="text-[11px] text-muted-foreground font-medium">{emptyText}</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {visible.map((b) => (
            <BookingCard key={b.id} booking={b} clickable diagnosed={diagnosed} onClick={() => onOpen(b)} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function MedicalPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: MedicalTab = searchParams.get('tab') === 'history' ? 'history' : 'booking'
  const [bookings, setBookings] = useState<L1MyBooking[]>([])
  const [loading, setLoading] = useState(true)

  const setActiveTab = (tab: MedicalTab) => setSearchParams({ tab }, { replace: true })

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const list = await appointmentMobileService.getMyBookings()
        if (!ignore) setBookings(list.filter(isVisitingBooking))
      } catch (err) {
        console.error('Failed to load bookings:', err)
        if (!ignore) toast.error('Failed to load bookings')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [])

  const { todayBookings, upcomingBookings, attendedBookings } = useMemo(() => {
    const today = todayYmd()
    const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status))
    return {
      todayBookings: active
        .filter((b) => b.appointmentDate === today)
        .sort((a, b) => a.slotTimeRange.localeCompare(b.slotTimeRange)),
      upcomingBookings: active
        .filter((b) => b.appointmentDate > today)
        .sort(
          (a, b) =>
            a.appointmentDate.localeCompare(b.appointmentDate) || a.slotTimeRange.localeCompare(b.slotTimeRange),
        ),
      attendedBookings: bookings.filter((b) => b.status === 'ATTENDED').sort(compareAttendedDesc),
    }
  }, [bookings])

  const openDiagnosis = (booking: L1MyBooking) => navigate(`/medical/bookings/${booking.id}/diagnosis`)

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black tracking-tight">Medical</h2>
            <p className="text-[11px] text-blue-100 font-medium">Appointments &amp; health history</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/medical/book')}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white text-[#005390] text-[11px] font-extrabold shadow-sm hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Book Appointment
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('booking')}
          className={tabButtonClass(activeTab === 'booking')}
        >
          Booking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={tabButtonClass(activeTab === 'history')}
        >
          History
        </button>
      </div>

      {activeTab === 'history' ? (
        <MedicalHistoryTab />
      ) : loading ? (
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Loading...</p>
        </Card>
      ) : bookings.length === 0 ? (
        <EmptyState title="No Bookings Yet" description="Tap Book Appointment to book a visiting doctor slot." />
      ) : (
        <div className="space-y-5">
          <BookingSection
            title="Today's Booking"
            emptyText="No bookings for today."
            bookings={todayBookings}
            onOpen={openDiagnosis}
          />
          <BookingSection
            title="Upcoming Booking"
            emptyText="No upcoming bookings."
            bookings={upcomingBookings}
            onOpen={openDiagnosis}
          />
          <BookingSection
            title="Attended"
            emptyText="Attended appointments will appear here."
            bookings={attendedBookings}
            diagnosed
            limit={ATTENDED_PREVIEW_LIMIT}
            onViewAll={() => navigate('/medical/attended')}
            onOpen={openDiagnosis}
          />
        </div>
      )}
    </div>
  )
}
