import { CheckCircle2, ChevronRight, Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { L1MyBooking } from '@/lib/types/appointment'
import { formatDateLabel, formatDateTime, formatTimeRange } from './bookingFormat'

export function BookingCard({
  booking,
  clickable,
  onClick,
  diagnosed,
}: {
  booking: L1MyBooking
  clickable?: boolean
  onClick?: () => void
  diagnosed?: boolean
}) {
  const content = (
    <CardContent className="p-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{booking.doctorName}</h4>
          <p className="text-[11px] text-muted-foreground font-medium">
            {booking.shiftName} · {formatDateLabel(booking.appointmentDate)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-none text-[9px] font-extrabold">
            {diagnosed ? 'DIAGNOSED' : booking.status}
          </Badge>
          {clickable && <ChevronRight className="w-4 h-4 text-gray-300" />}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-semibold">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTimeRange(booking.slotTimeRange)}
        </span>
        <span className="inline-flex items-center gap-1">
          <User className="w-3 h-3" />
          {booking.memberName}
          {booking.memberRelation ? ` · ${booking.memberRelation}` : ''}
        </span>
        {diagnosed && booking.attendedAt && (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-teal-500" />
            Diagnosed {formatDateTime(booking.attendedAt)}
          </span>
        )}
      </div>
    </CardContent>
  )

  if (clickable && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-3xl border border-teal-200/60 dark:border-teal-900/40 bg-white dark:bg-slate-900 shadow-sm hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors cursor-pointer"
      >
        {content}
      </button>
    )
  }

  return (
    <Card className="rounded-3xl border border-teal-200/60 dark:border-teal-900/40 bg-white dark:bg-slate-900 shadow-sm">
      {content}
    </Card>
  )
}

export default BookingCard
