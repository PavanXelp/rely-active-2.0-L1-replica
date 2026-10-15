import { CalendarClock, NotebookPen, Stethoscope } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getDiagnosisConditionOption } from '@/lib/constants/diagnosis'
import type { MedicalHistoryDoctorNote } from '@/lib/types/medicalHistory'
import DiagnosisFileList from './DiagnosisFileList'
import { formatMedDate, formatRecordedAt } from './diagnosisFormat'

export function DoctorNotesSection({
  notes,
  title = 'Previous Doctor Notes',
}: {
  notes: MedicalHistoryDoctorNote[]
  title?: string
}) {
  return (
    <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-sky-500" />
          {title}
        </h3>
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground font-medium">None</p>
        ) : (
          <div className="space-y-2">
            {notes.map((item) => {
              const condition = getDiagnosisConditionOption(item.condition)
              return (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5 min-w-0">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span className="truncate">{item.doctorName || 'Doctor'}</span>
                    </p>
                    {condition && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-extrabold shrink-0 ${condition.badgeClassName}`}
                      >
                        {condition.label}
                      </Badge>
                    )}
                  </div>
                  {item.note && <p className="text-xs text-foreground/90 whitespace-pre-line">{item.note}</p>}
                  <DiagnosisFileList attachments={item.attachments} voiceNotes={item.voiceNotes} />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    {item.completedAt ? formatRecordedAt(item.completedAt) : formatMedDate(item.appointmentDate)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DoctorNotesSection
