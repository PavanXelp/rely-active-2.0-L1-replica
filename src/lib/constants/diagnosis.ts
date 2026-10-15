import type { DiagnosisCondition } from '@/lib/types/diagnosis'

export interface DiagnosisConditionOption {
  value: DiagnosisCondition
  label: string
  badgeClassName: string
}

export const DIAGNOSIS_CONDITION_OPTIONS: DiagnosisConditionOption[] = [
  {
    value: 'CRITICAL',
    label: 'Critical',
    badgeClassName: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
  },
  {
    value: 'STABLE',
    label: 'Stable',
    badgeClassName: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
  },
  {
    value: 'RECOVERING',
    label: 'Recovering',
    badgeClassName:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  },
  {
    value: 'GOOD',
    label: 'Good',
    badgeClassName:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  },
]

export function getDiagnosisConditionOption(
  value: DiagnosisCondition | null | undefined,
): DiagnosisConditionOption | null {
  if (!value) return null
  return DIAGNOSIS_CONDITION_OPTIONS.find((opt) => opt.value === value) || null
}
