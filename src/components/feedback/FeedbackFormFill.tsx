import { useState } from 'react'
import { Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { FeedbackAnswer, FeedbackQuestion } from '@/lib/types/feedback'

const DEFAULT_RATING_SCALE = 5

type AnswerMap = Record<string, FeedbackAnswer>

const hasAnswer = (q: FeedbackQuestion, a: FeedbackAnswer | undefined): boolean => {
  if (!a) return false
  switch (q.answerType) {
    case 'PARAGRAPH':
      return !!a.answerText?.trim()
    case 'RATING':
      return a.ratingValue != null
    default:
      return (a.selectedOptions?.length ?? 0) > 0
  }
}

interface QuestionInputProps {
  question: FeedbackQuestion
  answer: FeedbackAnswer | undefined
  readOnly: boolean
  onChange: (answer: FeedbackAnswer) => void
}

const QuestionInput = ({ question: q, answer, readOnly, onChange }: QuestionInputProps) => {
  if (q.answerType === 'PARAGRAPH') {
    if (readOnly) {
      return (
        <p className="rounded-2xl bg-muted/50 p-3 text-sm whitespace-pre-wrap">
          {answer?.answerText || <span className="italic text-muted-foreground">No answer</span>}
        </p>
      )
    }
    return (
      <Textarea
        rows={4}
        placeholder="Type your answer"
        value={answer?.answerText ?? ''}
        onChange={(e) => onChange({ questionId: q.id, answerText: e.target.value })}
        className="rounded-2xl text-sm"
      />
    )
  }

  if (q.answerType === 'RATING') {
    const scale = q.ratingScale ?? DEFAULT_RATING_SCALE
    const value = answer?.ratingValue ?? 0
    return (
      <div className="flex flex-wrap items-center gap-1">
        {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            aria-label={`${n} of ${scale}`}
            onClick={() => onChange({ questionId: q.id, ratingValue: n })}
            className="p-0.5 cursor-pointer disabled:cursor-default"
          >
            <Star
              className={cn(
                'h-8 w-8 transition-colors',
                n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40',
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-1 text-xs font-bold text-muted-foreground">
            {value}/{scale}
          </span>
        )}
      </div>
    )
  }

  const isSingle = q.answerType === 'SINGLE_CHOICE'
  const selected = answer?.selectedOptions ?? []
  const toggle = (option: string) => {
    const next = isSingle
      ? [option]
      : selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option]
    onChange({ questionId: q.id, selectedOptions: next })
  }

  return (
    <div className="space-y-2">
      {(q.options ?? []).map((option) => {
        const isOn = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            disabled={readOnly}
            role={isSingle ? 'radio' : 'checkbox'}
            aria-checked={isOn}
            onClick={() => toggle(option)}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left text-sm font-semibold transition-colors cursor-pointer disabled:cursor-default',
              isOn ? 'border-[#005390] bg-[#005390]/5 text-foreground' : 'border-border text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center border-2',
                isSingle ? 'rounded-full' : 'rounded-md',
                isOn ? 'border-[#005390] bg-[#005390] text-white' : 'border-muted-foreground/40',
              )}
            >
              {isOn && (isSingle ? <span className="h-2 w-2 rounded-full bg-white" /> : <Check className="h-3 w-3" />)}
            </span>
            {option}
          </button>
        )
      })}
      {!isSingle && !readOnly && <p className="text-[11px] text-muted-foreground">Select all that apply</p>}
    </div>
  )
}

interface FeedbackFormFillProps {
  questions: FeedbackQuestion[]
  /** Existing answers, shown read-only when `readOnly` is set. */
  initialAnswers?: FeedbackAnswer[]
  readOnly?: boolean
  isSubmitting?: boolean
  onSubmit?: (answers: FeedbackAnswer[]) => void
}

export default function FeedbackFormFill({
  questions,
  initialAnswers = [],
  readOnly = false,
  isSubmitting = false,
  onSubmit,
}: FeedbackFormFillProps) {
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    Object.fromEntries(initialAnswers.map((a) => [a.questionId, a])),
  )
  const [missing, setMissing] = useState<Set<string>>(new Set())

  const setAnswer = (answer: FeedbackAnswer) => {
    setAnswers((prev) => ({ ...prev, [answer.questionId]: answer }))
    setMissing((prev) => {
      if (!prev.has(answer.questionId)) return prev
      const next = new Set(prev)
      next.delete(answer.questionId)
      return next
    })
  }

  const handleSubmit = () => {
    const unanswered = questions.filter((q) => q.isRequired && !hasAnswer(q, answers[q.id])).map((q) => q.id)
    if (unanswered.length > 0) {
      setMissing(new Set(unanswered))
      document.getElementById(`question-${unanswered[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    onSubmit?.(questions.filter((q) => hasAnswer(q, answers[q.id])).map((q) => answers[q.id]!))
  }

  return (
    <div className="space-y-3">
      {questions.map((q, index) => (
        <div
          key={q.id}
          id={`question-${q.id}`}
          className={cn(
            'space-y-3 rounded-3xl border bg-card p-4 shadow-xs transition-colors',
            missing.has(q.id) && 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20',
          )}
        >
          <p className="text-sm font-bold text-foreground">
            {index + 1}. {q.questionText}
            {q.isRequired && <span className="ml-0.5 text-rose-500">*</span>}
          </p>
          <QuestionInput question={q} answer={answers[q.id]} readOnly={readOnly} onChange={setAnswer} />
          {missing.has(q.id) && <p className="text-xs font-semibold text-rose-500">This question is required</p>}
        </div>
      ))}

      {!readOnly && (
        <div className="sticky -bottom-4 -mx-4 bg-background/95 px-4 pt-3 pb-4 backdrop-blur border-t">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-11 w-full rounded-2xl bg-[#005390] text-sm font-black text-white hover:bg-[#004170] cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      )}
    </div>
  )
}
