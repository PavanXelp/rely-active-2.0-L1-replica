import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Utensils,
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  ShoppingCart,
  X,
  AlertTriangle,
  ChefHat,
  History,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fnbMobileService } from '@/lib/services/fnbService'
import { getFileUrl } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth-store'
import type {
  FnbDishObj,
  FnbMenuItem,
  FnbMenuResponse,
  FnbOrderHistoryItem,
  FnbPropertySpecialSlotInfo,
  FnbResidentOrderPayload,
} from '@/lib/types/fnb'
import { toast } from 'sonner'

type DishObj = FnbDishObj
type MenuItem = FnbMenuItem
type PropertySpecialSlotInfo = FnbPropertySpecialSlotInfo
type MenuResponse = FnbMenuResponse

const getDishImageUrl = (dishObj?: DishObj | Record<string, unknown> | null): string | null => {
  if (!dishObj) return null
  const d = dishObj as Record<string, unknown>
  const url = d.imageUrl || d.image_url || d.photoUrl || d.photo_url
  if (typeof url === 'string' && url.trim()) {
    return getFileUrl(url.trim())
  }
  return null
}

const SLOT_EXACT_NAMES: Record<string, string[]> = {
  breakfast: ['break fast', 'breakfast', 'break_fast'],
  lunch: ['lunch'],
  snacks: ['evening snacks', 'snacks', 'evening_snacks', 'tea & snacks'],
  dinner: ['dinner'],
  mid_night_snacks: ['mid night snacks', 'mid_night_snacks', 'midnight snacks', 'midnight_snacks'],
}

const exactSlotMatch = (slotName: string | undefined | null, targetSlotKey: string): boolean => {
  if (!slotName) return false
  const norm = slotName.toLowerCase().trim()
  const allowed = SLOT_EXACT_NAMES[targetSlotKey] || [targetSlotKey.toLowerCase().replace(/_/g, ' ')]
  return allowed.includes(norm)
}

export default function FnbPage() {
  const resident = useAuthStore((state) => state.resident)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]!)
  const [activeSlot, setActiveSlot] = useState<string>('breakfast')
  const [loading, setLoading] = useState(false)
  const [menuData, setMenuData] = useState<MenuResponse | null>(null)

  // Order Drawer State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderMode, setOrderMode] = useState<'personal' | 'guest' | 'special' | 'custom'>('personal')
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]!)
  const [selectionType, setSelectionType] = useState<'entire_slot' | 'dish'>('dish')
  const [serviceType, setServiceType] = useState<'dine_in' | 'room_service'>('room_service')

  // Selected Meal Slot & Special Slot
  const [selectedMealSlotId, setSelectedMealSlotId] = useState<string>('')
  const [selectedSpecialSlotId, setSelectedSpecialSlotId] = useState<string>('')

  // Special Slots data for Special Meal mode
  const [specialSlotsData, setSpecialSlotsData] = useState<PropertySpecialSlotInfo[]>([])

  // Dish Quantities map: { [dishId]: quantity }
  const [dishQuantities, setDishQuantities] = useState<Record<string, number>>({})
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // Order History state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [ordersHistory, setOrdersHistory] = useState<FnbOrderHistoryItem[]>([])
  const [_loadingHistory, setLoadingHistory] = useState(false)

  const fetchOrdersHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const data = await fnbMobileService.getOrderHistory()
      setOrdersHistory(data || [])
    } catch (err) {
      console.error('Failed to fetch order history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const activePackage = menuData?.activePackage || menuData?.packageSubscription || menuData?.subscription
  const includedSlots = useMemo(
    () => activePackage?.includedMealSlots || activePackage?.includedSlots || [],
    [activePackage],
  )

  const isItemForSlot = useCallback(
    (
      itemSlotName: string | undefined | null,
      itemSlotId: string | undefined | null,
      activeSlotKey: string,
    ): boolean => {
      if (itemSlotId && menuData?.propertyMealSlots) {
        const pSlot = menuData.propertyMealSlots.find(
          (s) =>
            (s.slotKey && s.slotKey === activeSlotKey) ||
            exactSlotMatch(s.name || s.globalMealSlot?.name, activeSlotKey),
        )
        if (pSlot && (itemSlotId === pSlot.id || itemSlotId === pSlot.globalMealSlotId)) {
          return true
        }
      }
      return exactSlotMatch(itemSlotName, activeSlotKey)
    },
    [menuData],
  )

  const isSlotIncludedInPackage = useCallback(
    (slotKey: string): boolean => {
      if (!menuData?.hasActivePackage && !activePackage) return false

      const pSlot = menuData?.propertyMealSlots?.find(
        (s) => (s.slotKey && s.slotKey === slotKey) || exactSlotMatch(s.name || s.globalMealSlot?.name, slotKey),
      )
      if (pSlot && pSlot.isIncludedInPackage !== undefined) {
        return Boolean(pSlot.isIncludedInPackage)
      }

      return includedSlots.some((inc: string) => {
        if (pSlot && (inc === pSlot.id || inc === pSlot.globalMealSlotId)) {
          return true
        }
        const matchedSlot = menuData?.propertyMealSlots?.find((s) => s.globalMealSlotId === inc || s.id === inc)
        const slotName = matchedSlot?.name || matchedSlot?.globalMealSlot?.name || inc
        return exactSlotMatch(slotName, slotKey)
      })
    },
    [menuData, activePackage, includedSlots],
  )

  const timeToMinutes = (tStr?: string): number => {
    if (!tStr) return 0
    const [h, m] = tStr.split(':').map((x) => parseInt(x, 10))
    if (isNaN(h) || isNaN(m)) return 0
    return h * 60 + m
  }

  const availableMealSlots = useMemo(() => {
    let slotsList = []
    if (menuData?.propertyMealSlots && menuData.propertyMealSlots.length > 0) {
      slotsList = menuData.propertyMealSlots.map((ps) => {
        const slotName = ps.name || ps.globalMealSlot?.name || 'Meal Slot'
        const slotKey = ps.slotKey || slotName.toLowerCase().replace(/[^a-z0-9]/g, '_')
        let icon = '🍽️'
        const lowerName = slotName.toLowerCase()
        if (lowerName.includes('break')) icon = '🌅'
        else if (lowerName.includes('lunch')) icon = '☀️'
        else if (lowerName.includes('snack') && !lowerName.includes('night') && !lowerName.includes('mid')) icon = '🍿'
        else if (lowerName.includes('dinner')) icon = '🌙'
        else if (lowerName.includes('night') || lowerName.includes('mid')) icon = '🌌'
        else if (lowerName.includes('tea') || lowerName.includes('coffee')) icon = '☕'

        return {
          key: slotKey,
          label: slotName,
          startTime: ps.startTime || ps.globalMealSlot?.startTime || '00:00',
          endTime: ps.endTime || ps.globalMealSlot?.endTime || '00:00',
          icon,
          id: ps.id,
          globalMealSlotId: ps.globalMealSlotId,
          price: ps.price !== undefined && ps.price !== null ? Number(ps.price) : 0,
          isIncludedInPackage: ps.isIncludedInPackage,
        }
      })
    } else {
      slotsList = [
        { key: 'breakfast', label: 'Break Fast', startTime: '07:30', endTime: '09:30', icon: '🌅' },
        { key: 'lunch', label: 'Lunch', startTime: '12:30', endTime: '15:00', icon: '☀️' },
        { key: 'snacks', label: 'Evening Snacks', startTime: '16:30', endTime: '18:00', icon: '🍿' },
        { key: 'dinner', label: 'Dinner', startTime: '19:30', endTime: '22:00', icon: '🌙' },
        { key: 'mid_night_snacks', label: 'Mid Night Snacks', startTime: '23:30', endTime: '01:00', icon: '🌌' },
      ]
    }

    return slotsList.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  }, [menuData?.propertyMealSlots])

  const currentActiveSlot = availableMealSlots.some((s) => s.key === activeSlot)
    ? activeSlot
    : availableMealSlots[0]?.key || activeSlot

  const isSlotCoveredInPkg = useCallback(
    (slot: { key: string; isIncludedInPackage?: boolean; globalMealSlotId?: string; id?: string }): boolean => {
      return (
        Boolean(slot.isIncludedInPackage) ||
        isSlotIncludedInPackage(slot.key) ||
        (slot.globalMealSlotId ? isSlotIncludedInPackage(slot.globalMealSlotId) : false) ||
        (slot.id ? isSlotIncludedInPackage(slot.id) : false)
      )
    },
    [isSlotIncludedInPackage],
  )

  const defaultSlotTimings: Record<string, string> = {
    breakfast: '07:30 - 09:30',
    lunch: '12:30 - 15:00',
    snacks: '17:00 - 18:30',
    dinner: '19:30 - 22:00',
    mid_night_snacks: '23:30 - 01:00',
  }

  const getSlotTiming = (slotKey: string): string => {
    const slot = availableMealSlots.find(
      (s) => s.key === slotKey || (s.id && s.id === slotKey) || exactSlotMatch(s.label, slotKey),
    )
    if (slot && slot.startTime && slot.endTime) {
      return `${slot.startTime} - ${slot.endTime}`
    }
    const pSlot = menuData?.propertyMealSlots?.find((s) => s.slotKey === slotKey || exactSlotMatch(s.name, slotKey))
    if (pSlot && pSlot.startTime && pSlot.endTime) {
      return `${pSlot.startTime} - ${pSlot.endTime}`
    }
    const matchedDefaultKey = Object.keys(defaultSlotTimings).find((k) => exactSlotMatch(k, slotKey))
    if (matchedDefaultKey) {
      return defaultSlotTimings[matchedDefaultKey]
    }
    return defaultSlotTimings[slotKey] || '07:30 - 09:30'
  }

  const fetchSpecialMenu = useCallback(async () => {
    try {
      const slots = await fnbMobileService.getSpecialMenu()
      setSpecialSlotsData(slots || [])
      if (slots && slots.length > 0) {
        setSelectedSpecialSlotId((prev) => (prev ? prev : slots[0].id))
      }
    } catch (err: unknown) {
      console.error('Failed to load special menu:', err)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const loadAllMenuData = async () => {
      try {
        setLoading(true)
        const [dailyData, specialSlots] = await Promise.all([
          fnbMobileService.getDailyMenu(selectedDate),
          fnbMobileService.getSpecialMenu(),
        ])
        if (!ignore) {
          setMenuData(dailyData)
          setSpecialSlotsData(specialSlots || [])
          if (specialSlots && specialSlots.length > 0) {
            setSelectedSpecialSlotId((prev) => (prev ? prev : specialSlots[0].id))
          }

          // Auto-select first slot containing dishes if active slot has no dishes
          if (dailyData?.menu) {
            const menuObj = dailyData.menu
            const keys = Object.keys(menuObj)
            const activeNorm = activeSlot.toLowerCase().replace(/[^a-z0-9]/g, '')
            const activeHasDishes = keys.some((k) => {
              const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '')
              return (
                (kNorm === activeNorm || kNorm.includes(activeNorm) || activeNorm.includes(kNorm)) &&
                Array.isArray(menuObj[k]) &&
                menuObj[k].length > 0
              )
            })

            if (!activeHasDishes) {
              const slotWithDishesKey = keys.find((k) => Array.isArray(menuObj[k]) && menuObj[k].length > 0)
              if (slotWithDishesKey) {
                const kNorm = slotWithDishesKey.toLowerCase().replace(/[^a-z0-9]/g, '')
                const matchedAvailableSlot = availableMealSlots.find((s) => {
                  const sNorm = s.key.toLowerCase().replace(/[^a-z0-9]/g, '')
                  return sNorm === kNorm || sNorm.includes(kNorm) || kNorm.includes(sNorm)
                })
                if (matchedAvailableSlot) {
                  setActiveSlot(matchedAvailableSlot.key)
                }
              }
            }
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error('Failed to load resident FnB menu:', err)
          toast.error('Failed to load food menu')
          setMenuData(null)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void loadAllMenuData()

    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const handleOpenOrderModal = () => {
    setIsOrderModalOpen(true)
    setOrderMode('personal')
    const localToday = (() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })()
    const validDate = selectedDate >= localToday ? selectedDate : localToday
    setOrderDate(validDate)
    setSelectionType('dish')
    setServiceType('room_service')
    setDishQuantities({})

    const firstMissingSlot = availableMealSlots.find((s) => !isSlotCoveredInPkg(s))
    if (firstMissingSlot) {
      setSelectedMealSlotId(firstMissingSlot.globalMealSlotId || firstMissingSlot.id || firstMissingSlot.key)
    } else if (menuData?.propertyMealSlots && menuData.propertyMealSlots.length > 0) {
      setSelectedMealSlotId(menuData.propertyMealSlots[0].globalMealSlotId || menuData.propertyMealSlots[0].id)
    }

    void fetchSpecialMenu()
  }

  const updateQuantity = (dishId: string, delta: number) => {
    setDishQuantities((prev) => {
      const current = prev[dishId] || 0
      const updated = Math.max(0, current + delta)
      if (updated === 0) {
        const copy = { ...prev }
        delete copy[dishId]
        return copy
      }
      return { ...prev, [dishId]: updated }
    })
  }

  const getCarouselDates = () => {
    const dates = []
    const ref = new Date(selectedDate)
    for (let i = -2; i <= 4; i++) {
      const d = new Date(ref)
      d.setDate(d.getDate() + i)
      const dStr = d.toISOString().split('T')[0]!
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNum = d.getDate()
      dates.push({ dateStr: dStr, dayName, dayNum })
    }
    return dates
  }

  const carouselDates = getCarouselDates()
  const todayStr = new Date().toISOString().split('T')[0]!

  const currentSlotDishes = useMemo(() => {
    if (menuData?.menu) {
      if (menuData.menu[currentActiveSlot]) {
        return menuData.menu[currentActiveSlot]
      }
      const targetNorm = currentActiveSlot.toLowerCase().replace(/[^a-z0-9]/g, '')
      const foundKey = Object.keys(menuData.menu).find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm)
      if (foundKey && menuData.menu[foundKey]) {
        return menuData.menu[foundKey]
      }
      const keywordKey = Object.keys(menuData.menu).find((k) => {
        const kNorm = k.toLowerCase()
        if (targetNorm.includes('break') && kNorm.includes('break')) return true
        if (targetNorm.includes('lunch') && kNorm.includes('lunch')) return true
        if (targetNorm.includes('snack') && kNorm.includes('snack')) return true
        if (targetNorm.includes('dinner') && kNorm.includes('dinner')) return true
        return false
      })
      if (keywordKey && menuData.menu[keywordKey]) {
        return menuData.menu[keywordKey]
      }
    }
    if (menuData?.menuItems) {
      const rawSlotDishes = menuData.menuItems.filter((m) => isItemForSlot(m.mealSlot, m.mealSlotId, currentActiveSlot))
      const dishMap = new Map<string, MenuItem>()
      rawSlotDishes.forEach((item) => {
        const key = item.dishId || item.id
        if (!dishMap.has(key)) {
          dishMap.set(key, item)
        }
      })
      return Array.from(dishMap.values())
    }
    return []
  }, [menuData, currentActiveSlot, isItemForSlot])

  // Dishes for the meal slot selected inside the order modal
  const modalSlotDishes = useMemo(() => {
    const targetSlotObj = availableMealSlots.find(
      (s) =>
        s.id === selectedMealSlotId ||
        s.globalMealSlotId === selectedMealSlotId ||
        s.key === selectedMealSlotId ||
        exactSlotMatch(s.label, selectedMealSlotId),
    )
    const slotKeyToUse = targetSlotObj?.key || selectedMealSlotId || currentActiveSlot
    if (menuData?.menuItems) {
      const raw = menuData.menuItems.filter((m) => isItemForSlot(m.mealSlot, m.mealSlotId, slotKeyToUse))
      const map = new Map<string, MenuItem>()
      raw.forEach((item) => {
        const key = item.dishId || item.id
        if (!map.has(key)) map.set(key, item)
      })
      return Array.from(map.values())
    }
    return currentSlotDishes
  }, [availableMealSlots, selectedMealSlotId, currentActiveSlot, menuData, isItemForSlot, currentSlotDishes])

  // 2-Hour Cutoff Time Check for the selected slot and order date
  const cutoffInfo = useMemo(() => {
    const targetSlotObj =
      availableMealSlots.find(
        (s) =>
          s.id === selectedMealSlotId ||
          s.globalMealSlotId === selectedMealSlotId ||
          s.key === selectedMealSlotId ||
          exactSlotMatch(s.label, selectedMealSlotId),
      ) || availableMealSlots.find((s) => s.key === currentActiveSlot)

    if (!targetSlotObj || !targetSlotObj.startTime) {
      return { isPassed: false, slotName: '', startTime: '', cutoffTimeFormatted: '' }
    }

    const effectiveDate = orderMode === 'special' || orderMode === 'personal' ? todayStr : orderDate
    const today = todayStr

    if (effectiveDate < today) {
      return {
        isPassed: true,
        slotName: targetSlotObj.label,
        startTime: targetSlotObj.startTime,
        cutoffTimeFormatted: 'Past Date',
      }
    }

    if (effectiveDate > today) {
      return {
        isPassed: false,
        slotName: targetSlotObj.label,
        startTime: targetSlotObj.startTime,
        cutoffTimeFormatted: '',
      }
    }

    // Date is TODAY: check 2-hour cutoff rule (slotStart - 2 hours)
    const [startHourStr, startMinStr] = targetSlotObj.startTime.split(':')
    const startHour = parseInt(startHourStr || '7', 10)
    const startMin = parseInt(startMinStr || '30', 10)

    if (isNaN(startHour) || isNaN(startMin)) {
      return {
        isPassed: false,
        slotName: targetSlotObj.label,
        startTime: targetSlotObj.startTime,
        cutoffTimeFormatted: '',
      }
    }

    const now = new Date()
    const currentTotalMin = now.getHours() * 60 + now.getMinutes()
    const slotStartTotalMin = startHour * 60 + startMin
    const cutoffTotalMin = slotStartTotalMin - 120

    const isPassed = currentTotalMin > cutoffTotalMin

    const cutoffHour = Math.floor(Math.max(0, cutoffTotalMin) / 60)
    const cutoffMin = Math.max(0, cutoffTotalMin) % 60
    const period = cutoffHour >= 12 ? 'PM' : 'AM'
    const displayHour = cutoffHour % 12 || 12
    const cutoffTimeFormatted = `${String(displayHour).padStart(2, '0')}:${String(cutoffMin).padStart(2, '0')} ${period}`

    return {
      isPassed,
      slotName: targetSlotObj.label,
      startTime: targetSlotObj.startTime,
      cutoffTimeFormatted,
    }
  }, [selectedMealSlotId, orderDate, orderMode, todayStr, availableMealSlots, currentActiveSlot])

  // Total order price calculation for selected dishes or entire meal slot
  const calculatedTotalAmount = useMemo(() => {
    if (selectionType === 'entire_slot') {
      if (orderMode === 'special') {
        const targetSpecialSlot = specialSlotsData.find(
          (s) => s.id === selectedSpecialSlotId || s.globalSpecialSlotId === selectedSpecialSlotId,
        )
        if (targetSpecialSlot) {
          const specPrice = Number(targetSpecialSlot.price || 0)
          if (specPrice > 0) return specPrice
          const dishesSum = (targetSpecialSlot.specialDishes || []).reduce((sum, sd) => sum + Number(sd.price || 0), 0)
          if (dishesSum > 0) return dishesSum
        }
      }

      const isCovered = isSlotIncludedInPackage(selectedMealSlotId || currentActiveSlot)
      if (isCovered) return 0
      const targetSlotObj =
        availableMealSlots.find(
          (s) =>
            s.id === selectedMealSlotId ||
            s.globalMealSlotId === selectedMealSlotId ||
            s.key === selectedMealSlotId ||
            exactSlotMatch(s.label, selectedMealSlotId),
        ) || availableMealSlots.find((s) => s.key === currentActiveSlot)

      const slotPrice = Number(targetSlotObj?.price || 0)
      if (slotPrice > 0) return slotPrice

      const pSlot =
        menuData?.propertyMealSlots?.find(
          (s) =>
            s.id === selectedMealSlotId ||
            s.globalMealSlotId === selectedMealSlotId ||
            (s.slotKey && s.slotKey === selectedMealSlotId) ||
            exactSlotMatch(s.name, selectedMealSlotId),
        ) || menuData?.propertyMealSlots?.find((s) => exactSlotMatch(s.name, currentActiveSlot))

      const directPrice = Number(pSlot?.price || 0)
      if (directPrice > 0) return directPrice

      return modalSlotDishes.reduce((sum, item) => {
        const dishObj: DishObj = item.dish || (item as unknown as DishObj)
        const price = item.effectivePrice ?? dishObj.basePrice ?? 0
        return sum + price
      }, 0)
    }

    if (orderMode === 'special') {
      return Object.entries(dishQuantities).reduce((sum, [dishId, qty]) => {
        const sDish = specialSlotsData
          .flatMap((sSlot) => sSlot.specialDishes || [])
          .find((sd) => sd.dishId === dishId || sd.dish?.id === dishId)
        const price = Number(sDish?.price || 0)
        return sum + price * qty
      }, 0)
    }

    return Object.entries(dishQuantities).reduce((sum, [dishId, qty]) => {
      const item = modalSlotDishes.find((m) => m.dishId === dishId || m.dish?.id === dishId)
      if (!item) return sum
      const dishObj: DishObj = item.dish || (item as unknown as DishObj)
      const isCovered =
        isSlotIncludedInPackage(selectedMealSlotId || currentActiveSlot) && (item.isPackageCovered ?? !item.isOptional)
      const unitPrice = isCovered ? 0 : item.effectivePrice || dishObj.basePrice || 0
      return sum + unitPrice * qty
    }, 0)
  }, [
    selectionType,
    selectedMealSlotId,
    currentActiveSlot,
    availableMealSlots,
    modalSlotDishes,
    dishQuantities,
    orderMode,
    specialSlotsData,
    selectedSpecialSlotId,
    isSlotIncludedInPackage,
    menuData?.propertyMealSlots,
  ])

  const handlePlaceOrder = async () => {
    if (cutoffInfo.isPassed) {
      toast.error(
        `Ordering deadline passed for ${cutoffInfo.slotName} (${cutoffInfo.startTime}). Closed at ${cutoffInfo.cutoffTimeFormatted}.`,
      )
      return
    }

    if (orderMode === 'guest' && !orderDate) {
      toast.error('Please select an order date for Guest Meal')
      return
    }

    if (selectionType === 'dish' && Object.keys(dishQuantities).length === 0) {
      toast.error('Please select at least one dish item')
      return
    }

    try {
      setSubmittingOrder(true)

      const itemsPayload = Object.entries(dishQuantities).map(([dishId, quantity]) => {
        if (orderMode === 'special') {
          const targetSpecialSlot = specialSlotsData.find((s) => s.id === selectedSpecialSlotId)
          const specDish = targetSpecialSlot?.specialDishes?.find((sd) => sd.dishId === dishId)
          return {
            dishId,
            specialMealSlotDishId: specDish?.id,
            quantity,
            unitPrice: Number(specDish?.price || 0),
          }
        }
        const mItem = modalSlotDishes.find((m) => m.dishId === dishId || m.dish?.id === dishId)
        const price = Number(mItem?.dish?.price || mItem?.price || 0)
        return {
          dishId,
          menuItemId: mItem?.menuItemId || mItem?.id,
          quantity,
          unitPrice: price,
        }
      })

      const payload: FnbResidentOrderPayload = {
        orderType: orderMode,
        selectionType,
        serviceType,
        date: orderMode === 'special' || orderMode === 'personal' ? todayStr : orderDate,
        mealSlotId: selectedMealSlotId || undefined,
        specialMealSlotId: orderMode === 'special' ? selectedSpecialSlotId : undefined,
        items: selectionType === 'dish' ? itemsPayload : [],
        totalAmount: calculatedTotalAmount,
      }

      const res = await fnbMobileService.placeOrder(payload)
      if (res?.success) {
        toast.success('Meal order placed successfully! 🎉')
        setIsOrderModalOpen(false)
        setDishQuantities({})
        void fetchOrdersHistory()
      } else {
        toast.error(res?.message || 'Failed to place order')
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      toast.error(errorObj.response?.data?.message || 'Failed to place meal order')
    } finally {
      setSubmittingOrder(false)
    }
  }

  return (
    <div className="space-y-5 pb-6 select-none font-sans">
      {/* Top Welcome Card with Active Food Package Details & Make an Order Action */}
      {(() => {
        const pkg = menuData?.activePackage || menuData?.packageSubscription || menuData?.subscription
        const rawIncluded = pkg?.includedMealSlots || pkg?.includedSlots || []
        const includedSlotsList = rawIncluded.map((slotIdOrName) => {
          const matched = menuData?.propertyMealSlots?.find(
            (ps) =>
              ps.globalMealSlotId === slotIdOrName ||
              ps.id === slotIdOrName ||
              ps.name?.toLowerCase() === slotIdOrName.toLowerCase(),
          )
          return matched?.name || slotIdOrName
        })
        const displayPkgName = pkg?.packageName || pkg?.name || 'Active Food Package'

        return (
          <div className="bg-gradient-to-r from-[#005390] via-blue-700 to-indigo-800 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden space-y-4">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
              <Badge className="bg-white/20 text-white border-none px-2.5 py-0.5 text-[10px] font-bold">
                <Sparkles className="w-3 h-3 mr-1 text-amber-300" /> Food & Beverage
              </Badge>

              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => {
                    fetchOrdersHistory()
                    setIsHistoryModalOpen(true)
                  }}
                  className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-white/20 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-blue-200" /> Order History
                </Button>

                <Button
                  onClick={handleOpenOrderModal}
                  className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" /> Make an Order
                </Button>
              </div>
            </div>

            <div className="relative z-10 space-y-1">
              <h2 className="text-xl font-black tracking-tight">Hello, {resident?.firstName || 'Resident'}! 👋</h2>
              <p className="text-xs text-blue-100">Explore today's freshly prepared meals served at your community.</p>
            </div>

            {/* Active Food Package Details */}
            <div className="relative z-10 pt-2.5 border-t border-white/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-amber-300" /> Active Package
                </span>
                <span className="text-xs font-black text-white bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                  {pkg ? displayPkgName : 'No Active Package'}
                </span>
              </div>

              {pkg && includedSlotsList.length > 0 ? (
                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[10px] text-blue-200 font-medium block">
                    Included Meal Slots (Free Coverage):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {includedSlotsList.map((slotName) => {
                      const sLower = slotName.toLowerCase()
                      let icon = '🍴'
                      if (sLower.includes('break') || sLower.includes('breakfast')) icon = '🌅'
                      else if (sLower.includes('lunch')) icon = '☀️'
                      else if (sLower.includes('snack') || sLower.includes('tea')) icon = '🍿'
                      else if (sLower.includes('dinner')) icon = '🌙'
                      else if (sLower.includes('night') || sLower.includes('mid')) icon = '🌌'

                      return (
                        <div
                          key={slotName}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-500/25 text-white border border-emerald-400/40 shadow-2xs ring-1 ring-emerald-400/30 shrink-0"
                        >
                          <span>{icon}</span>
                          <span>{slotName}</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-300 ml-0.5 shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-blue-200 italic">
                  Standard pay-per-item ordering mode active for all meal slots.
                </p>
              )}
            </div>
          </div>
        )
      })()}

      {/* Date Carousel Navigator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#005390]" /> Select Date
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(todayStr)}
            className="h-7 px-2 text-[11px] font-extrabold text-[#005390] hover:bg-blue-50 rounded-lg cursor-pointer"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none px-1">
          {carouselDates.map((item) => {
            const isSelected = item.dateStr === selectedDate
            const isToday = item.dateStr === todayStr

            return (
              <button
                type="button"
                key={item.dateStr}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`flex flex-col items-center justify-center min-w-[56px] py-2 px-1.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#005390] text-white border-[#005390] shadow-md scale-105'
                    : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase opacity-80">{item.dayName}</span>
                <span className="text-sm font-black mt-0.5">{item.dayNum}</span>
                {isToday && (
                  <span
                    className={`text-[9px] font-black mt-0.5 px-1.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#005390]'
                    }`}
                  >
                    Today
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Dynamic Meal Slot Tabs Header */}
      <div className="bg-gray-100/80 dark:bg-neutral-900/80 p-1.5 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 pt-0.5 px-0.5">
          {availableMealSlots.map((tab) => {
            const isActive = activeSlot === tab.key
            const timing = tab.startTime && tab.endTime ? `${tab.startTime} - ${tab.endTime}` : getSlotTiming(tab.key)

            return (
              <button
                type="button"
                key={tab.key}
                onClick={() => setActiveSlot(tab.key)}
                className={`min-w-[92px] shrink-0 flex flex-col items-center py-2 px-2 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-neutral-800 text-[#005390] dark:text-blue-400 font-black shadow-sm scale-102 border border-blue-100 dark:border-blue-900/40'
                    : 'text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 hover:bg-white/50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="text-[11px] font-bold leading-tight mt-0.5 text-center truncate max-w-[88px]">
                  {tab.label}
                </span>
                {timing && (
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1 leading-none whitespace-nowrap tracking-tighter">
                    {timing}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Warning Notice Banner for Non-Included or No Package */}
      {!isSlotIncludedInPackage(currentActiveSlot) && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <span className="font-bold block">Meal Slot Not Covered in Package</span>
            <p className="text-amber-800 dark:text-amber-300">
              There is no {currentActiveSlot.replace('_', ' ')} included in your food package. Standard dish pricing
              applies and orders must be placed at least 2 hours before slot start time.
            </p>
          </div>
        </div>
      )}

      {/* Menu Dishes Section */}
      <div className="space-y-3">
        {(() => {
          const activeSlotObj = availableMealSlots.find(
            (s) =>
              s.key === currentActiveSlot ||
              (s.id && s.id === currentActiveSlot) ||
              exactSlotMatch(s.label, currentActiveSlot),
          )
          const slotLabel = activeSlotObj?.label || currentActiveSlot.replace('_', ' ')
          const timingStr =
            activeSlotObj?.startTime && activeSlotObj?.endTime
              ? `${activeSlotObj.startTime} - ${activeSlotObj.endTime}`
              : getSlotTiming(currentActiveSlot)

          return (
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">{slotLabel} Menu</h3>
                <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#005390]" /> {timingStr}
                </span>
              </div>
              <Badge variant="outline" className="border-gray-200 text-xs font-semibold">
                {currentSlotDishes.length} {currentSlotDishes.length === 1 ? 'Dish' : 'Dishes'} Available
              </Badge>
            </div>
          )
        })()}

        {loading ? (
          <div className="text-center py-10 text-xs text-gray-500">Loading daily menu...</div>
        ) : currentSlotDishes.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/50 dark:bg-neutral-900/30">
            <ChefHat className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              No dishes menu published for this slot yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {currentSlotDishes.map((item, idx) => {
              const dishObj: DishObj = item.dish || (item as unknown as DishObj)
              const imgUrl = getDishImageUrl(dishObj)
              const isCovered =
                isSlotIncludedInPackage(currentActiveSlot) && (item.isPackageCovered ?? !item.isOptional)
              const price = isCovered
                ? 0
                : (item.price ?? item.effectivePrice ?? item.basePrice ?? dishObj.price ?? dishObj.basePrice ?? 0)

              return (
                <div
                  key={item.id || item.menuItemId || idx}
                  className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs hover:border-blue-500/30 transition-all"
                >
                  {imgUrl ? (
                    <img src={imgUrl} alt={dishObj.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-neutral-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shrink-0">
                      {dishObj.name?.[0] || '🍽️'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {dishObj.name}
                      </span>
                      {dishObj.dietaryType && (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                            dishObj.dietaryType === 'veg'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {dishObj.dietaryType.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {dishObj.description && <p className="text-xs text-gray-500 line-clamp-1">{dishObj.description}</p>}

                    <div className="flex items-center gap-2 pt-0.5">
                      {isCovered ? (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Included (Free)
                        </span>
                      ) : (
                        <span className="text-xs font-black text-gray-900 dark:text-gray-100">₹{price}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Special Meal Slots Section */}
      {specialSlotsData && specialSlotsData.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Special Meal Slots
              </h3>
              <span className="text-[11px] font-semibold text-gray-500">
                Special dishes available every day continuously
              </span>
            </div>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold">
              {specialSlotsData.reduce((acc, s) => acc + (s.specialDishes?.length || 0), 0)} Special Dishes
            </Badge>
          </div>

          <div className="space-y-3">
            {specialSlotsData.map((slot) => (
              <div
                key={slot.id}
                className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                      ⭐ {slot.name}
                    </h4>
                    {slot.description && (
                      <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5">{slot.description}</p>
                    )}
                  </div>
                  {slot.price !== undefined && Number(slot.price) > 0 && (
                    <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                      ₹{Number(slot.price).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Dishes list in special slot */}
                {slot.specialDishes && slot.specialDishes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {slot.specialDishes.map((item) => {
                      const dishObj = item.dish
                      if (!dishObj) return null
                      const imgUrl = dishObj.imageUrl || (dishObj as unknown as Record<string, string>).image_url
                      const dishPrice = item.price !== undefined ? item.price : dishObj.basePrice

                      return (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-neutral-900 border border-amber-100 dark:border-neutral-800 rounded-xl p-2.5 flex items-center gap-3 shadow-2xs"
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={dishObj.name}
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-neutral-800 flex items-center justify-center text-amber-800 font-bold text-sm shrink-0">
                              ⭐
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                              {dishObj.name}
                            </div>
                            {dishObj.description && (
                              <p className="text-[10px] text-gray-500 line-clamp-1">{dishObj.description}</p>
                            )}
                            <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                              ₹{dishPrice}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-700 italic">No dishes added to this special slot yet.</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Make an Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/80 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#005390]" />
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Make an Order</h3>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Step 1: Select Order Mode */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider block">
                  1. Select Order Mode
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'personal', label: '🍱 Personal Meal', desc: 'Package daily meal' },
                    { id: 'guest', label: '👥 Guest Meal', desc: 'Pre-order for guests' },
                    { id: 'special', label: '⭐ Special Meal', desc: 'Location special (Today only)' },
                    { id: 'custom', label: '🎨 Custom Meal', desc: 'Any published dish' },
                  ].map((mode) => (
                    <button
                      type="button"
                      key={mode.id}
                      onClick={() => setOrderMode(mode.id as 'personal' | 'guest' | 'special' | 'custom')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        orderMode === mode.id
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-[#005390] ring-1 ring-[#005390] text-[#005390] dark:text-blue-300'
                          : 'bg-gray-50 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{mode.label}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection if Guest Mode */}
              {orderMode === 'guest' && (
                <div className="bg-blue-50/50 dark:bg-neutral-800/40 p-3.5 rounded-2xl border border-blue-200 dark:border-neutral-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#005390] dark:text-blue-300">
                    <CalendarIcon className="w-4 h-4" /> Guest Meal Pre-Order Date
                  </div>
                  <div>
                    <label
                      htmlFor="guest-order-date"
                      className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-1"
                    >
                      Select Pre-Order Date *
                    </label>
                    <input
                      id="guest-order-date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#005390]"
                    />
                  </div>
                </div>
              )}

              {/* Meal Slot Selector inside Modal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider block">
                    Select Meal Slot
                  </span>
                  {orderMode === 'personal' && (
                    <span className="text-[10px] text-gray-500 font-medium">(Package slots disabled)</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1.5">
                  {availableMealSlots.map((slot) => {
                    const isCoveredInPackage = orderMode === 'personal' && isSlotCoveredInPkg(slot)
                    const isSelected =
                      selectedMealSlotId === slot.id ||
                      selectedMealSlotId === slot.globalMealSlotId ||
                      selectedMealSlotId === slot.key ||
                      exactSlotMatch(slot.label, selectedMealSlotId)

                    return (
                      <button
                        type="button"
                        key={slot.key}
                        disabled={isCoveredInPackage}
                        onClick={() => {
                          if (isCoveredInPackage) {
                            toast.info(`${slot.label} is already included in your active food package.`)
                            return
                          }
                          setSelectedMealSlotId(slot.globalMealSlotId || slot.id || slot.key)
                          setDishQuantities({})
                        }}
                        className={`min-w-[100px] shrink-0 flex flex-col items-center justify-center gap-0.5 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                          isCoveredInPackage
                            ? 'bg-gray-100 dark:bg-neutral-800/40 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-gray-600 opacity-60 cursor-not-allowed'
                            : isSelected
                              ? 'bg-[#005390] text-white border-[#005390] shadow-xs cursor-pointer'
                              : 'bg-gray-50 dark:bg-neutral-800/60 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{slot.icon}</span>
                          <span className="truncate">{slot.label}</span>
                        </div>
                        {isCoveredInPackage ? (
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                            ✓ In Package
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium opacity-80">{slot.startTime}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* All Slots Covered Notice if applicable */}
              {orderMode === 'personal' && availableMealSlots.every((s) => isSlotCoveredInPkg(s)) && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-2xl flex items-start gap-2.5 text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold block">All Daily Slots Included in Package</span>
                    <p className="text-emerald-800 dark:text-emerald-300 text-[11px]">
                      All daily meal slots are already covered under your active food package. You get all your meals
                      automatically!
                    </p>
                  </div>
                </div>
              )}

              {/* 2-Hour Cutoff Deadline Warning Banner */}
              {cutoffInfo.isPassed && (
                <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl flex items-start gap-3 text-red-900 dark:text-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold block">Ordering Deadline Passed</span>
                    <p className="text-red-800 dark:text-red-300">
                      Orders for {cutoffInfo.slotName} ({cutoffInfo.startTime}) must be placed at least 2 hours before
                      start time. Ordering closed at {cutoffInfo.cutoffTimeFormatted}.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Selection Method & Dishes/Slot */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider block">
                  2. Selection Method
                </span>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setSelectionType('dish')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectionType === 'dish'
                        ? 'bg-white dark:bg-neutral-900 text-[#005390] dark:text-blue-300 shadow-xs'
                        : 'text-gray-500'
                    }`}
                  >
                    Specific Dishes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionType('entire_slot')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectionType === 'entire_slot'
                        ? 'bg-white dark:bg-neutral-900 text-[#005390] dark:text-blue-300 shadow-xs'
                        : 'text-gray-500'
                    }`}
                  >
                    Entire Meal Slot
                  </button>
                </div>

                {/* Entire Slot Info Card */}
                {selectionType === 'entire_slot' && (
                  <div className="bg-blue-50/50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-blue-200 dark:border-neutral-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-xs text-[#005390] dark:text-blue-300">
                        Entire {cutoffInfo.slotName} Slot
                      </div>
                      {isSlotIncludedInPackage(selectedMealSlotId || currentActiveSlot) ? (
                        <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                          Included in Package (Free)
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-600 text-white font-bold text-[10px]">
                          Slot Price: ₹{calculatedTotalAmount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Includes all {modalSlotDishes.length} dishes published for {cutoffInfo.slotName} (
                      {cutoffInfo.startTime}).
                    </p>
                  </div>
                )}

                {/* Dish Selection List with Quantity controls */}
                {selectionType === 'dish' && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {orderMode === 'special' ? (
                      specialSlotsData.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400">
                          No special slots configured for location.
                        </div>
                      ) : (
                        specialSlotsData
                          .flatMap((sSlot) => sSlot.specialDishes || [])
                          .map((sDish) => {
                            const dishObj = sDish.dish
                            if (!dishObj) return null
                            const qty = dishQuantities[dishObj.id] || 0
                            const unitPrice = Number(sDish.price || 0)
                            const totalDishPrice = unitPrice * qty

                            return (
                              <div
                                key={sDish.id}
                                className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-neutral-800/60 rounded-xl border border-gray-200 dark:border-neutral-800"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                    {dishObj.name}
                                  </div>
                                  <div className="text-[10px] flex items-center gap-1.5 font-semibold">
                                    <span className="text-amber-600">Special Dish - ₹{unitPrice}</span>
                                    {qty > 0 && (
                                      <span className="text-[#005390] dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md">
                                        Total: ₹{totalDishPrice}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(dishObj.id, -1)}
                                    className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-black w-4 text-center">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(dishObj.id, 1)}
                                    className="w-7 h-7 rounded-lg bg-[#005390] text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )
                          })
                      )
                    ) : modalSlotDishes.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-500">
                        No dishes published for {cutoffInfo.slotName} on{' '}
                        {orderMode === 'personal' ? todayStr : orderDate}.
                      </div>
                    ) : (
                      modalSlotDishes.map((item) => {
                        const dishObj: DishObj = item.dish || (item as unknown as DishObj)
                        const dishId = item.dishId || dishObj.id
                        const qty = dishQuantities[dishId] || 0
                        const isCovered =
                          isSlotIncludedInPackage(selectedMealSlotId || currentActiveSlot) &&
                          (item.isPackageCovered ?? !item.isOptional)
                        const price = isCovered ? 0 : item.effectivePrice || dishObj.basePrice || 0
                        const totalDishPrice = price * qty

                        return (
                          <div
                            key={item.id || dishId}
                            className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-neutral-800/60 rounded-xl border border-gray-200 dark:border-neutral-800"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                {dishObj.name}
                              </div>
                              <div className="text-[10px] flex items-center gap-1.5 font-semibold">
                                <span className="text-gray-500">
                                  {isCovered ? 'Package Covered (₹0)' : `₹${price}`}
                                </span>
                                {qty > 0 && !isCovered && (
                                  <span className="text-[#005390] dark:text-blue-400 font-black bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md">
                                    Total: ₹{totalDishPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateQuantity(dishId, -1)}
                                className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black w-4 text-center">{qty}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(dishId, 1)}
                                className="w-7 h-7 rounded-lg bg-[#005390] text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Service Option Toggle */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider block">
                  3. Service Option
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceType('dine_in')}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      serviceType === 'dine_in'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-[#005390] text-[#005390] dark:text-blue-300 ring-1 ring-[#005390]'
                        : 'bg-gray-50 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-800 text-gray-600'
                    }`}
                  >
                    🍽️ Dine In
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType('room_service')}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      serviceType === 'room_service'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-[#005390] text-[#005390] dark:text-blue-300 ring-1 ring-[#005390]'
                        : 'bg-gray-50 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-800 text-gray-600'
                    }`}
                  >
                    🚪 Room Service
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer & Submission */}
            <div className="px-5 py-3.5 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/80 flex items-center justify-between shrink-0 gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Order Total</span>
                <span className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  {calculatedTotalAmount === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Free (₹0)</span>
                  ) : (
                    <span className="text-[#005390] dark:text-blue-400 font-black">₹{calculatedTotalAmount}</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOrderModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={
                    submittingOrder ||
                    cutoffInfo.isPassed ||
                    (selectionType === 'dish' && Object.keys(dishQuantities).length === 0)
                  }
                  className="bg-[#005390] hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {submittingOrder ? (
                    'Placing Order...'
                  ) : (
                    <>
                      <span>Confirm & Place Order</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-md text-[11px] font-black">
                        {calculatedTotalAmount === 0 ? 'Free' : `₹${calculatedTotalAmount}`}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/80 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#005390]" />
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Order History</h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {_loadingHistory ? (
                <div className="text-center py-10 text-xs text-gray-500 font-medium">Loading order history...</div>
              ) : ordersHistory.length === 0 ? (
                <div className="text-center py-12 space-y-2 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl">
                  <Receipt className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">No orders placed yet</p>
                  <p className="text-[11px] text-gray-400">Your placed food orders will appear here.</p>
                </div>
              ) : (
                ordersHistory.map((order) => {
                  const s = (order.orderStatus || 'placed').toLowerCase()
                  let statusColor = 'bg-amber-100 text-amber-900 border-amber-300'
                  let statusText = 'PLACED'

                  if (s === 'accepted') {
                    statusColor = 'bg-blue-100 text-[#005390] border-blue-300'
                    statusText = 'ORDER ACCEPTED'
                  } else if (s === 'preparing') {
                    statusColor = 'bg-purple-100 text-purple-900 border-purple-300'
                    statusText = 'PREPARING FOOD 🍳'
                  } else if (s === 'ready' || s === 'food_ready') {
                    statusColor = 'bg-indigo-100 text-indigo-900 border-indigo-300'
                    statusText = 'FOOD IS READY 🍽️'
                  } else if (s === 'delivering_to_room') {
                    statusColor = 'bg-amber-100 text-amber-900 border-amber-300'
                    statusText = 'DELIVERING TO ROOM 🛵'
                  } else if (s === 'completed') {
                    statusColor = 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    statusText = 'COMPLETED 🎉'
                  } else if (s === 'delivered') {
                    statusColor = 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    statusText = 'DELIVERED 🎉'
                  } else if (s === 'served') {
                    statusColor = 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    statusText = 'SERVED 🎉'
                  } else if (s === 'cancelled') {
                    statusColor = 'bg-red-100 text-red-900 border-red-300'
                    statusText = 'CANCELLED'
                  }

                  const modeLabel =
                    order.orderType === 'guest'
                      ? '👥 Guest Meal'
                      : order.orderType === 'special'
                        ? '⭐ Special Meal'
                        : order.orderType === 'custom'
                          ? '🎨 Custom Meal'
                          : '🍱 Personal Meal'

                  const serviceLabel = order.serviceType === 'dine_in' ? '🍽️ Dine In' : '🚪 Room Service'

                  const formattedDate = new Date(order.date || order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  const detailsList = order.details || []

                  return (
                    <div
                      key={order.id}
                      className="bg-gray-50/70 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3 shadow-2xs"
                    >
                      {/* Order Header: Mode & Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-gray-900 dark:text-gray-100">{modeLabel}</span>
                          <span className="text-[10px] text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 ${statusColor}`}
                        >
                          {statusText}
                        </Badge>
                      </div>

                      {/* Date & Service Info */}
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-1 border-t border-gray-200/60 dark:border-neutral-800">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-[#005390]" /> {formattedDate}
                        </span>
                        <span>{serviceLabel}</span>
                      </div>

                      {/* Line Items List */}
                      {detailsList.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {detailsList.map((dt) => {
                            const dishName = dt.dish?.name || 'Dish Item'
                            return (
                              <div
                                key={dt.id}
                                className="flex items-center justify-between text-xs bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-neutral-800"
                              >
                                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">
                                  {dishName} <span className="text-gray-400 font-bold">x{dt.quantity}</span>
                                </span>
                                <span className="font-bold text-gray-900 dark:text-gray-100 text-[11px] shrink-0 ml-2">
                                  {dt.isPackageCovered ? 'Included (₹0)' : `₹${dt.amount}`}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900 px-3 py-2 rounded-xl border border-gray-200/80 dark:border-neutral-800">
                          {order.selectionType === 'entire_slot' ? 'Entire Meal Slot Package' : 'Standard Meal Order'}
                        </div>
                      )}

                      {/* Order Footer: Total */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200/80 dark:border-neutral-800 text-xs">
                        <span className="font-bold text-gray-500">Total Amount</span>
                        <span className="font-black text-[#005390] dark:text-blue-400 text-sm">
                          {Number(order.totalAmount) === 0 ? 'Free (₹0)' : `₹${order.totalAmount}`}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/80 flex items-center justify-end shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-xs font-bold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
