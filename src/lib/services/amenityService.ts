import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type {
  CreateAmenityBookingPayload,
  ResidentAmenity,
  ResidentAmenityBooking,
  ResidentAmenitySlotsResponse,
} from '../types/amenity'

/** Amenities of the resident's property, and their bookings (payable ones are billed to the flat). */
export const amenityService = {
  list: async (): Promise<ResidentAmenity[]> => {
    const res = await api.get(ENDPOINTS.amenities.list)
    return res.data.data.amenities
  },

  slots: async (amenityId: string, date: string): Promise<ResidentAmenitySlotsResponse> => {
    const res = await api.get(ENDPOINTS.amenities.slots(amenityId, date))
    return res.data.data
  },

  book: async (
    amenityId: string,
    payload: CreateAmenityBookingPayload,
  ): Promise<{ message: string; booking: ResidentAmenityBooking }> => {
    const res = await api.post(ENDPOINTS.amenities.book(amenityId), payload)
    return { message: res.data.message, booking: res.data.data.booking }
  },

  cancel: async (amenityId: string, bookingId: string): Promise<void> => {
    await api.delete(ENDPOINTS.amenities.cancel(amenityId, bookingId))
  },

  myBookings: async (from: string): Promise<ResidentAmenityBooking[]> => {
    const res = await api.get(ENDPOINTS.amenities.myBookings(from))
    return res.data.data.bookings
  },
}
