export type L1EventVenue = {
  id: string
  name: string
  occupancy?: number
  coverPhoto?: string | null
}

export type L1VenueImage = {
  url: string
  caption?: string
}

export type L1AddOnService = {
  globalServiceId?: string
  name: string
  imageUrl?: string
  keyFeatures?: string
  price?: number
  quantity?: number
}

export type L1VenueDetail = {
  id: string
  name: string
  occupancy: number
  price?: number
  keyFeatures?: string | null
  otherServices?: string | null
  coverPhoto?: string | null
  images?: L1VenueImage[] | null
  addOnServices?: L1AddOnService[] | null
}

export type L1Event = {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  poster?: string | null
  eventType?: string
  allowReservation: boolean
  venue?: L1EventVenue | null
}

export type L1EventCapacity = {
  totalCapacity: number
  activeSeats: number
  availableSpots: number | null
  isFullyBooked: boolean
}

export type L1EventRegistration = {
  id: string
  status: string
  seatCount: number
  registeredAt: string
  registrationDate: string
}

export type L1EventDetail = L1Event & {
  reservationPerFlat?: number | null
  occupancy?: number
  maxCapacity?: number | null
  entryFee?: number | null
  capacity: L1EventCapacity
  myRegistration: L1EventRegistration | null
}

export type L1ReserveSeatsPayload = {
  seatCount: number
}

export type L1ReserveSeatsResult = {
  success: boolean
  message?: string
  data?: L1EventRegistration & { eventId?: string }
}

export type L1VenueAvailabilityResult = {
  available: boolean
  message?: string | null
  conflict?: {
    source: 'event' | 'request'
    id: string
    title: string
    startDate: string
    endDate: string
  } | null
}

export type L1EventRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'REJECTED' | 'CANCELLED'

export type L1EventRequestVenue = {
  id: string
  name: string
  occupancy?: number
  price?: number
  coverPhoto?: string | null
}

export type L1EventRequest = {
  id: string
  requestNumber?: string | null
  title: string
  startDate: string
  endDate: string
  occupancy: number
  customRequest?: string | null
  schedule?: Array<{ startDate: string; endDate: string }> | null
  selectedServices?: L1AddOnService[] | null
  status: L1EventRequestStatus | string
  meetingScheduledAt?: string | null
  confirmedEventId?: string | null
  cancellationReason?: string | null
  totalCost?: number | null
  venueId: string
  createdAt: string
  updatedAt?: string
  venue?: L1EventRequestVenue | null
}

export type L1CreateEventRequestPayload = {
  title: string
  startDate: string
  endDate: string
  occupancy: number
  venueId: string
  customRequest?: string
  schedule?: Array<{ startDate: string; endDate: string }>
  selectedServices?: L1AddOnService[]
}

export type L1EventRequestResult = {
  success: boolean
  message?: string
  data?: L1EventRequest
}

export type DayScheduleTimes = {
  startTime: string
  endTime: string
}

export type VenueBookingDraft = {
  title: string
  startDate: string
  endDate: string
  /** Kept for single-day / overall bounds; prefer scheduleTimes for multi-day */
  startTime: string
  endTime: string
  /** Per-day HH:mm slots keyed by YYYY-MM-DD */
  scheduleTimes?: Record<string, DayScheduleTimes>
  occupancy: number
  venueId?: string
  venueName?: string
  venueCoverPhoto?: string | null
  venuePrice?: number
  /** Full venue add-on catalog (for reference / max qty) */
  venueAddOnServices?: L1AddOnService[]
  /** Services the resident selected with quantities */
  selectedServices?: L1AddOnService[]
  customRequest?: string
}
