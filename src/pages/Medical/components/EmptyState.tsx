import { CalendarDays, Stethoscope } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function EmptyState({
  title,
  description,
  icon = 'calendar',
}: {
  title: string
  description: string
  icon?: 'calendar' | 'stethoscope'
}) {
  return (
    <Card className="rounded-3xl border border-border/60 p-8 text-center space-y-2">
      {icon === 'stethoscope' ? (
        <Stethoscope className="w-10 h-10 mx-auto text-teal-300" />
      ) : (
        <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40" />
      )}
      <h4 className="font-bold text-sm text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  )
}

export default EmptyState
