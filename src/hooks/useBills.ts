import { useQuery } from '@tanstack/react-query'
import { billingService } from '@/lib/services/billingService'
import { useAuthStore } from '@/lib/stores/auth-store'

export const useBills = (page = 1) => {
  const signedIn = !!useAuthStore((state) => state.token)
  return useQuery({
    queryKey: ['bills', page],
    queryFn: () => billingService.getBills(page),
    enabled: signedIn,
    retry: false,
  })
}
