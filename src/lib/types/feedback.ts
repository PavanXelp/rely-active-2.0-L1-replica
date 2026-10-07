export type FeedbackAnswerType = 'PARAGRAPH' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING'
export type FeedbackRecipientStatus = 'PENDING' | 'SUBMITTED'

export interface Advertisement {
  id: string
  title: string
  description: string | null
  imageUrl: string
  createdAt: string
}

/** A form in the notifications list. */
export interface FeedbackFormSummary {
  formId: string
  title: string
  expiryDate: string
  sentAt: string | null
  questionCount: number
  status: FeedbackRecipientStatus
  submittedAt: string | null
}

export interface FeedbackQuestion {
  id: string
  questionText: string
  answerType: FeedbackAnswerType
  options: string[] | null
  ratingScale: number | null
  isRequired: boolean
}

export interface FeedbackAnswer {
  questionId: string
  answerText?: string | null
  selectedOptions?: string[] | null
  ratingValue?: number | null
}

export interface FeedbackFormDetail {
  formId: string
  title: string
  expiryDate: string
  isExpired: boolean
  status: FeedbackRecipientStatus
  submittedAt: string | null
  questions: FeedbackQuestion[]
  /** This person's answers; empty until they submit. */
  answers: FeedbackAnswer[]
}
