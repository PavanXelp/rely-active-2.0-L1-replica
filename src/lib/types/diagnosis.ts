import type { ResidentMedication } from './medication'
import type { ResidentInsulin } from './insulin'

export type DiagnosisStatus = 'DRAFT' | 'COMPLETED'

export interface ConsultantAllergy {
  id: string
  name: string
  note: string | null
  recordedAt: string
}

export interface ConsultantVital {
  id: string
  vitalSettingId: string
  name: string
  unit: string
  value: string
  note: string | null
  recordedAt: string
}

export interface AppointmentDiagnosis {
  id: string | null
  appointmentId: string
  residentId: string
  locationId: string
  doctorId: string
  allergies: ConsultantAllergy[]
  vitals: ConsultantVital[]
  medications: ResidentMedication[]
  insulin: ResidentInsulin[]
  note: string | null
  status: DiagnosisStatus
  completedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  /** Appointment meta returned by L1 History GET */
  doctorName?: string
  appointmentDate?: string
  slotTimeRange?: string
  memberName?: string
  memberRelation?: string
  appointmentStatus?: string
  attendedAt?: string | null
}
