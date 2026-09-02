import { api } from '../api'
import { ENDPOINTS } from '../api/endpoints'
import type {
  FnbMenuResponse,
  FnbOrderHistoryItem,
  FnbPlaceOrderResult,
  FnbPropertySpecialSlotInfo,
  FnbResidentOrderPayload,
} from '../types/fnb'

export const fnbMobileService = {
  getDailyMenu: async (dateStr: string): Promise<FnbMenuResponse | null> => {
    const res = await api.get(ENDPOINTS.fnb.dailyMenu(dateStr))
    return res.data?.data || null
  },

  getSpecialMenu: async (): Promise<FnbPropertySpecialSlotInfo[]> => {
    const res = await api.get(ENDPOINTS.fnb.specialMenu)
    return res.data?.data || []
  },

  placeOrder: async (payload: FnbResidentOrderPayload): Promise<FnbPlaceOrderResult> => {
    const res = await api.post(ENDPOINTS.fnb.placeOrder, payload)
    return res.data
  },

  getOrderHistory: async (): Promise<FnbOrderHistoryItem[]> => {
    const res = await api.get(ENDPOINTS.fnb.orderHistory)
    return res.data?.data || []
  },
}
