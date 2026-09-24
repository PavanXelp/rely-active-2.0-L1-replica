import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Stethoscope } from 'lucide-react'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { appointmentMobileService } from '@/lib/services/appointmentService'
import type { L1AppointmentDetail } from '@/lib/types/appointment'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function formatDateLabel(dateStr: string): string {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function AppointmentDetailPage() {
  const { shiftEmployeeDateId } = useParams<{ shiftEmployeeDateId: string }>()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<L1AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [slotError, setSlotError] = useState<string | undefined>()

  const loadDetail = async () => {
    if (!shiftEmployeeDateId) return
    try {
      setLoading(true)
      const data = await appointmentMobileService.getAppointmentDetail(shiftEmployeeDateId)
      setDetail(data)
      setSelectedSlot('')
    } catch (err) {
      console.error('Failed to load appointment detail:', err)
      toast.error('Failed to load doctor appointment')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!shiftEmployeeDateId) return
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const data = await appointmentMobileService.getAppointmentDetail(shiftEmployeeDateId)
        if (ignore) return
        setDetail(data)
      } catch (err) {
        console.error('Failed to load appointment detail:', err)
        if (!ignore) {
          toast.error('Failed to load doctor appointment')
          setDetail(null)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [shiftEmployeeDateId])

  const availableSlots = useMemo(
    () => (detail?.slots || []).filter((s) => s.isAvailable !== false && !s.isBooked && !s.isPast),
    [detail],
  )
  const canBook = Boolean(detail && !detail.capacity.isFullyBooked && availableSlots.length > 0)

  const validate = () => {
    if (!selectedSlot) {
      setSlotError('Please select an available slot')
      return false
    }
    const slot = detail?.slots.find((s) => s.slotTimeRange === selectedSlot)
    if (slot?.isBooked) {
      setSlotError('This slot is already booked')
      return false
    }
    if (slot?.isPast || slot?.isAvailable === false) {
      setSlotError('This slot time has already passed')
      return false
    }
    setSlotError(undefined)
    return true
  }

  const handleBook = async () => {
    if (!shiftEmployeeDateId || !detail || !canBook) return
    if (!validate()) return

    try {
      setSubmitting(true)
      const res = await appointmentMobileService.bookAppointment(shiftEmployeeDateId, {
        slotTimeRange: selectedSlot,
      })
      if (res?.success) {
        toast.success(res.message || 'Appointment booked successfully')
        setSelectedSlot('')
        setSlotError(undefined)
        await loadDetail()
      } else {
        toast.error(res?.message || 'Failed to book appointment')
      }
    } catch (err) {
      console.error('Book appointment failed:', err)
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to book appointment'
        : 'Failed to book appointment'
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
              onClick={() => navigate('/medical')}
              className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-black tracking-tight">Book Appointment</h2>
          </div>
        </div>
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Loading...</p>
        </Card>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="space-y-4 pb-8 font-sans select-none">
        <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/medical')}
              className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-black tracking-tight">Book Appointment</h2>
          </div>
        </div>
        <Card className="rounded-3xl border border-border/60 p-8 text-center space-y-2">
          <Stethoscope className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h4 className="font-bold text-sm">Doctor Shift Not Found</h4>
          <Button onClick={() => navigate('/medical')} className="mt-2 rounded-2xl bg-[#005390]">
            Back to Medical
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/medical')}
            className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black tracking-tight truncate">
              {detail.doctor?.fullName || 'Visiting Doctor'}
            </h2>
            <p className="text-[11px] text-blue-100 font-medium truncate">
              {detail.shift?.name || 'Shift'} · {formatDateLabel(detail.date)}
            </p>
          </div>
        </div>
      </div>

      <Card className="rounded-3xl border border-teal-200/70 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/30 dark:from-slate-900 dark:to-slate-800 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                {detail.doctor?.fullName || 'Visiting Doctor'}
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                {detail.doctor?.specialization || 'Visiting Doctor'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 border border-teal-100 dark:border-teal-900/40 p-2.5">
              <div className="flex items-center gap-1 text-muted-foreground font-semibold mb-0.5">
                <CalendarDays className="w-3 h-3" /> Date
              </div>
              <div className="font-bold text-gray-900 dark:text-white">{formatDateLabel(detail.date)}</div>
            </div>
            <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 border border-teal-100 dark:border-teal-900/40 p-2.5">
              <div className="flex items-center gap-1 text-muted-foreground font-semibold mb-0.5">
                <Clock className="w-3 h-3" /> Time
              </div>
              <div className="font-bold text-gray-900 dark:text-white">
                {detail.effectiveTime || `${detail.shift?.startTime} - ${detail.shift?.endTime}`}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-muted-foreground">
              Slots: {detail.capacity.availableSlots}/{detail.capacity.totalSlots} available
            </span>
            {detail.capacity.isFullyBooked ? (
              <Badge className="bg-rose-100 text-rose-800 border-none text-[9px] font-extrabold">Fully Booked</Badge>
            ) : (
              <Badge className="bg-teal-100 text-teal-800 border-none text-[9px] font-extrabold">Open</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Book Appointment</h3>
          <p className="text-[11px] text-muted-foreground font-medium">
            Booking is for your logged-in account. Family members book from their own login.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">
              Available Slot <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(detail.slots || []).map((slot) => {
                const selected = selectedSlot === slot.slotTimeRange
                const isPast = Boolean(slot.isPast)
                const disabled = slot.isBooked || isPast || slot.isAvailable === false
                return (
                  <button
                    key={slot.slotTimeRange}
                    type="button"
                    disabled={disabled || !canBook}
                    onClick={() => {
                      setSelectedSlot(slot.slotTimeRange)
                      setSlotError(undefined)
                    }}
                    className={cn(
                      'rounded-2xl border px-2.5 py-2.5 text-[11px] font-bold text-left transition-all cursor-pointer',
                      disabled && 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-slate-800',
                      !disabled && selected && 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40',
                      !disabled && !selected && 'border-border hover:border-teal-300 bg-white dark:bg-slate-900',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{slot.slotTimeRange}</span>
                      {slot.isBooked ? (
                        <span className="text-[9px] text-rose-600">Booked</span>
                      ) : isPast ? (
                        <span className="text-[9px] text-gray-500">Past</span>
                      ) : selected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
            {slotError && <p className="text-[11px] text-rose-600 font-semibold">{slotError}</p>}
            {detail.slots.length === 0 && (
              <p className="text-[11px] text-muted-foreground font-medium">No slots configured for this shift.</p>
            )}
          </div>

          <Button
            onClick={() => void handleBook()}
            disabled={submitting || !canBook}
            className="w-full rounded-2xl h-11 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm"
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </Button>

          {!canBook && (
            <p className="text-[11px] text-center text-muted-foreground font-medium">
              {detail.slots.some((s) => !s.isBooked && s.isPast)
                ? 'Remaining slots are in the past and can no longer be booked.'
                : 'No available slots left for this doctor shift.'}
            </p>
          )}
        </CardContent>
      </Card>

      {detail.myBookings.length > 0 && (
        <Card className="rounded-3xl border border-border/60">
          <CardContent className="p-4 space-y-2">
            <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wide">
              Your Bookings on this shift
            </h4>
            {detail.myBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-teal-100 dark:border-teal-900/40 px-3 py-2 text-[11px]"
              >
                <span className="font-bold">{b.slotTimeRange}</span>
                <Badge className="bg-teal-100 text-teal-800 border-none text-[9px] font-extrabold">{b.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
