import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import FeedbackFormFill from '@/components/feedback/FeedbackFormFill'
import { useFeedbackForm, useSubmitFeedback, type ApiError } from '@/hooks/useFeedback'
import type { FeedbackAnswer } from '@/lib/types/feedback'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

export default function FeedbackFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: form, isLoading, isError } = useFeedbackForm(id)
  const submit = useSubmitFeedback(id ?? '')

  const back = () => navigate('/notifications')

  const handleSubmit = (answers: FeedbackAnswer[]) => {
    submit.mutate(answers, {
      onSuccess: (res) => {
        toast.success(res.message || 'Thank you! Your feedback has been submitted.')
        back()
      },
      onError: (error: ApiError) => {
        toast.error(error?.response?.data?.message || error.message || 'Could not submit your feedback')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    )
  }

  if (isError || !form) {
    return (
      <div className="space-y-3 py-14 text-center">
        <p className="text-sm font-bold text-foreground">This feedback form is no longer available.</p>
        <Button variant="outline" onClick={back} className="rounded-2xl cursor-pointer">
          Back to Notifications
        </Button>
      </div>
    )
  }

  const isSubmitted = form.status === 'SUBMITTED'
  const canAnswer = !isSubmitted && !form.isExpired

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={back}
          className="h-8 w-8 shrink-0 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-lg font-black leading-tight text-foreground">{form.title}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Clock className="h-3 w-3" /> Open until {formatDate(form.expiryDate)}
          </p>
        </div>
      </div>

      {isSubmitted && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          You submitted this feedback{form.submittedAt ? ` on ${formatDate(form.submittedAt)}` : ''}. Thank you!
        </div>
      )}
      {!isSubmitted && form.isExpired && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <Lock className="h-4 w-4 shrink-0" />
          This form has expired and can no longer be submitted.
        </div>
      )}

      <FeedbackFormFill
        questions={form.questions}
        initialAnswers={form.answers}
        readOnly={!canAnswer}
        isSubmitting={submit.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
