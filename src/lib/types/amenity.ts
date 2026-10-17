export type L1AmenitySlotStatus = 'AVAILABLE' | 'PARTIALLY_BOOKED' | 'BOOKED' | 'BLOCKED' | 'PAST' | 'LEGACY_BOOKED'

export interface L1AmenityConfig {
  id: string
  openMinutes: number
  closeMinutes: number
  durationMin: number
  capacity: number
  daysOfWeek: number[]
}

export interface L1AmenitySummary {
  amenityId: string
  name: string
  description: string | null
  slotBookable: boolean
  availableFrom: string | null
  availableTo: string | null
  slotDurationMinutes: number | null
  hasSetup: boolean
  config: L1AmenityConfig | null
  summary: {
    slotsPerDay: number
    openLabel: string
    closeLabel: string
    durationLabel: string
    capacityLabel: string
  } | null
}

export interface L1AmenitySlotItem {
  startMinutes: number
  startLabel: string
  endMinutes: number
  endLabel: string
  period: 'MORNING' | 'AFTERNOON' | 'EVENING'
  status: L1AmenitySlotStatus
  capacity: number
  bookedCount: number
  remainingCount: number
  isPast: boolean
  isBlocked: boolean
  myBookingId: string | null
  myBooked: boolean
  isLegacy?: boolean
}

export interface L1AmenitySlotsResponse {
  date: string
  amenityId: string
  amenityName: string
  hasSetup: boolean
  dayClosed: boolean
  config: L1AmenityConfig | null
  slots: L1AmenitySlotItem[]
}

export interface L1AmenityBooking {
  id: string
  amenityId: string | null
  amenityName: string
  date: string
  startMinutes: number
  startLabel: string
  endMinutes: number
  endLabel: string
  status: 'BOOKED' | 'CANCELLED'
  notes?: string | null
  createdAt?: string
}

export interface L1AmenityBookingResult {
  id: string
  amenityId: string
  amenityName: string
  date: string
  startMinutes: number
  startLabel: string
  status: 'BOOKED' | 'CANCELLED'
  residentId: string
  notes?: string | null
}
