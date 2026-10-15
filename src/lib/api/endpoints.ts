import { env } from '@/lib/env'

export const BASE_URL = env.VITE_API_URL || 'http://localhost:3002/api/v1'

export const ENDPOINTS = {
  auth: {
    login: `${BASE_URL}/mobile/l1/auth/login`,
    profile: `${BASE_URL}/mobile/l1/auth/profile`,
    details: `${BASE_URL}/mobile/l1/resident/details`,
  },
  tickets: {
    list: `${BASE_URL}/mobile/l1/tickets`,
    create: `${BASE_URL}/mobile/l1/tickets`,
    departments: `${BASE_URL}/mobile/l1/tickets/departments`,
    detail: (id: string) => `${BASE_URL}/mobile/l1/tickets/${id}`,
    updateTat: (id: string) => `${BASE_URL}/mobile/l1/tickets/${id}/tat`,
    escalate: (id: string) => `${BASE_URL}/mobile/l1/tickets/${id}/escalate`,
  },
  fnb: {
    dailyMenu: (date: string) => `${BASE_URL}/mobile/l1/fnb/menu?date=${encodeURIComponent(date)}`,
    specialMenu: `${BASE_URL}/mobile/l1/fnb/special-menu`,
    placeOrder: `${BASE_URL}/mobile/l1/fnb/order`,
    orderHistory: `${BASE_URL}/mobile/l1/fnb/orders`,
  },
  events: {
    list: (filter: 'upcoming' | 'today') => `${BASE_URL}/mobile/l1/events?filter=${encodeURIComponent(filter)}`,
    detail: (id: string) => `${BASE_URL}/mobile/l1/events/${id}`,
    reserve: (id: string) => `${BASE_URL}/mobile/l1/events/${id}/reserve`,
  },
  venues: {
    list: (minOccupancy?: number) =>
      minOccupancy != null
        ? `${BASE_URL}/mobile/l1/events/venues?minOccupancy=${encodeURIComponent(String(minOccupancy))}`
        : `${BASE_URL}/mobile/l1/events/venues`,
    detail: (id: string) => `${BASE_URL}/mobile/l1/events/venues/${id}`,
    availability: (venueId: string, startDate: string, endDate: string) =>
      `${BASE_URL}/mobile/l1/events/venues/availability?venueId=${encodeURIComponent(venueId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
  },
  eventRequests: {
    list: `${BASE_URL}/mobile/l1/events/event-requests`,
    detail: (id: string) => `${BASE_URL}/mobile/l1/events/event-requests/${id}`,
    create: `${BASE_URL}/mobile/l1/events/event-requests`,
  },
  medical: {
    appointments: {
      list: `${BASE_URL}/mobile/l1/medical/appointments`,
      myBookings: `${BASE_URL}/mobile/l1/medical/appointments/my-bookings`,
      bookingDiagnosis: (id: string) => `${BASE_URL}/mobile/l1/medical/appointments/bookings/${id}/diagnosis`,
      detail: (id: string) => `${BASE_URL}/mobile/l1/medical/appointments/${id}`,
      book: (id: string) => `${BASE_URL}/mobile/l1/medical/appointments/${id}/book`,
    },
    history: {
      latest: `${BASE_URL}/mobile/l1/medical/history`,
      byDate: (date: string) => `${BASE_URL}/mobile/l1/medical/history/diagnoses?date=${encodeURIComponent(date)}`,
    },
  },
  advertisements: {
    list: `${BASE_URL}/mobile/l1/advertisements`,
  },
  bills: {
    list: (page = 1) => `${BASE_URL}/mobile/l1/billing/invoices?page=${page}`,
    detail: (id: string) => `${BASE_URL}/mobile/l1/billing/invoices/${encodeURIComponent(id)}`,
    pdf: (id: string, receiptId?: string) =>
      `${BASE_URL}/mobile/l1/billing/invoices/${encodeURIComponent(id)}/pdf${
        receiptId ? `?type=RECEIPT&receiptId=${encodeURIComponent(receiptId)}` : ''
      }`,
  },
  feedbackForms: {
    list: (status: 'PENDING' | 'SUBMITTED') =>
      `${BASE_URL}/mobile/l1/feedback-forms?status=${encodeURIComponent(status)}`,
    detail: (id: string) => `${BASE_URL}/mobile/l1/feedback-forms/${encodeURIComponent(id)}`,
    submit: (id: string) => `${BASE_URL}/mobile/l1/feedback-forms/${encodeURIComponent(id)}/submit`,
  },
  l3: {
    assignedDeliveries: (locId?: string) =>
      `${BASE_URL}/mobile/l3/fnb/assigned-deliveries${locId ? `?locId=${encodeURIComponent(locId)}` : ''}`,
    updateDeliveryStatus: (id: string) => `${BASE_URL}/mobile/l3/fnb/delivery/${id}/status`,
    completeDelivery: (id: string) => `${BASE_URL}/mobile/l3/fnb/delivery/${id}/complete`,
  },
}
