export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW'

export type DoctorCategory = 'VISITING' | 'INHOUSE'

export interface L1AppointmentDoctor {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email?: string
  specialization?: string | null
  specializations?: Array<{
    id: string
    name: string
    code: string
    description?: string | null
    isPrimary: boolean
  }>
}

export interface L1AppointmentListItem {
  shiftEmployeeDateId: string
  date: string
  status: string
  doctor: L1AppointmentDoctor | null
  shift: { id: string; name: string; startTime: string; endTime: string } | null
  effectiveTime: string | null
  totalSlots: number
  availableSlots: number
  bookedSlots: number
  isFullyBooked: boolean
}

export interface L1InhouseAppointmentListItem {
  shiftEmployeeDateId: string
  date: string
  status: string
  doctor: L1AppointmentDoctor | null
  shift: { id: string; name: string; startTime: string; endTime: string } | null
  effectiveTime: string | null
  scopeLabel?: string | null
}

export interface L1AppointmentSlot {
  slotTimeRange: string
  isBooked: boolean
  isPast?: boolean
  isAvailable?: boolean
}

export interface L1AppointmentDetail {
  shiftEmployeeDateId: string
  date: string
  status: string
  doctor: L1AppointmentDoctor | null
  shift: {
    id: string
    name: string
    startTime: string
    endTime: string
    numberOfSlots?: number | null
    slotDuration?: number | null
  } | null
  effectiveTime: string | null
  capacity: {
    totalSlots: number
    availableSlots: number
    bookedSlots: number
    isFullyBooked: boolean
  }
  slots: L1AppointmentSlot[]
  myBookings: Array<{
    id: string
    slotTimeRange: string
    familyMemberId: string | null
    status: AppointmentStatus
  }>
}

export interface L1MyBooking {
  id: string
  shiftEmployeeDateId: string
  appointmentDate: string
  slotTimeRange: string
  status: AppointmentStatus
  bookedAt: string
  notes?: string | null
  familyMemberId?: string | null
  memberName: string
  memberRelation: string
  doctorName: string
  shiftName: string
  doctorCategory?: DoctorCategory | null
}

export interface L1BookAppointmentPayload {
  slotTimeRange: string
  notes?: string
}
