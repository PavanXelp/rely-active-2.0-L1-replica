import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type {
  L1CreateEventRequestPayload,
  L1Event,
  L1EventDetail,
  L1EventRequest,
  L1EventRequestResult,
  L1ReserveSeatsPayload,
  L1ReserveSeatsResult,
  L1VenueAvailabilityResult,
  L1VenueDetail,
} from '../types/event'

export const eventMobileService = {
  getEvents: async (filter: 'upcoming' | 'today'): Promise<L1Event[]> => {
    const res = await api.get(ENDPOINTS.events.list(filter))
    return Array.isArray(res.data?.data) ? res.data.data : []
  },

  getEventById: async (id: string): Promise<L1EventDetail | null> => {
    const res = await api.get(ENDPOINTS.events.detail(id))
    return res.data?.data || null
  },

  reserveSeats: async (id: string, payload: L1ReserveSeatsPayload): Promise<L1ReserveSeatsResult> => {
    const res = await api.post(ENDPOINTS.events.reserve(id), payload)
    return res.data
  },

  getVenues: async (minOccupancy?: number): Promise<L1VenueDetail[]> => {
    const res = await api.get(ENDPOINTS.venues.list(minOccupancy))
    return Array.isArray(res.data?.data) ? res.data.data : []
  },

  getVenueById: async (id: string): Promise<L1VenueDetail | null> => {
    const res = await api.get(ENDPOINTS.venues.detail(id))
    return res.data?.data || null
  },

  checkVenueAvailability: async (
    venueId: string,
    startDate: string,
    endDate: string,
  ): Promise<L1VenueAvailabilityResult> => {
    const res = await api.get(ENDPOINTS.venues.availability(venueId, startDate, endDate))
    return res.data?.data || { available: true, message: null, conflict: null }
  },

  getMyEventRequests: async (): Promise<L1EventRequest[]> => {
    const res = await api.get(ENDPOINTS.eventRequests.list)
    return Array.isArray(res.data?.data) ? res.data.data : []
  },

  getMyEventRequestById: async (id: string): Promise<L1EventRequest | null> => {
    const res = await api.get(ENDPOINTS.eventRequests.detail(id))
    return res.data?.data || null
  },

  createEventRequest: async (payload: L1CreateEventRequestPayload): Promise<L1EventRequestResult> => {
    const res = await api.post(ENDPOINTS.eventRequests.create, payload)
    return res.data
  },
}
