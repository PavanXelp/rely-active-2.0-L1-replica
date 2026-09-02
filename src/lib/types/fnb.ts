export type FnbDietaryType = 'veg' | 'non_veg' | 'egg' | 'jain' | 'mixed' | 'vegan'
export type FnbMealSlotType = 'breakfast' | 'lunch' | 'snacks' | 'dinner'
export type FnbOrderStatusType =
  'placed' | 'accepted' | 'preparing' | 'ready' | 'delivering_to_room' | 'completed' | 'delivered' | 'cancelled'

export interface FnbDishObj {
  id: string
  name: string
  category?: string
  dietaryType?: FnbDietaryType
  basePrice?: number
  imageUrl?: string
  description?: string
}

export interface FnbPropertyMealSlotInfo {
  id: string
  globalMealSlotId?: string
  name: string
  slotKey?: string
  startTime: string
  endTime: string
  price?: number
  isIncludedInPackage?: boolean
}

export interface FnbPropertySpecialSlotDishInfo {
  id: string
  propertySpecialSlotId: string
  dishId: string
  price: number
  dish?: FnbDishObj
}

export interface FnbPropertySpecialSlotInfo {
  id: string
  globalSpecialSlotId: string
  name: string
  description?: string
  price?: number | string
  specialDishes?: FnbPropertySpecialSlotDishInfo[]
}

export interface FnbModalSlotDish {
  id: string
  dailyMenuId: string
  dishId: string
  globalMealSlotId: string
  propertyMealSlotId?: string
  isOptional: boolean
  isPackageCovered: boolean
  standardPrice?: number
  extraPrice?: number
  effectivePrice?: number
  dish?: FnbDishObj
}

export interface FnbMenuResponse {
  date: string
  dayOfWeek?: string
  hasActivePackage?: boolean
  activePackage?: {
    id?: string
    packageName?: string
    includedSlots?: string[]
  }
  propertyMealSlots?: FnbPropertyMealSlotInfo[]
  itemsBySlot?: Record<string, FnbModalSlotDish[]>
}

export interface FnbResidentOrderPayload {
  orderType: 'personal' | 'guest' | 'special' | 'custom'
  selectionType: 'dish' | 'slot' | 'entire_slot'
  serviceType: 'dine_in' | 'room_service'
  date: string
  mealSlotId?: string
  specialMealSlotId?: string
  guestName?: string
  guestCount?: number
  items?: Array<{
    dishId: string
    menuItemId?: string
    specialMealSlotDishId?: string
    quantity: number
  }>
}

export interface FnbPlaceOrderResult {
  success?: boolean
  message?: string
  data?: unknown
}

export interface FnbOrderHistoryItem {
  id: string
  orderType: string
  selectionType: string
  serviceType: string
  orderStatus: string
  date: string
  createdAt: string
  totalAmount: number | string
  details?: Array<{
    id: string
    quantity: number
    amount?: number
    isPackageCovered?: boolean
    dish?: {
      name?: string
    }
  }>
}
