import type { ResidentMedication } from './medication'
import type { ResidentInsulin } from './insulin'

export type DiagnosisStatus = 'DRAFT' | 'COMPLETED'

/** Resident-facing status: consultant fields are only returned when COMPLETED. */
export type ResidentDiagnosisStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'

export type DiagnosisCondition = 'CRITICAL' | 'STABLE' | 'RECOVERING' | 'GOOD'

export type DiagnosisFileType = 'IMAGE' | 'PDF' | 'AUDIO'

export interface DiagnosisFile {
  id: string
  url: string
  key: string
  name: string
  contentType: string
  size: number
  fileType: DiagnosisFileType
  uploadedAt: string
  uploadedByUserId: string
}

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
  diagnosisStatus: ResidentDiagnosisStatus
  id?: string | null
  appointmentId: string | null
  residentId?: string
  locationId?: string
  doctorId?: string
  allergies: ConsultantAllergy[]
  vitals: ConsultantVital[]
  medications: ResidentMedication[]
  insulin: ResidentInsulin[]
  note?: string | null
  attachments: DiagnosisFile[]
  voiceNotes: DiagnosisFile[]
  condition?: DiagnosisCondition | null
  status?: DiagnosisStatus
  completedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  doctorName?: string
  appointmentDate?: string | null
  slotTimeRange?: string | null
  memberName?: string
  memberRelation?: string
  appointmentStatus?: string | null
  attendedAt?: string | null
}
