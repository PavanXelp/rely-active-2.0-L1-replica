/** How an amenity is booked: timed slots, whole days, or overnight stays (check-in → check-out next day). */
export type AmenityBookingUnit = 'SLOT' | 'FULL_DAY' | 'NIGHT'

export interface ResidentAmenity {
  amenityId: string
  name: string
  description: string | null
  slotBookable: boolean
  hasSetup: boolean
  /** Payable amenities add `price` per slot / day / night to the flat's monthly bill. */
  isPayable: boolean
  price: number | null
  bookingUnit: AmenityBookingUnit | null
  /** "slot" / "day" / "night". */
  priceUnit: string | null
  checkInLabel: string | null
  checkOutLabel: string | null
  availableFrom: string | null
  availableTo: string | null
  config: { capacity: number; daysOfWeek: number[] } | null
  summary: { openLabel: string; closeLabel: string; durationLabel: string } | null
}

export interface ResidentAmenitySlot {
  startMinutes: number
  startLabel: string
  endLabel: string
  status: 'AVAILABLE' | 'PARTIALLY_BOOKED' | 'BOOKED' | 'BLOCKED' | 'PAST' | 'LEGACY_BOOKED'
  remainingCount: number
  isPast: boolean
  isBlocked: boolean
  myBooked: boolean
}

export interface ResidentAmenitySlotsResponse {
  date: string
  hasSetup: boolean
  dayClosed: boolean
  slots: ResidentAmenitySlot[]
}

export interface ResidentAmenityBooking {
  id: string
  amenityId: string | null
  amenityName: string
  date: string
  startLabel: string
  endLabel: string | null
  bookingUnit: AmenityBookingUnit
  endDate: string | null
  checkOutDate: string | null
  unitCount: number
  unitPrice: number | null
  chargeAmount: number | null
  status: 'BOOKED' | 'CANCELLED'
}

export interface CreateAmenityBookingPayload {
  date: string
  /** Timed slots only. */
  startMinutes?: number
  /** Full day: last day booked. */
  endDate?: string
  /** Overnight stay: the check-out date. */
  checkOutDate?: string
  notes?: string
}
