import type { AmenityBookingUnit, ResidentAmenity, ResidentAmenityBooking } from '@/lib/types/amenity'

export const formatRupees = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export const addDaysYmd = (ymd: string, days: number): string => {
  const [y = 0, m = 1, d = 1] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export const daysBetweenYmd = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)

export const shortDate = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

export const unitNoun = (unit: AmenityBookingUnit | null, count = 1) => {
  const noun = unit === 'NIGHT' ? 'night' : unit === 'FULL_DAY' ? 'day' : 'slot'
  return count === 1 ? noun : `${noun}s`
}

/** "₹800 / night", or "Free". */
export const priceText = (amenity: Pick<ResidentAmenity, 'isPayable' | 'price' | 'bookingUnit'>) =>
  amenity.isPayable && amenity.price ? `${formatRupees(amenity.price)} / ${unitNoun(amenity.bookingUnit)}` : 'Free'

/** How the amenity is booked, in a line. */
export const bookingRule = (amenity: ResidentAmenity): string => {
  if (!amenity.slotBookable) return 'Open use, no booking needed'
  if (!amenity.hasSetup) return 'Booking not open yet'
  if (amenity.bookingUnit === 'NIGHT') {
    return `Overnight stay · check-in ${amenity.checkInLabel ?? ''}, check-out ${amenity.checkOutLabel ?? ''} next day`
  }
  if (amenity.bookingUnit === 'FULL_DAY') return 'Booked by the day · several days at once'
  return amenity.summary
    ? `${amenity.summary.durationLabel} slots · ${amenity.summary.openLabel} to ${amenity.summary.closeLabel}`
    : 'Timed slots'
}

/** "Thu 30 Oct, 10:00 AM – 11:00 AM", "Thu 30 Oct → Sun 2 Nov · 3 nights". */
export const bookingWhen = (booking: ResidentAmenityBooking): string => {
  const count = booking.unitCount ?? 1
  if (booking.checkOutDate) {
    return `${shortDate(booking.date)} → ${shortDate(booking.checkOutDate)} · ${count} ${unitNoun('NIGHT', count)}`
  }
  if (booking.endDate) return `${shortDate(booking.date)} – ${shortDate(booking.endDate)} · ${count} days`
  if (booking.bookingUnit === 'FULL_DAY') return `${shortDate(booking.date)} · whole day`
  return `${shortDate(booking.date)}, ${booking.startLabel}${booking.endLabel ? ` – ${booking.endLabel}` : ''}`
}
