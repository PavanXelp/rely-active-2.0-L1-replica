import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

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
  // Keeps auth state writable in tests/SSR when localStorage is unavailable.
  (() => {
    const memoryStorage: StateStorage = {
      getItem: () => null,
      setItem: () => void 0,
      removeItem: () => void 0,
    }

    const storage = createJSONStorage<AuthState>(() => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage
      }
      return memoryStorage
    })

    return persist(
      (set) => ({
        token: null,
        resident: null,
        signIn: (token, resident = null) => set({ token, resident }),
        signOut: () => set({ token: null, resident: null }),
      }),
      {
        name: 'rely-active-mobile-auth',
        version: 1,
        storage,
      },
    )
  })(),
)
