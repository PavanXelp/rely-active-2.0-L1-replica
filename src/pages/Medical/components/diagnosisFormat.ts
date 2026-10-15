import type { ResidentMedication } from '@/lib/types/medication'

export function formatRecordedAt(value: string): string {
  try {
    return new Date(value).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return value
  }
}

export function formatMedDate(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

export function formatMedicationSummary(med: ResidentMedication): string {
  const selected = (med.timings || []).filter((t) => t.selected)
  const slots = selected.map((t) => t.timeOfDay).join(', ')
  if (med.isUntilDischarge) {
    return `${formatMedDate(med.startDate)} → Until discharge${slots ? ` · ${slots}` : ''}`
  }
  return `${formatMedDate(med.startDate)} – ${formatMedDate(med.endDate)}${slots ? ` · ${slots}` : ''}`
}
