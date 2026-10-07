import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feedbackService } from '@/lib/services/feedbackService'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { FeedbackAnswer, FeedbackRecipientStatus } from '@/lib/types/feedback'

export type ApiError = { response?: { status?: number; data?: { message?: string } }; message?: string }

const useIsSignedIn = () => !!useAuthStore((state) => state.token)

export const useAdvertisements = () => {
  const signedIn = useIsSignedIn()
  return useQuery({
    queryKey: ['advertisements'],
    queryFn: feedbackService.getAdvertisements,
    enabled: signedIn,
    staleTime: 5 * 60_000,
  })
}

export const useFeedbackForms = (status: FeedbackRecipientStatus) => {
  const signedIn = useIsSignedIn()
  return useQuery({
    queryKey: ['feedback-forms', status],
    queryFn: () => feedbackService.getForms(status),
    enabled: signedIn,
    // Keeps the notifications badge reasonably fresh without a push channel.
    refetchInterval: status === 'PENDING' ? 60_000 : false,
  })
}

/** Number of forms still waiting for an answer, for the notifications badge. */
export const usePendingFeedbackCount = () => useFeedbackForms('PENDING').data?.length ?? 0

export const useFeedbackForm = (id: string | undefined) =>
  useQuery({
    queryKey: ['feedback-form', id],
    queryFn: () => feedbackService.getForm(id!),
    enabled: !!id,
  })

export const useSubmitFeedback = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answers: FeedbackAnswer[]) => feedbackService.submitForm(id, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-forms'] })
      queryClient.invalidateQueries({ queryKey: ['feedback-form', id] })
    },
    onError: (error: ApiError) => {
      // 409: the form changed or was already answered; reload it so the screen shows the current version.
      if (error?.response?.status === 409) {
        queryClient.invalidateQueries({ queryKey: ['feedback-form', id] })
        queryClient.invalidateQueries({ queryKey: ['feedback-forms'] })
      }
    },
  })
}
