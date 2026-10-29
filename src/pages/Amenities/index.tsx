import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, ChevronRight, IndianRupee, Sparkles } from 'lucide-react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { amenityService } from '@/lib/services/amenityService'
import type { ResidentAmenity, ResidentAmenityBooking } from '@/lib/types/amenity'
import { todayYmd } from '@/pages/Medical/components/bookingFormat'
import { bookingRule, bookingWhen, formatRupees, priceText } from './components/amenityFormat'

const errorMessage = (err: unknown, fallback: string) =>
  (isAxiosError(err) && (err.response?.data as { message?: string } | undefined)?.message) || fallback

export default function AmenitiesPage() {
  const navigate = useNavigate()
  const [amenities, setAmenities] = useState<ResidentAmenity[]>([])
  const [bookings, setBookings] = useState<ResidentAmenityBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  /** Bumped to reload after a cancellation. */
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const [list, mine] = await Promise.all([amenityService.list(), amenityService.myBookings(todayYmd())])
        if (ignore) return
        setAmenities(list)
        setBookings(mine)
      } catch (err) {
        if (!ignore) toast.error(errorMessage(err, 'Failed to load amenities'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [reloadKey])

  const cancel = async (booking: ResidentAmenityBooking) => {
    if (!booking.amenityId) return
    try {
      setCancellingId(booking.id)
      await amenityService.cancel(booking.amenityId, booking.id)
      toast.success('Booking cancelled')
      setReloadKey((key) => key + 1)
    } catch (err) {
      // A paid booking can't be cancelled once it has started.
      toast.error(errorMessage(err, 'Failed to cancel booking'))
    } finally {
      setCancellingId(null)
    }
  }

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
            <h2 className="text-base font-black tracking-tight">Amenities</h2>
            <p className="text-[11px] text-blue-100 font-medium">Book a slot, a day or a stay</p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-200 shrink-0" />
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Loading amenities…</p>
      ) : (
        <>
          <section className="space-y-2">
            <h3 className="px-1 text-xs font-black uppercase tracking-wider text-muted-foreground">My bookings</h3>
            {bookings.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                No upcoming bookings
              </p>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="rounded-2xl">
                  <CardContent className="p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold">{booking.amenityName}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{bookingWhen(booking)}</p>
                      {booking.chargeAmount ? (
                        <p className="mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          {booking.unitCount > 1 && booking.unitPrice
                            ? `${booking.unitCount} × ${formatRupees(booking.unitPrice)} = `
                            : ''}
                          {formatRupees(booking.chargeAmount)} · added to your flat bill
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cancellingId === booking.id}
                      onClick={() => void cancel(booking)}
                      className="shrink-0 rounded-xl border-rose-200 text-rose-600 text-[11px] font-bold"
                    >
                      {cancellingId === booking.id ? 'Cancelling…' : 'Cancel'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </section>

          <section className="space-y-2">
            <h3 className="px-1 text-xs font-black uppercase tracking-wider text-muted-foreground">All amenities</h3>
            {amenities.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                No amenities at your property yet
              </p>
            ) : (
              amenities.map((amenity) => {
                const bookable = amenity.slotBookable && amenity.hasSetup
                return (
                  <Card
                    key={amenity.amenityId}
                    onClick={bookable ? () => navigate(`/amenities/${amenity.amenityId}`) : undefined}
                    className={`rounded-2xl ${bookable ? 'cursor-pointer hover:border-[#005390]/40' : ''}`}
                  >
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold">{amenity.name}</p>
                          {amenity.isPayable ? (
                            <Badge className="border-none bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-extrabold">
                              <IndianRupee className="w-2.5 h-2.5" />
                              {priceText(amenity).replace('₹', '')}
                            </Badge>
                          ) : bookable ? (
                            <Badge variant="secondary" className="text-[9px] font-extrabold">
                              Free
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{bookingRule(amenity)}</p>
                      </div>
                      {bookable ? (
                        <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#005390]">
                          <CalendarCheck className="w-3.5 h-3.5" /> Book
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </section>
        </>
      )}
    </div>
  )
}
