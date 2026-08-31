import { useEffect, useState } from 'react'
import { Utensils, Calendar as CalendarIcon, Sparkles, ShoppingBag, CheckCircle2, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'

interface MenuItem {
  menuItemId: string
  dishId: string
  name: string
  category: string
  dietaryType: string
  description?: string
  imageUrl?: string
  mealSlot: 'breakfast' | 'lunch' | 'snacks' | 'dinner'
  isOptional: boolean
  notes?: string
  standardPrice: number
  extraPrice: number
  effectivePrice: number
  isPackageCovered: boolean
}

interface MenuResponse {
  date: string
  resident: {
    id: string
    name: string
    unitNumber?: string
  }
  subscription?: {
    name: string
    includedSlots: string[]
  } | null
  menu: {
    breakfast: MenuItem[]
    lunch: MenuItem[]
    snacks: MenuItem[]
    dinner: MenuItem[]
  }
}

export default function FnbPage() {
  const resident = useAuthStore((state) => state.resident)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [activeSlot, setActiveSlot] = useState<'breakfast' | 'lunch' | 'snacks' | 'dinner'>('breakfast')
  const [loading, setLoading] = useState(false)
  const [menuData, setMenuData] = useState<MenuResponse | null>(null)
  const [orderedDishIds, setOrderedDishIds] = useState<string[]>([])

  useEffect(() => {
    let ignore = false
    const fetchDailyMenu = async (dStr: string) => {
      try {
        setLoading(true)
        const res = await api.get(`/mobile/fnb/menu?date=${dStr}`)
        if (!ignore) {
          if (res.data?.success && res.data?.data) {
            setMenuData(res.data.data)
          } else {
            setMenuData(null)
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error('Failed to load resident FnB menu:', err)
          toast.error('Failed to load food menu')
          setMenuData(null)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void fetchDailyMenu(selectedDate)

    return () => {
      ignore = true
    }
  }, [selectedDate])

  const handlePlaceOrder = async (item: MenuItem) => {
    try {
      const res = await api.post('/mobile/fnb/order', {
        menuItemId: item.menuItemId,
        mealSlot: item.mealSlot,
        date: selectedDate,
        quantity: 1,
      })
      if (res.data?.success) {
        toast.success(`Ordered ${item.name} for ${item.mealSlot.toUpperCase()}`)
        setOrderedDishIds((prev) => [...prev, item.menuItemId])
      } else {
        toast.error(res.data?.message || 'Failed to place order')
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      console.error('Order placement error:', err)
      toast.error(msg || 'Failed to place order')
    }
  }

  // Generate date carousel items (3 days before, today, 3 days after)
  const getCarouselDates = () => {
    const dates = []
    const ref = new Date(selectedDate)
    for (let i = -2; i <= 4; i++) {
      const d = new Date(ref)
      d.setDate(d.getDate() + i)
      const dStr = d.toISOString().split('T')[0]
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNum = d.getDate()
      dates.push({ dateStr: dStr, dayName, dayNum })
    }
    return dates
  }

  const carouselDates = getCarouselDates()
  const todayStr = new Date().toISOString().split('T')[0]

  const currentSlotDishes: MenuItem[] = menuData?.menu?.[activeSlot] || []

  return (
    <div className="space-y-5 pb-6 select-none font-sans">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-[#005390] to-blue-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-2.5 py-0.5 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 mr-1 text-amber-300" /> Food & Beverage
            </Badge>

            {menuData?.subscription ? (
              <span className="text-[10px] font-extrabold bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-400/30">
                <Award className="w-3 h-3" /> Meal Package Active
              </span>
            ) : (
              <span className="text-[10px] font-medium text-blue-200">Standard Order Mode</span>
            )}
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight">Hello, {resident?.firstName || 'Resident'}! 👋</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Explore today's freshly prepared meals served at your community.
            </p>
          </div>
        </div>
      </div>

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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {carouselDates.map((item) => {
            const isSelected = selectedDate === item.dateStr
            const isToday = item.dateStr === todayStr

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => setSelectedDate(item.dateStr)}
                className={`flex flex-col items-center justify-center p-3 min-w-[62px] rounded-2xl transition-all cursor-pointer border text-center shrink-0 ${
                  isSelected
                    ? 'bg-[#005390] text-white border-[#005390] shadow-md scale-105 ring-2 ring-blue-200'
                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  {item.dayName}
                </span>
                <span
                  className={`text-lg font-black my-0.5 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                >
                  {item.dayNum < 10 ? `0${item.dayNum}` : item.dayNum}
                </span>
                {isToday && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-blue-800 text-white' : 'bg-blue-100 text-[#005390]'}`}
                  >
                    Today
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Meal Slot Tabs Bar */}
      <div className="grid grid-cols-4 gap-1.5 bg-gray-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800">
        {(
          [
            { id: 'breakfast', label: 'Morning', icon: '🌅' },
            { id: 'lunch', label: 'Lunch', icon: '☀️' },
            { id: 'snacks', label: 'Snacks', icon: '🌇' },
            { id: 'dinner', label: 'Dinner', icon: '🌙' },
          ] as const
        ).map((slot) => (
          <button
            key={slot.id}
            type="button"
            onClick={() => setActiveSlot(slot.id)}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeSlot === slot.id
                ? 'bg-white dark:bg-slate-800 text-[#005390] dark:text-blue-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="text-base">{slot.icon}</span>
            <span className="truncate text-[11px]">{slot.label}</span>
          </button>
        ))}
      </div>

      {/* Dishes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            {activeSlot} Menu ({currentSlotDishes.length} Dish{currentSlotDishes.length !== 1 ? 'es' : ''})
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400 italic">Loading food menu...</div>
        ) : currentSlotDishes.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 space-y-2">
            <Utensils className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-500">No dishes published for {activeSlot.toUpperCase()}</p>
            <p className="text-[11px] text-gray-400">Check another meal slot or select a different date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentSlotDishes.map((item) => {
              const isOrdered = orderedDishIds.includes(item.menuItemId)

              return (
                <div
                  key={item.menuItemId}
                  className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{item.name}</span>
                      {item.isPackageCovered && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-none text-[9px] font-black shrink-0">
                          Included
                        </Badge>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-500 capitalize flex items-center gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">
                        {item.isPackageCovered ? 'FREE (Covered)' : `₹${item.effectivePrice}`}
                      </span>
                    </div>

                    {item.notes && <p className="text-[10px] text-gray-400 italic line-clamp-1">Note: {item.notes}</p>}
                  </div>

                  <Button
                    type="button"
                    disabled={isOrdered}
                    onClick={() => handlePlaceOrder(item)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                      isOrdered
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-[#005390] hover:bg-blue-600 text-white shadow-xs'
                    }`}
                  >
                    {isOrdered ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ordered
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5" /> Order
                      </span>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
