import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { eventMobileService } from '@/lib/services/eventService'
import type { VenueBookingDraft } from '@/lib/types/event'
import {
  buildScheduleOccurrences,
  clearBookingDraft,
  combineDateAndTime,
  formatDisplayDate,
  formatDisplayDateKey,
  formatDisplayTime,
  formatDisplayTimeOfDay,
  getDateKeysInRange,
  loadBookingDraft,
  saveBookingDraft,
} from '@/pages/Events/book/bookingState'
import { toast } from 'sonner'
import axios from 'axios'

const ORANGE = '#F97316'

type ScheduleDayRow = {
  dateKey: string
  dateLabel: string
  startLabel: string
  endLabel: string
  startIso: string
  endIso: string
}

function formatAmount(value: number): string {
  return Number(value || 0).toLocaleString('en-IN')
}

function resolveScheduleDays(draft: VenueBookingDraft): ScheduleDayRow[] {
  const dateKeys = getDateKeysInRange(draft.startDate, draft.endDate)
  const times = draft.scheduleTimes || {}

  if (dateKeys.length > 0) {
    const fromTimes = dateKeys
      .map((dateKey) => {
        const slot = times[dateKey]
        if (slot?.startTime && slot?.endTime) {
          const occurrences = buildScheduleOccurrences([dateKey], { [dateKey]: slot })
          const occ = occurrences[0]
          return {
            dateKey,
            dateLabel: formatDisplayDateKey(dateKey),
            startLabel: formatDisplayTimeOfDay(slot.startTime),
            endLabel: formatDisplayTimeOfDay(slot.endTime),
            startIso: occ?.startDate || '',
            endIso: occ?.endDate || '',
          }
        }
        return null
      })
      .filter((row): row is ScheduleDayRow => row !== null)

    if (fromTimes.length > 0) return fromTimes
  }

  // Legacy single start/end draft fallback
  const startIso = combineDateAndTime(draft.startDate, draft.startTime)
  const endIso = combineDateAndTime(draft.endDate, draft.endTime)
  if (!startIso || !endIso) return []

  return [
    {
      dateKey: draft.startDate,
      dateLabel: formatDisplayDate(startIso),
      startLabel: formatDisplayTime(startIso),
      endLabel: formatDisplayTime(endIso),
      startIso,
      endIso,
    },
  ]
}

export default function EventBookingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const stateDraft = (location.state as { draft?: VenueBookingDraft } | null)?.draft
  const [draft] = useState<VenueBookingDraft | null>(stateDraft || loadBookingDraft())
  const [customRequest, setCustomRequest] = useState(draft?.customRequest || '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!draft?.venueId || !draft.title) {
      toast.error('Please select a venue first')
      navigate('/events/book', { replace: true })
    }
  }, [draft, navigate])

  const scheduleDays = useMemo(() => (draft ? resolveScheduleDays(draft) : []), [draft])

  const costSummary = useMemo(() => {
    const venueCost = Number(draft?.venuePrice ?? 0)
    const serviceLines = (draft?.selectedServices || []).map((svc) => {
      const qty = svc.quantity ?? 1
      const unit = Number(svc.price ?? 0)
      return {
        key: svc.globalServiceId || svc.name,
        name: svc.name,
        amount: unit * qty,
      }
    })
    const servicesTotal = serviceLines.reduce((sum, line) => sum + line.amount, 0)
    return {
      venueCost,
      serviceLines,
      grandTotal: venueCost + servicesTotal,
    }
  }, [draft])

  if (!draft?.venueId) return null

  const addOns = draft.selectedServices || []

  const handleSubmit = async () => {
    if (scheduleDays.length === 0) {
      toast.error('Invalid date/time')
      return
    }
    const schedule = scheduleDays.map((day) => ({
      startDate: day.startIso,
      endDate: day.endIso,
    }))
    const overallStart = schedule[0]!.startDate
    const overallEnd = schedule[schedule.length - 1]!.endDate

    try {
      setSubmitting(true)
      const payload = {
        title: draft.title,
        startDate: overallStart,
        endDate: overallEnd,
        occupancy: draft.occupancy,
        venueId: draft.venueId!,
        schedule,
        ...(addOns.length > 0 ? { selectedServices: addOns } : {}),
        ...(customRequest.trim() ? { customRequest: customRequest.trim() } : {}),
      }
      const res = await eventMobileService.createEventRequest(payload)
      if (!res.success) {
        toast.error(res.message || 'Failed to submit request')
        return
      }
      const requestNumber = res.data?.requestNumber
      clearBookingDraft()
      toast.success(requestNumber ? `Request sent. ID: ${requestNumber}` : res.message || 'Request for quote sent')
      navigate('/events', { replace: true })
    } catch (err) {
      console.error(err)
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to submit request'
        : 'Failed to submit request'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 pb-4 font-sans select-none">
      <div className="bg-white sticky top-0 z-20 -mx-1 px-1 pt-1 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              saveBookingDraft({ ...draft, customRequest })
              navigate(`/events/book/venue/${draft.venueId}`)
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h2 className="flex-1 text-center text-base font-black tracking-tight pr-9">Event Request</h2>
        </div>
      </div>

      <Card className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-black text-gray-900">{draft.venueName || 'Venue'}</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2" style={{ color: ORANGE }}>
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm font-bold text-gray-800">Detailed Schedule</span>
            </div>
            <div className="space-y-2">
              {scheduleDays.map((day) => (
                <div
                  key={day.dateKey}
                  className="rounded-xl bg-gray-50 border-l-4 p-3 space-y-2"
                  style={{ borderLeftColor: ORANGE }}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <CalendarDays className="w-4 h-4 shrink-0" style={{ color: ORANGE }} />
                    <span className="font-semibold">{day.dateLabel}</span>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span>Start: {day.startLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span>End: {day.endLabel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: ORANGE }} />
            <span className="text-base font-bold text-gray-900">{draft.occupancy}</span>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h4 className="text-sm font-bold text-gray-900">Add-On Services</h4>
        {addOns.length === 0 ? (
          <p className="text-xs text-muted-foreground">No services selected</p>
        ) : (
          <div className="space-y-2">
            {addOns.map((svc) => (
              <Card key={svc.globalServiceId || svc.name} className="rounded-xl border border-gray-100">
                <CardContent className="p-3 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{svc.name}</p>
                    {svc.keyFeatures && <p className="text-[11px] text-gray-500 truncate">{svc.keyFeatures}</p>}
                  </div>
                  <span className="text-xs font-bold text-gray-600 shrink-0">Qty: {svc.quantity ?? 1}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-bold text-gray-900">Total Cost</h4>
        <Card className="rounded-xl border border-gray-200 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-700">Venue</span>
              <span className="font-semibold text-gray-900">{formatAmount(costSummary.venueCost)}</span>
            </div>
            {costSummary.serviceLines.map((line) => (
              <div key={line.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-700 truncate">{line.name}</span>
                <span className="font-semibold text-gray-900 shrink-0">{formatAmount(line.amount)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-200 pt-2 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-base font-black text-gray-900">{formatAmount(costSummary.grandTotal)}/-</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-bold text-gray-900">Custom Request</h4>
        <p className="text-xs text-gray-500">
          Add description about your required service (optional). Our agent will get back to you.
        </p>
        <Textarea
          value={customRequest}
          onChange={(e) => setCustomRequest(e.target.value)}
          placeholder="Type here.."
          className="min-h-[96px] rounded-xl bg-gray-50 text-sm resize-none"
        />
      </section>

      <Button
        type="button"
        disabled={submitting}
        onClick={() => void handleSubmit()}
        className="w-full h-12 rounded-2xl text-white font-bold text-sm uppercase tracking-wide"
        style={{ backgroundColor: ORANGE }}
      >
        {submitting ? 'Sending...' : 'Send Request For Quote'}
      </Button>
    </div>
  )
}
