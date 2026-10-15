import { CalendarClock, HeartPulse, NotebookPen, Pill, ShieldAlert, Syringe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getDiagnosisConditionOption } from '@/lib/constants/diagnosis'
import type { ConsultantAllergy, ConsultantVital, DiagnosisCondition, DiagnosisFile } from '@/lib/types/diagnosis'
import type { ResidentInsulin } from '@/lib/types/insulin'
import type { ResidentMedication } from '@/lib/types/medication'
import DiagnosisFileList from './DiagnosisFileList'
import { formatMedicationSummary, formatRecordedAt } from './diagnosisFormat'

const sectionCardClass = 'rounded-3xl border border-border/60 bg-card shadow-sm'
const itemClass = 'rounded-2xl border border-border/60 bg-muted/20 p-3'

function EmptyLine() {
  return <p className="text-xs text-muted-foreground font-medium">None</p>
}

export function ConditionBadge({ condition }: { condition: DiagnosisCondition | null | undefined }) {
  const option = getDiagnosisConditionOption(condition)
  if (!option) return null
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card px-4 py-3">
      <span className="text-sm font-black text-foreground">Condition</span>
      <Badge variant="outline" className={`text-[10px] font-extrabold ${option.badgeClassName}`}>
        {option.label}
      </Badge>
    </div>
  )
}

export function AllergiesSection({ items, title = 'Allergies' }: { items: ConsultantAllergy[]; title?: string }) {
  return (
    <Card className={sectionCardClass}>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          {title}
        </h3>
        {items.length === 0 ? (
          <EmptyLine />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className={itemClass}>
                <p className="text-sm font-bold text-foreground">{item.name}</p>
                {item.note && <p className="text-[11px] text-muted-foreground mt-0.5">{item.note}</p>}
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" />
                  {formatRecordedAt(item.recordedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function VitalsSection({ items, title = 'Vitals' }: { items: ConsultantVital[]; title?: string }) {
  return (
    <Card className={sectionCardClass}>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-emerald-500" />
          {title}
        </h3>
        {items.length === 0 ? (
          <EmptyLine />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className={itemClass}>
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-sm font-bold text-foreground truncate">
                    {item.name}
                    {item.value
                      ? `: ${item.value}${item.unit ? ` ${item.unit}` : ''}`
                      : item.unit
                        ? ` (${item.unit})`
                        : ''}
                  </p>
                </div>
                {item.note && <p className="text-[11px] text-muted-foreground mt-0.5 pl-6">{item.note}</p>}
                <p className="text-[10px] text-muted-foreground mt-1 pl-6 flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" />
                  {formatRecordedAt(item.recordedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MedicineList({ items }: { items: ResidentMedication[] }) {
  if (items.length === 0) return <EmptyLine />
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className={itemClass}>
          <p className="text-sm font-bold text-foreground">{item.medicineName}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{formatMedicationSummary(item)}</p>
          {item.note && <p className="text-[11px] text-muted-foreground mt-0.5">{item.note}</p>}
        </div>
      ))}
    </div>
  )
}

export function MedicationSection({ items, title = 'Medication' }: { items: ResidentMedication[]; title?: string }) {
  return (
    <Card className={sectionCardClass}>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <Pill className="w-4 h-4 text-sky-500" />
          {title}
        </h3>
        <MedicineList items={items} />
      </CardContent>
    </Card>
  )
}

export function InsulinSection({ items, title = 'Insulin' }: { items: ResidentInsulin[]; title?: string }) {
  return (
    <Card className={sectionCardClass}>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <Syringe className="w-4 h-4 text-sky-500" />
          {title}
        </h3>
        <MedicineList items={items} />
      </CardContent>
    </Card>
  )
}

export function NoteSection({
  id,
  note,
  attachments,
  voiceNotes,
}: {
  id: string
  note: string | null | undefined
  attachments: DiagnosisFile[]
  voiceNotes: DiagnosisFile[]
}) {
  return (
    <div className="space-y-1.5 px-0.5">
      <Label htmlFor={id} className="text-sm font-black text-foreground flex items-center gap-2">
        <NotebookPen className="w-4 h-4 text-sky-500" />
        Note
      </Label>
      <Textarea
        id={id}
        value={note || 'None'}
        readOnly
        disabled
        className="rounded-2xl min-h-[100px] bg-card border-border/60"
      />
      <DiagnosisFileList attachments={attachments} voiceNotes={voiceNotes} />
    </div>
  )
}
