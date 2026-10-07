import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, ChevronRight, ClipboardList, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeedbackForms } from '@/hooks/useFeedback'
import { cn } from '@/lib/utils'
import type { FeedbackFormSummary, FeedbackRecipientStatus } from '@/lib/types/feedback'

const HOUR_MS = 60 * 60 * 1000

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

/** "Expires today", "Expires in 3 days", flagged as urgent inside the last 24 hours. */
const expiryLabel = (iso: string): { text: string; urgent: boolean } => {
  const msLeft = new Date(iso).getTime() - Date.now()
  if (msLeft < 24 * HOUR_MS) {
    const hours = Math.max(1, Math.ceil(msLeft / HOUR_MS))
    return { text: `Expires in ${hours} ${hours === 1 ? 'hour' : 'hours'}`, urgent: true }
  }
  const days = Math.ceil(msLeft / (24 * HOUR_MS))
  return { text: `Expires in ${days} days`, urgent: false }
}

const FormCard = ({ form, onOpen }: { form: FeedbackFormSummary; onOpen: () => void }) => {
  const isPending = form.status === 'PENDING'
  const expiry = expiryLabel(form.expiryDate)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-3xl border bg-card p-4 text-left shadow-xs transition-colors hover:bg-muted/40 cursor-pointer"
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
          isPending ? 'bg-[#005390]/10 text-[#005390]' : 'bg-emerald-500/10 text-emerald-600',
        )}
      >
        {isPending ? <ClipboardList className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Feedback request</p>
        <p className="truncate text-sm font-bold text-foreground">{form.title}</p>
        <p className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
          {isPending ? (
            <>
              {form.questionCount} {form.questionCount === 1 ? 'question' : 'questions'} •
              <span className={cn('flex items-center gap-1', expiry.urgent && 'text-rose-500')}>
                <Clock className="h-3 w-3" /> {expiry.text}
              </span>
            </>
          ) : (
            <>Submitted {form.submittedAt ? formatDate(form.submittedAt) : ''}</>
          )}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FeedbackRecipientStatus>('PENDING')
  const pending = useFeedbackForms('PENDING')
  const completed = useFeedbackForms('SUBMITTED')
  const active = tab === 'PENDING' ? pending : completed
  const forms = active.data ?? []

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-xl font-black tracking-tight text-foreground">Notifications</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Feedback requests from your community team</p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {(
          [
            ['PENDING', 'Pending', pending.data?.length],
            ['SUBMITTED', 'Completed', completed.data?.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all cursor-pointer',
              tab === value ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground',
            )}
          >
            {label}
            {!!count && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px]',
                  value === 'PENDING' ? 'bg-rose-500 text-white' : 'bg-muted-foreground/20',
                )}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {active.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-3xl" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">
            {tab === 'PENDING' ? "You're all caught up" : 'No completed feedback yet'}
          </p>
          <p className="max-w-[240px] text-xs text-muted-foreground">
            {tab === 'PENDING' ? 'New feedback requests will appear here.' : 'Forms you submit will be listed here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <FormCard key={form.formId} form={form} onOpen={() => navigate(`/notifications/feedback/${form.formId}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
