import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type { AppointmentDiagnosis } from '../types/diagnosis'

function normalizeDiagnosis(data: AppointmentDiagnosis | null): AppointmentDiagnosis | null {
  if (!data) return null
  return {
    ...data,
    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    vitals: Array.isArray(data.vitals) ? data.vitals : [],
    medications: Array.isArray(data.medications) ? data.medications : [],
    insulin: Array.isArray(data.insulin) ? data.insulin : [],
  }
}

export const diagnosisService = {
  getBookingDiagnosis: async (appointmentId: string): Promise<AppointmentDiagnosis | null> => {
    const res = await api.get(ENDPOINTS.medical.appointments.bookingDiagnosis(appointmentId))
    return normalizeDiagnosis(res.data?.data || null)
  },
}
