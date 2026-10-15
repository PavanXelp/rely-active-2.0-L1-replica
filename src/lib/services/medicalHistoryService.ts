import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type {
  MedicalHistoryByDate,
  MedicalHistoryDayDiagnosis,
  MedicalHistoryDoctorNote,
  MedicalHistoryLatest,
} from '../types/medicalHistory'

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function normalizeDoctorNote(note: MedicalHistoryDoctorNote): MedicalHistoryDoctorNote {
  return {
    ...note,
    attachments: asArray(note.attachments),
    voiceNotes: asArray(note.voiceNotes),
  }
}

function normalizeDayDiagnosis(diagnosis: MedicalHistoryDayDiagnosis): MedicalHistoryDayDiagnosis {
  return {
    ...diagnosis,
    allergies: asArray(diagnosis.allergies),
    vitals: asArray(diagnosis.vitals),
    medications: asArray(diagnosis.medications),
    insulin: asArray(diagnosis.insulin),
    attachments: asArray(diagnosis.attachments),
    voiceNotes: asArray(diagnosis.voiceNotes),
  }
}

export const medicalHistoryService = {
  getLatest: async (): Promise<MedicalHistoryLatest> => {
    const res = await api.get(ENDPOINTS.medical.history.latest)
    const data = (res.data?.data || {}) as Partial<MedicalHistoryLatest>
    return {
      currentCondition: data.currentCondition || null,
      allergies: asArray(data.allergies),
      doctorNotes: asArray<MedicalHistoryDoctorNote>(data.doctorNotes).map(normalizeDoctorNote),
      vitals: asArray(data.vitals),
      medications: asArray(data.medications),
      insulin: asArray(data.insulin),
      diagnosisDates: asArray(data.diagnosisDates),
    }
  },

  getByDate: async (date: string): Promise<MedicalHistoryByDate> => {
    const res = await api.get(ENDPOINTS.medical.history.byDate(date))
    const data = (res.data?.data || {}) as Partial<MedicalHistoryByDate>
    return {
      date: data.date || date,
      diagnoses: asArray<MedicalHistoryDayDiagnosis>(data.diagnoses).map(normalizeDayDiagnosis),
    }
  },
}
