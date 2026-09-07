import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { eventMobileService } from '@/lib/services/eventService'
import type { L1EventRequest } from '@/lib/types/event'
import { toast } from 'sonner'

const ORANGE = '#F97316'

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

function formatAmount(value: number): string {
  return Number(value || 0).toLocaleString('en-IN')
}

function statusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case 'OPEN':
      return 'Open'
    case 'IN_PROGRESS':
      return 'In-Progress'
    case 'CLOSED':
      return 'Confirm'
    case 'REJECTED':
      return 'Rejected'
    case 'CANCELLED':
      return 'Canceled'
    default:
      return status || '—'
  }
}

function statusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case 'CLOSED':
      return 'bg-emerald-100 text-emerald-800'
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-800'
    case 'IN_PROGRESS':
      return 'bg-sky-100 text-sky-800'
    case 'OPEN':
    default:
      return 'bg-amber-100 text-amber-800'
  }
}

export default function EventRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const [request, setRequest] = useState<L1EventRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!requestId) return
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const data = await eventMobileService.getMyEventRequestById(requestId)
        if (!ignore) setRequest(data)
      } catch (err) {
        console.error(err)
        if (!ignore) {
          toast.error('Failed to load booking details')
          setRequest(null)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [requestId])

  const scheduleDays = useMemo(() => {
    if (!request) return []
    if (Array.isArray(request.schedule) && request.schedule.length > 0) {
      return request.schedule.map((slot) => ({
        key: `${slot.startDate}-${slot.endDate}`,
        dateLabel: formatDate(slot.startDate),
        startLabel: formatTime(slot.startDate),
        endLabel: formatTime(slot.endDate),
      }))
    }
    return [
      {
        key: 'overall',
        dateLabel: formatDate(request.startDate),
        startLabel: formatTime(request.startDate),
        endLabel: formatTime(request.endDate),
      },
    ]
  }, [request])

  const costSummary = useMemo(() => {
    const venueCost = Number(request?.venue?.price ?? 0)
    const serviceLines = (request?.selectedServices || []).map((svc) => {
      const qty = svc.quantity ?? 1
      const unit = Number(svc.price ?? 0)
      return {
        key: svc.globalServiceId || svc.name,
        name: svc.name,
        amount: unit * qty,
      }
    })
    const servicesTotal = serviceLines.reduce((sum, line) => sum + line.amount, 0)
    const computedTotal = venueCost + servicesTotal
    return {
      venueCost,
      serviceLines,
      grandTotal:
        request?.totalCost != null && !Number.isNaN(Number(request.totalCost))
          ? Number(request.totalCost)
          : computedTotal,
    }
  }, [request])

  return (
    <div className="space-y-5 pb-8 font-sans select-none">
      <div className="bg-white sticky top-0 z-20 -mx-1 px-1 pt-1 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h2 className="flex-1 text-center text-base font-black tracking-tight pr-9">Booking Details</h2>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-2xl p-6 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Loading booking...</p>
        </Card>
      ) : !request ? (
        <Card className="rounded-2xl p-6 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Booking not found</p>
        </Card>
      ) : (
        <>
          <Card className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-gray-900 truncate">{request.title}</h3>
                  {request.requestNumber && (
                    <p className="text-[11px] font-mono text-gray-500 mt-0.5">{request.requestNumber}</p>
                  )}
                </div>
                <Badge className={`${statusBadgeClass(request.status)} border-none shrink-0`}>
                  {statusLabel(request.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: ORANGE }} />
                <span className="font-semibold">{request.venue?.name || 'Venue'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="w-4 h-4 shrink-0" style={{ color: ORANGE }} />
                <span className="font-semibold">{request.occupancy} people</span>
              </div>

              {request.status?.toUpperCase() === 'IN_PROGRESS' && request.meetingScheduledAt && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700">Scheduled Meeting</p>
                  <div className="flex items-center gap-2 text-sm text-sky-900">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">
                      {formatDate(request.meetingScheduledAt)} · {formatTime(request.meetingScheduledAt)}
                    </span>
                  </div>
                </div>
              )}

              {request.status?.toUpperCase() === 'CANCELLED' && request.cancellationReason?.trim() && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Reason for Cancellation</p>
                  <p className="text-sm font-semibold text-rose-900 whitespace-pre-wrap">
                    {request.cancellationReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <section className="space-y-2">
            <div className="flex items-center gap-2" style={{ color: ORANGE }}>
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm font-bold text-gray-800">Detailed Schedule</span>
            </div>
            <div className="space-y-2">
              {scheduleDays.map((day) => (
                <div
                  key={day.key}
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
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-gray-900">Add-On Services</h4>
            {!request.selectedServices || request.selectedServices.length === 0 ? (
              <p className="text-xs text-muted-foreground">No services selected</p>
            ) : (
              <div className="space-y-2">
                {request.selectedServices.map((svc) => (
                  <Card key={svc.globalServiceId || svc.name} className="rounded-xl border border-gray-100">
                    <CardContent className="p-3 flex justify-between items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{svc.name}</p>
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

          {request.customRequest?.trim() && (
            <section className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Custom Request</h4>
              <Card className="rounded-xl border border-gray-100">
                <CardContent className="p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.customRequest}</p>
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  )
}
