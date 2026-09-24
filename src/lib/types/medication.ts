export type MedicationTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type MedicationRoute = 'oral' | 'iv' | 'im' | 'sc' | 'topical' | 'inhalation' | 'rectal' | 'other'
export type MedicationMealTiming = 'before_food' | 'after_food' | 'with_food' | 'none'

export interface MedicationTiming {
  timeOfDay: MedicationTimeOfDay
  selected: boolean
  time: string
  dose: number
  route: MedicationRoute
  mealTiming: MedicationMealTiming
}

/** Medication entry stored on consultants.medications JSON */
export interface ResidentMedication {
  id: string
  inventoryItemId: string
  medicineName: string
  startDate: string
  endDate: string | null
  isUntilDischarge: boolean
  timings: MedicationTiming[]
  note: string | null
  residentId?: string
  locationId?: string
  appointmentId?: string | null
  createdAt?: string
  updatedAt?: string
}
