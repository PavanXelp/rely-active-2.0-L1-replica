import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ResidentUser {
  id: string
  firstName?: string
  lastName?: string
  primaryPhone?: string
  locationId?: string
  locId?: string
  unitNumber?: string
  unitId?: string
  propertyName?: string
  locationName?: string
}

type AuthState = {
  token: string | null
  resident: ResidentUser | null
  signIn: (token: string, resident?: ResidentUser | null) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      resident: null,
      signIn: (token, resident = null) => set({ token, resident }),
      signOut: () => set({ token: null, resident: null }),
    }),
    {
      name: 'rely-active-mobile-auth',
      version: 1,
    },
  ),
)
