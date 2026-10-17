import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarIcon, CheckCircle2, Clock3, Loader2, XCircle } from 'lucide-react'
import axios from 'axios'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { amenityMobileService } from '@/lib/services/amenityService'
import type { L1AmenitySlotItem, L1AmenitySlotsResponse, L1AmenitySummary } from '@/lib/types/amenity'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function todayYmd(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function ymdToDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

function formatDateLabel(dateStr: string): string {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function slotTone(slot: L1AmenitySlotItem): string {
  if (slot.myBooked) return 'border-blue-300 bg-blue-50 text-blue-800'
  if (slot.isPast) return 'border-gray-300 bg-gray-100 text-gray-500'
  if (slot.isBlocked) return 'border-slate-300 bg-slate-100 text-slate-600'
  if (slot.remainingCount > 0) return 'border-emerald-300 bg-emerald-50 text-emerald-800'
  return 'border-amber-300 bg-amber-50 text-amber-800'
}

function slotActionLabel(slot: L1AmenitySlotItem): string {
  if (slot.myBooked) return 'Cancel'
  if (slot.isPast) return 'Past'
  if (slot.isBlocked) return 'Blocked'
  if (slot.remainingCount <= 0) return 'Full'
  return 'Book'
}

type PendingAmenityAction =
  { kind: 'BOOK'; slot: L1AmenitySlotItem } | { kind: 'CANCEL'; slot: L1AmenitySlotItem; bookingId: string }

export default function AmenityDetailPage() {
  const { amenityId } = useParams<{ amenityId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedDate =
    searchParams.get('date') && /^\d{4}-\d{2}-\d{2}$/.test(String(searchParams.get('date')))
      ? String(searchParams.get('date'))
      : todayYmd()

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [loadingAmenity, setLoadingAmenity] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAmenityAction | null>(null)

  const [amenity, setAmenity] = useState<L1AmenitySummary | null>(null)
  const [slots, setSlots] = useState<L1AmenitySlotsResponse | null>(null)

  const setDate = (next: string) => setSearchParams({ date: next }, { replace: true })

  useEffect(() => {
    let ignore = false
    const load = async () => {
      if (!amenityId) return
      try {
        setLoadingAmenity(true)
        const list = await amenityMobileService.listAmenities()
        if (ignore) return
        const found = list.find((item) => item.amenityId === amenityId) || null
        setAmenity(found)
      } catch (error) {
        console.error('Failed to load amenity:', error)
        if (!ignore) toast.error('Failed to load amenity')
      } finally {
        if (!ignore) setLoadingAmenity(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [amenityId])

  useEffect(() => {
    let ignore = false
    const loadSlots = async () => {
      if (!amenityId) return
      if (!amenity?.slotBookable) {
        setSlots(null)
        setLoadingSlots(false)
        return
      }
      try {
        setLoadingSlots(true)
        const data = await amenityMobileService.getAmenitySlots(amenityId, selectedDate)
        if (!ignore) setSlots(data)
      } catch (error) {
        console.error('Failed to load slots:', error)
        if (!ignore) {
          setSlots(null)
          toast.error('Failed to load slots')
        }
      } finally {
        if (!ignore) setLoadingSlots(false)
      }
    }
    void loadSlots()
    return () => {
      ignore = true
    }
  }, [amenityId, amenity?.slotBookable, selectedDate])

  const groupedSlots = useMemo(() => {
    const source = slots?.slots || []
    return {
      MORNING: source.filter((slot) => slot.period === 'MORNING'),
      AFTERNOON: source.filter((slot) => slot.period === 'AFTERNOON'),
      EVENING: source.filter((slot) => slot.period === 'EVENING'),
    }
  }, [slots])

  const pendingActionKey = useMemo(() => {
    if (!pendingAction) return null
    return pendingAction.kind === 'BOOK'
      ? `book:${pendingAction.slot.startMinutes}`
      : `cancel:${pendingAction.bookingId}`
  }, [pendingAction])

  const confirmingAction = Boolean(pendingActionKey && actionBusyKey === pendingActionKey)

  const runAfterActionRefresh = async () => {
    if (!amenityId) return
    const data = await amenityMobileService.getAmenitySlots(amenityId, selectedDate)
    setSlots(data)
  }

  const handleBook = async (slot: L1AmenitySlotItem) => {
    if (!amenityId) return
    const key = `book:${slot.startMinutes}`
    setActionBusyKey(key)
    try {
      const res = await amenityMobileService.bookAmenitySlot(amenityId, {
        date: selectedDate,
        startMinutes: slot.startMinutes,
      })
      if (res.success) {
        toast.success(res.message || `Booked ${slot.startLabel}`)
      } else {
        toast.error(res.message || 'Unable to book slot')
      }
      await runAfterActionRefresh()
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Unable to book slot'
        : 'Unable to book slot'
      toast.error(message)
      await runAfterActionRefresh()
    } finally {
      setActionBusyKey(null)
    }
  }

  const handleCancel = async (bookingId: string, startLabel: string) => {
    if (!amenityId) return
    const key = `cancel:${bookingId}`
    setActionBusyKey(key)
    try {
      const res = await amenityMobileService.cancelAmenityBooking(amenityId, bookingId)
      if (res.success) toast.success(res.message || `Cancelled ${startLabel} booking`)
      else toast.error(res.message || 'Unable to cancel booking')
      await runAfterActionRefresh()
    } catch (error) {
      const message =
        axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Unable to cancel booking'
      toast.error(message)
      await runAfterActionRefresh()
    } finally {
      setActionBusyKey(null)
    }
  }

  const confirmPendingAction = async () => {
    if (!pendingAction) return
    const nextAction = pendingAction
    if (nextAction.kind === 'BOOK') {
      await handleBook(nextAction.slot)
    } else {
      await handleCancel(nextAction.bookingId, nextAction.slot.startLabel)
    }
    setPendingAction(null)
  }

  if (!amenityId) {
    return (
      <div className="space-y-4 pb-8">
        <Card className="rounded-3xl border border-border/60 p-8 text-center">
          <p className="text-xs font-semibold text-muted-foreground">Amenity not found.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/amenities')}
            className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black tracking-tight truncate">{amenity?.name || 'Amenity'}</h2>
            <p className="text-[11px] text-blue-100 font-medium">
              {amenity?.slotBookable ? 'Select date and book a slot' : 'Standard amenity'}
            </p>
          </div>
        </div>
      </div>

      {loadingAmenity ? (
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Loading amenity...</p>
        </Card>
      ) : !amenity ? (
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Amenity not found for your location.</p>
        </Card>
      ) : !amenity.slotBookable ? (
        <Card className="rounded-3xl border border-border/60 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-200 text-slate-800 border-none text-[9px] font-extrabold">Standard</Badge>
              <span className="text-[11px] text-muted-foreground font-semibold">No slot booking required</span>
            </div>
            <p className="text-xs text-foreground font-semibold">
              {amenity.description || 'This amenity is available as a standard facility.'}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {amenity.availableFrom && amenity.availableTo
                ? `Available: ${amenity.availableFrom} - ${amenity.availableTo}`
                : 'Hours are not configured for this amenity yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={(open) => setCalendarOpen(open)}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="flex-1 justify-start rounded-2xl text-[11px] font-bold h-9 text-muted-foreground"
                  />
                }
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {formatDateLabel(selectedDate)}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={ymdToDate(selectedDate)}
                  defaultMonth={ymdToDate(selectedDate)}
                  onSelect={(date) => {
                    if (!date) return
                    setDate(todayYmd(date))
                    setCalendarOpen(false)
                  }}
                  disabled={{ before: ymdToDate(todayYmd()) }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {loadingSlots ? (
            <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
              <p className="text-xs font-semibold">Loading slots...</p>
            </Card>
          ) : !slots ? (
            <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
              <p className="text-xs font-semibold">Unable to load slots for this date.</p>
            </Card>
          ) : !slots.hasSetup ? (
            <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
              <p className="text-xs font-semibold">Slot setup is not configured for this amenity yet.</p>
            </Card>
          ) : slots.dayClosed ? (
            <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
              <p className="text-xs font-semibold">This amenity is closed on {formatDateLabel(selectedDate)}.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map((period) => {
                const rows = groupedSlots[period]
                if (rows.length === 0) return null
                return (
                  <Card key={period} className="rounded-3xl border border-border/60 shadow-sm">
                    <CardContent className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-extrabold text-foreground">{period}</h3>
                        <span className="text-[10px] text-muted-foreground font-semibold">{rows.length} slots</span>
                      </div>

                      <div className="space-y-2">
                        {rows.map((slot) => {
                          const actionKey =
                            slot.myBooked && slot.myBookingId
                              ? `cancel:${slot.myBookingId}`
                              : `book:${slot.startMinutes}`
                          const busy = actionBusyKey === actionKey
                          const canBook = !slot.myBooked && !slot.isPast && !slot.isBlocked && slot.remainingCount > 0
                          const canCancel = Boolean(slot.myBooked && slot.myBookingId)

                          return (
                            <div
                              key={`${slot.startMinutes}-${slot.status}`}
                              className={cn('rounded-2xl border px-3 py-2.5', slotTone(slot))}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-extrabold">
                                    {slot.startLabel} - {slot.endLabel}
                                  </p>
                                  <p className="text-[10px] font-semibold opacity-90">
                                    <Clock3 className="w-3 h-3 inline mr-1" />
                                    {slot.myBooked
                                      ? 'Booked by you'
                                      : `${slot.bookedCount}/${slot.capacity} booked · ${slot.remainingCount} left`}
                                  </p>
                                </div>

                                {canCancel ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={busy}
                                    className="h-8 rounded-xl text-[10px] font-extrabold cursor-pointer border-blue-300 text-blue-700"
                                    onClick={() =>
                                      slot.myBookingId &&
                                      setPendingAction({
                                        kind: 'CANCEL',
                                        slot,
                                        bookingId: slot.myBookingId,
                                      })
                                    }
                                  >
                                    {busy ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    {busy ? 'Cancelling...' : 'Cancel'}
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={!canBook || busy}
                                    className="h-8 rounded-xl text-[10px] font-extrabold cursor-pointer"
                                    onClick={() => setPendingAction({ kind: 'BOOK', slot })}
                                  >
                                    {busy ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    {busy ? 'Booking...' : slotActionLabel(slot)}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !confirmingAction) setPendingAction(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.kind === 'CANCEL' ? 'Cancel booking?' : 'Confirm booking?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction
                ? pendingAction.kind === 'CANCEL'
                  ? `Cancel your ${pendingAction.slot.startLabel} slot booking on ${formatDateLabel(selectedDate)}?`
                  : `Book ${pendingAction.slot.startLabel} to ${pendingAction.slot.endLabel} on ${formatDateLabel(
                      selectedDate,
                    )}?`
                : 'Are you sure?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmingAction}>No, go back</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmingAction}
              className={cn(pendingAction?.kind === 'CANCEL' ? 'bg-rose-600 hover:bg-rose-700 text-white' : '')}
              onClick={() => void confirmPendingAction()}
            >
              {confirmingAction ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Please wait...
                </>
              ) : pendingAction?.kind === 'CANCEL' ? (
                'Yes, cancel booking'
              ) : (
                'Yes, confirm booking'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
