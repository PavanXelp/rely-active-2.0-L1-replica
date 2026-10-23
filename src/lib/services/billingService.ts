import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type { Bill } from '../types/billing'

/** Bills for the signed-in resident's flat (residents and family members living there). */
export const billingService = {
  /** `fromPreviousFlats`: bills of a flat the household lived in before moving to this one. */
  getBills: async (
    page = 1,
  ): Promise<{ invoices: Bill[]; fromPreviousFlats?: Bill[]; pagination: { totalPages: number } }> => {
    const res = await api.get(ENDPOINTS.bills.list(page))
    return res.data.data
  },

  getPdfUrl: async (invoiceId: string, receiptId?: string): Promise<string> => {
    const res = await api.get(ENDPOINTS.bills.pdf(invoiceId, receiptId))
    return res.data.data.pdfUrl
  },
}
