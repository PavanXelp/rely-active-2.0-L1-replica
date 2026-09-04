import { api } from '../api'

export interface GuestMaster {
  id: string
  name: string
  phone: string | null
  notes: string | null
}

export interface CreatePreapprovedPayload {
  visitorName: string
  visitorPhone?: string
  visitorType: 'Guest' | 'Delivery' | 'Cab' | 'Service' | 'Material' | 'Office'
  startDate?: string
  startTime?: string
  unitId?: string
  locId: string
  flatNumber?: string
  visitorPhotos?: string[]
  vehicleNumber?: string
  notes?: string
  company?: string
  personToMeet?: string
  scheduleType?: 'ONCE' | 'FREQUENT'
  endDate?: string
  endTime?: string
  additionalVisitors?: { name: string; phone: string; visitorPhotos?: string[] }[]
}

export const gateApi = {
  createPreapproved: async (payload: CreatePreapprovedPayload) => {
    const response = await api.post('/mobile/l1/gns/preapproved', payload)
    return response.data
  },
  getPreapproved: async (params?: {
    page?: number
    limit?: number
    status?: string
    visitorType?: string
    date?: string
  }) => {
    const response = await api.get('/mobile/l1/gns/preapproved', { params })
    return response.data
  },
  updatePreapproved: async (id: string, payload: Partial<CreatePreapprovedPayload>) => {
    const response = await api.put(`/mobile/l1/gns/preapproved/${id}`, payload)
    return response.data
  },
  deletePreapproved: async (id: string) => {
    const response = await api.delete(`/mobile/l1/gns/preapproved/${id}`)
    return response.data
  },
  getWalkins: async (date?: string) => {
    const response = await api.get('/mobile/l1/gns/preapproved/walkins', { params: { date } })
    return response.data
  },
  updateWalkinStatus: async (id: string, status: 'Approved' | 'Rejected') => {
    const response = await api.put(`/mobile/l1/gns/preapproved/walkins/${id}/status`, { status })
    return response.data
  },
  getGuestMasterList: async () => {
    const response = await api.get('/mobile/l1/gns/guest-master')
    return response.data
  },
  createGuestMaster: async (payload: { name: string; phone?: string; notes?: string }) => {
    const response = await api.post('/mobile/l1/gns/guest-master', payload)
    return response.data
  },
  updateGuestMaster: async (id: string, payload: { name: string; phone?: string; notes?: string }) => {
    const response = await api.put(`/mobile/l1/gns/guest-master/${id}`, payload)
    return response.data
  },
  deleteGuestMaster: async (id: string) => {
    const response = await api.delete(`/mobile/l1/gns/guest-master/${id}`)
    return response.data
  },
}
