import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type {
  Advertisement,
  FeedbackAnswer,
  FeedbackFormDetail,
  FeedbackFormSummary,
  FeedbackRecipientStatus,
} from '../types/feedback'

export const feedbackService = {
  getAdvertisements: async (): Promise<Advertisement[]> => {
    const res = await api.get(ENDPOINTS.advertisements.list)
    return Array.isArray(res.data?.data) ? res.data.data : []
  },

  getForms: async (status: FeedbackRecipientStatus): Promise<FeedbackFormSummary[]> => {
    const res = await api.get(ENDPOINTS.feedbackForms.list(status))
    return Array.isArray(res.data?.data) ? res.data.data : []
  },

  getForm: async (id: string): Promise<FeedbackFormDetail> => {
    const res = await api.get(ENDPOINTS.feedbackForms.detail(id))
    return res.data.data
  },

  submitForm: async (id: string, answers: FeedbackAnswer[]): Promise<{ message?: string }> => {
    const res = await api.post(ENDPOINTS.feedbackForms.submit(id), { answers })
    return res.data
  },
}
