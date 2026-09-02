import { api } from '../api'
import type {
  FnbMenuResponse,
  FnbOrderHistoryItem,
  FnbPlaceOrderResult,
  FnbPropertySpecialSlotInfo,
  FnbResidentOrderPayload,
} from '../types/fnb'

export const fnbMobileService = {
  getDailyMenu: async (dateStr: string): Promise<FnbMenuResponse | null> => {
    const res = await api.get(`/mobile/l1/fnb/menu?date=${dateStr}`)
    return res.data?.data || null
  },

  getSpecialMenu: async (): Promise<FnbPropertySpecialSlotInfo[]> => {
    const res = await api.get('/mobile/l1/fnb/special-menu')
    return res.data?.data || []
  },

  placeOrder: async (payload: FnbResidentOrderPayload): Promise<FnbPlaceOrderResult> => {
    const res = await api.post('/mobile/l1/fnb/order', payload)
    return res.data
  },

  getOrderHistory: async (): Promise<FnbOrderHistoryItem[]> => {
    const res = await api.get('/mobile/l1/fnb/orders')
    return res.data?.data || []
  },
}
