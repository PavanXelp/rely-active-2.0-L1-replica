import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, IndianRupee } from 'lucide-react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { amenityService } from '@/lib/services/amenityService'
import type { ResidentAmenity, ResidentAmenitySlot, ResidentAmenitySlotsResponse } from '@/lib/types/amenity'
import { todayYmd } from '@/pages/Medical/components/bookingFormat'
import { addDaysYmd, bookingRule, daysBetweenYmd, formatRupees, priceText, unitNoun } from './components/amenityFormat'

const errorMessage = (err: unknown, fallback: string) =>
  (isAxiosError(err) && (err.response?.data as { message?: string } | undefined)?.message) || fallback

/** Mon = 0 … Sun = 6, as the amenity's open days are stored. */
const dayMon0 = (ymd: string) => (new Date(`${ymd}T00:00:00`).getDay() + 6) % 7

const DAYS_AHEAD = 21

export default function BookAmenityPage() {
  const { amenityId = '' } = useParams()
  const navigate = useNavigate()
  const [amenity, setAmenity] = useState<ResidentAmenity | null>(null)
  const [date, setDate] = useState(todayYmd())
  const [slots, setSlots] = useState<ResidentAmenitySlotsResponse | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selected, setSelected] = useState<ResidentAmenitySlot | null>(null)
  /** Full day: last day; overnight stay: check-out date. */
  const [rangeEnd, setRangeEnd] = useState('')
  const [booking, setBooking] = useState(false)

  const unit = amenity?.bookingUnit ?? 'SLOT'

  useEffect(() => {
    amenityService
      .list()
      .then((list) => setAmenity(list.find((a) => a.amenityId === amenityId) ?? null))
      .catch((err) => toast.error(errorMessage(err, 'Failed to load amenity')))
  }, [amenityId])

  useEffect(() => {
    if (!amenityId) return
    let ignore = false
    const load = async () => {
      setSlotsLoading(true)
      setSelected(null)
      setRangeEnd(unit === 'NIGHT' ? addDaysYmd(date, 1) : unit === 'FULL_DAY' ? date : '')
      try {
        const data = await amenityService.slots(amenityId, date)
        if (ignore) return
        setSlots(data)
        // Day and stay amenities have one "slot" a day: select it so only the end date is left to pick.
        if (unit !== 'SLOT') setSelected(data.slots[0] ?? null)
      } catch (err) {
        if (!ignore) toast.error(errorMessage(err, 'Failed to load availability'))
      } finally {
        if (!ignore) setSlotsLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [amenityId, date, unit])

  const days = useMemo(() => {
    const open = amenity?.config?.daysOfWeek
    return Array.from({ length: DAYS_AHEAD }, (_, i) => addDaysYmd(todayYmd(), i)).filter(
      (d) => !open || open.includes(dayMon0(d)),
    )
  }, [amenity])

  const units = unit === 'SLOT' || !rangeEnd ? 1 : daysBetweenYmd(date, rangeEnd) + (unit === 'FULL_DAY' ? 1 : 0)
  const price = amenity?.isPayable && amenity.price ? amenity.price : null
  const canBook = !!selected && !selected.isPast && !selected.isBlocked && selected.remainingCount > 0 && units > 0

  const book = async () => {
    if (!selected) return
    try {
      setBooking(true)
      const { message } = await amenityService.book(amenityId, {
        date,
        ...(unit === 'SLOT'
          ? { startMinutes: selected.startMinutes }
          : unit === 'NIGHT'
            ? { checkOutDate: rangeEnd }
            : { endDate: rangeEnd }),
      })
      toast.success(message || 'Booked')
      navigate('/amenities')
    } catch (err) {
      toast.error(errorMessage(err, 'Booking failed'))
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="space-y-4 pb-28 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/amenities')}
            className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black tracking-tight">{amenity?.name ?? 'Amenity'}</h2>
            <p className="text-[11px] text-blue-100 font-medium">{amenity ? bookingRule(amenity) : ''}</p>
          </div>
          {amenity?.isPayable ? (
            <span className="shrink-0 rounded-xl bg-white/15 px-2 py-1 text-[11px] font-black">
              {priceText(amenity)}
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-1.5 px-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
          {unit === 'NIGHT' ? 'Check-in date' : unit === 'FULL_DAY' ? 'First day' : 'Date'}
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {days.map((d) => {
            const active = d === date
            const label = new Date(`${d}T00:00:00`)
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                className={`flex w-12 shrink-0 flex-col items-center rounded-2xl border py-1.5 text-[10px] font-bold cursor-pointer ${
                  active
                    ? 'border-[#005390] bg-[#005390] text-white'
                    : 'bg-white dark:bg-slate-900 text-muted-foreground'
                }`}
              >
                {label.toLocaleDateString('en-IN', { weekday: 'short' })}
                <span className="text-sm font-black">{label.getDate()}</span>
              </button>
            )
          })}
        </div>
      </div>

      {slotsLoading ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Checking availability…</p>
      ) : !slots?.hasSetup || slots.dayClosed || slots.slots.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
          Not available on this day
        </p>
      ) : unit === 'SLOT' ? (
        <div className="grid grid-cols-3 gap-2">
          {slots.slots.map((slot) => {
            const open = !slot.isPast && !slot.isBlocked && slot.remainingCount > 0 && !slot.myBooked
            const active = selected?.startMinutes === slot.startMinutes
            return (
              <button
                key={slot.startMinutes}
                type="button"
                disabled={!open}
                onClick={() => setSelected(slot)}
                className={`rounded-2xl border p-2 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${
                  active ? 'border-[#005390] ring-2 ring-[#005390]/40' : 'bg-white dark:bg-slate-900'
                }`}
              >
                <p className="text-xs font-black">{slot.startLabel}</p>
                <p className="text-[10px] text-muted-foreground">
                  {slot.myBooked ? 'Your booking' : open ? `till ${slot.endLabel}` : slot.isPast ? 'Past' : 'Full'}
                </p>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border bg-white dark:bg-slate-900 p-3">
          {selected && (selected.isBlocked || selected.remainingCount <= 0 || selected.isPast) ? (
            <p className="text-xs font-bold text-rose-600">
              {selected.isPast ? 'Check-in time has passed for this day' : 'Fully booked on this day'}
            </p>
          ) : null}
          <Label htmlFor="amenity-range-end" className="text-xs font-bold">
            {unit === 'NIGHT' ? 'Check-out date' : 'Last day'}
          </Label>
          <Input
            id="amenity-range-end"
            type="date"
            value={rangeEnd}
            min={unit === 'NIGHT' ? addDaysYmd(date, 1) : date}
            max={addDaysYmd(date, unit === 'NIGHT' ? 31 : 30)}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="h-10 rounded-xl"
          />
          <p className="text-[11px] text-muted-foreground">
            {units > 0
              ? `${units} ${unitNoun(unit, units)}${
                  unit === 'NIGHT' && amenity?.checkInLabel
                    ? ` · check-in ${amenity.checkInLabel}, check-out ${amenity.checkOutLabel ?? ''}`
                    : ''
                }`
              : unit === 'NIGHT'
                ? 'Check-out must be after the check-in date'
                : 'The last day cannot be before the first day'}
          </p>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur">
        {price && canBook ? (
          <p className="mb-2 flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <IndianRupee className="w-3 h-3" />
            {units > 1
              ? `${units} × ${formatRupees(price)} = ${formatRupees(price * units)}`
              : formatRupees(price)}{' '}
            will be added to your flat bill · free to cancel until it starts
          </p>
        ) : null}
        <Button
          disabled={!canBook || booking}
          onClick={() => void book()}
          className="w-full rounded-2xl bg-[#005390] font-black text-white"
        >
          {booking ? 'Booking…' : 'Confirm booking'}
        </Button>
      </div>
    </div>
  )
}
