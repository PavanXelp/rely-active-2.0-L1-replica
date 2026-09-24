import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type {
  DoctorCategory,
  L1AppointmentDetail,
  L1AppointmentListItem,
  L1BookAppointmentPayload,
  L1InhouseAppointmentListItem,
  L1MyBooking,
} from '../types/appointment'

export const appointmentMobileService = {
  listAppointments: async (): Promise<L1AppointmentListItem[]> => {
    const res = await api.get(ENDPOINTS.medical.appointments.list)
    return Array.isArray(res.data?.data?.appointments) ? res.data.data.appointments : []
  },

  listInhouseAppointments: async (): Promise<L1InhouseAppointmentListItem[]> => {
    const res = await api.get(ENDPOINTS.medical.appointments.inhouse)
    return Array.isArray(res.data?.data?.appointments) ? res.data.data.appointments : []
  },

  getAppointmentDetail: async (shiftEmployeeDateId: string): Promise<L1AppointmentDetail | null> => {
    const res = await api.get(ENDPOINTS.medical.appointments.detail(shiftEmployeeDateId))
    return res.data?.data || null
  },

  bookAppointment: async (shiftEmployeeDateId: string, payload: L1BookAppointmentPayload) => {
    const res = await api.post(ENDPOINTS.medical.appointments.book(shiftEmployeeDateId), payload)
    return res.data
  },

  getMyBookings: async (category?: DoctorCategory): Promise<L1MyBooking[]> => {
    const res = await api.get(ENDPOINTS.medical.appointments.myBookings, {
      params: category ? { category } : undefined,
    })
    return Array.isArray(res.data?.data?.bookings) ? res.data.data.bookings : []
  },
}
