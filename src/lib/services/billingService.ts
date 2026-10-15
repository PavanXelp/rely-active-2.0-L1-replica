import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type { Bill } from '../types/billing'

/** Bills for the signed-in resident's flat (residents and family members living there). */
export const billingService = {
  getBills: async (page = 1): Promise<{ invoices: Bill[]; pagination: { totalPages: number } }> => {
    const res = await api.get(ENDPOINTS.bills.list(page))
    return res.data.data
  },

  getPdfUrl: async (invoiceId: string, receiptId?: string): Promise<string> => {
    const res = await api.get(ENDPOINTS.bills.pdf(invoiceId, receiptId))
    return res.data.data.pdfUrl
  },
}
