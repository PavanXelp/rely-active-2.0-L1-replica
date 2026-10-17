import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type {
  L1AmenityBooking,
  L1AmenityBookingResult,
  L1AmenitySlotsResponse,
  L1AmenitySummary,
} from '../types/amenity'

export const amenityMobileService = {
  listAmenities: async (): Promise<L1AmenitySummary[]> => {
    const res = await api.get(ENDPOINTS.amenities.list)
    return Array.isArray(res.data?.data?.amenities) ? res.data.data.amenities : []
  },

  getAmenitySlots: async (amenityId: string, date: string): Promise<L1AmenitySlotsResponse | null> => {
    const res = await api.get(ENDPOINTS.amenities.slots(amenityId, date))
    return res.data?.data || null
  },

  bookAmenitySlot: async (amenityId: string, payload: { date: string; startMinutes: number; notes?: string }) => {
    const res = await api.post(ENDPOINTS.amenities.bookings(amenityId), payload)
    return {
      success: Boolean(res.data?.success),
      message: (res.data?.message as string) || 'Booked successfully',
      booking: (res.data?.data?.booking || null) as L1AmenityBookingResult | null,
    }
  },

  cancelAmenityBooking: async (amenityId: string, bookingId: string) => {
    const res = await api.delete(ENDPOINTS.amenities.booking(amenityId, bookingId))
    return {
      success: Boolean(res.data?.success),
      message: (res.data?.message as string) || 'Booking cancelled successfully',
    }
  },

  getMyAmenityBookings: async (params?: {
    from?: string
    to?: string
    status?: 'BOOKED' | 'CANCELLED' | 'ALL'
    limit?: number
  }): Promise<L1AmenityBooking[]> => {
    const res = await api.get(ENDPOINTS.amenities.myBookings, {
      params: {
        ...(params?.from ? { from: params.from } : {}),
        ...(params?.to ? { to: params.to } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.limit ? { limit: params.limit } : {}),
      },
    })
    return Array.isArray(res.data?.data?.bookings) ? res.data.data.bookings : []
  },
}
