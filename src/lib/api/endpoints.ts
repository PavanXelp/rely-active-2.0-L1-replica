import { env } from '@/lib/env'

export const BASE_URL = env.VITE_API_URL || 'http://localhost:4000/api/v1'

export const ENDPOINTS = {
  auth: {
    login: `${BASE_URL}/mobile/l1/resident/auth/login`,
    profile: `${BASE_URL}/mobile/l1/resident/auth/profile`,
  },
  tickets: {
    list: `${BASE_URL}/mobile/l1/tickets`,
    create: `${BASE_URL}/mobile/l1/tickets`,
    departments: `${BASE_URL}/mobile/l1/tickets/departments`,
    updateTat: (id: string) => `${BASE_URL}/mobile/l1/tickets/${id}/tat`,
    escalate: (id: string) => `${BASE_URL}/mobile/l1/tickets/${id}/escalate`,
  },
  fnb: {
    dailyMenu: (date: string) => `${BASE_URL}/mobile/l1/fnb/menu?date=${encodeURIComponent(date)}`,
    specialMenu: `${BASE_URL}/mobile/l1/fnb/special-menu`,
    placeOrder: `${BASE_URL}/mobile/l1/fnb/order`,
    orderHistory: `${BASE_URL}/mobile/l1/fnb/orders`,
  },
  l3: {
    assignedDeliveries: (locId?: string) =>
      `${BASE_URL}/mobile/l3/fnb/assigned-deliveries${locId ? `?locId=${encodeURIComponent(locId)}` : ''}`,
    updateDeliveryStatus: (id: string) => `${BASE_URL}/mobile/l3/fnb/delivery/${id}/status`,
    completeDelivery: (id: string) => `${BASE_URL}/mobile/l3/fnb/delivery/${id}/complete`,
  },
}
