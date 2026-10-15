import type { ConsultantAllergy, ConsultantVital, DiagnosisCondition, DiagnosisFile } from './diagnosis'
import type { ResidentInsulin } from './insulin'
import type { ResidentMedication } from './medication'

export interface MedicalHistoryCondition {
  condition: DiagnosisCondition
  note: string | null
  updatedAt: string
  updatedByName: string | null
}

export interface MedicalHistoryDoctorNote {
  id: string
  note: string | null
  attachments: DiagnosisFile[]
  voiceNotes: DiagnosisFile[]
  condition: DiagnosisCondition | null
  completedAt: string | null
  doctorId: string
  doctorName: string | null
  appointmentId: string
  appointmentDate: string | null
}

export interface MedicalHistoryLatest {
  currentCondition: MedicalHistoryCondition | null
  allergies: ConsultantAllergy[]
  doctorNotes: MedicalHistoryDoctorNote[]
  vitals: ConsultantVital[]
  medications: ResidentMedication[]
  insulin: ResidentInsulin[]
  diagnosisDates: string[]
}

export interface MedicalHistoryDayDiagnosis {
  id: string
  appointmentId: string
  doctorName: string
  appointmentDate: string
  slotTimeRange: string | null
  attendedAt: string | null
  completedAt: string | null
  condition: DiagnosisCondition | null
  allergies: ConsultantAllergy[]
  vitals: ConsultantVital[]
  medications: ResidentMedication[]
  insulin: ResidentInsulin[]
  note: string | null
  attachments: DiagnosisFile[]
  voiceNotes: DiagnosisFile[]
}

export interface MedicalHistoryByDate {
  date: string
  diagnoses: MedicalHistoryDayDiagnosis[]
}
