import { useEffect, useMemo, useState } from 'react'
import { CalendarIcon, Clock, Loader2, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { medicalHistoryService } from '@/lib/services/medicalHistoryService'
import type { MedicalHistoryDayDiagnosis, MedicalHistoryLatest } from '@/lib/types/medicalHistory'
import { toast } from 'sonner'
import { formatDateLabel, formatTimeRange, todayYmd, ymdToDate } from './bookingFormat'
import { formatRecordedAt } from './diagnosisFormat'
import {
  AllergiesSection,
  ConditionBadge,
  InsulinSection,
  MedicationSection,
  NoteSection,
  VitalsSection,
} from './DiagnosisSections'
import { DoctorNotesSection } from './DoctorNotesSection'
import { EmptyState } from './EmptyState'

function LoadingCard() {
  return (
    <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
      <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-[#005390]" />
      <p className="text-xs font-semibold">Loading...</p>
    </Card>
  )
}

function DayDiagnosis({ diagnosis }: { diagnosis: MedicalHistoryDayDiagnosis }) {
  return (
    <div className="space-y-3">
      <Card className="rounded-3xl border border-teal-200/60 dark:border-teal-900/40 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{diagnosis.doctorName}</h4>
            <p className="text-[11px] text-muted-foreground font-semibold flex flex-wrap items-center gap-x-2">
              {diagnosis.slotTimeRange && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeRange(diagnosis.slotTimeRange)}
                </span>
              )}
              {diagnosis.completedAt && <span>Diagnosed {formatRecordedAt(diagnosis.completedAt)}</span>}
            </p>
          </div>
        </CardContent>
      </Card>
      <ConditionBadge condition={diagnosis.condition} />
      <AllergiesSection items={diagnosis.allergies} title="Allergic Info" />
      <VitalsSection items={diagnosis.vitals} />
      <MedicationSection items={diagnosis.medications} />
      <InsulinSection items={diagnosis.insulin} />
      <NoteSection
        id={`diagnosis-note-${diagnosis.id}`}
        note={diagnosis.note}
        attachments={diagnosis.attachments}
        voiceNotes={diagnosis.voiceNotes}
      />
    </div>
  )
}

export function MedicalHistoryTab() {
  const [latest, setLatest] = useState<MedicalHistoryLatest | null>(null)
  const [loadingLatest, setLoadingLatest] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayDiagnoses, setDayDiagnoses] = useState<MedicalHistoryDayDiagnosis[]>([])
  const [loadingDay, setLoadingDay] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoadingLatest(true)
        const data = await medicalHistoryService.getLatest()
        if (!ignore) setLatest(data)
      } catch (err) {
        console.error('Failed to load medical history:', err)
        if (!ignore) toast.error('Failed to load medical history')
      } finally {
        if (!ignore) setLoadingLatest(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    let ignore = false
    const load = async () => {
      try {
        setLoadingDay(true)
        const data = await medicalHistoryService.getByDate(selectedDate)
        if (!ignore) setDayDiagnoses(data.diagnoses)
      } catch (err) {
        console.error('Failed to load diagnoses for date:', err)
        if (!ignore) {
          setDayDiagnoses([])
          toast.error('Failed to load diagnoses for this date')
        }
      } finally {
        if (!ignore) setLoadingDay(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [selectedDate])

  const diagnosisDates = useMemo(() => (latest?.diagnosisDates || []).map(ymdToDate), [latest])

  const latestIsEmpty =
    !!latest &&
    !latest.currentCondition &&
    latest.allergies.length === 0 &&
    latest.doctorNotes.length === 0 &&
    latest.vitals.length === 0 &&
    latest.medications.length === 0 &&
    latest.insulin.length === 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedDate(null)}
          className={`px-3.5 py-2 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
            !selectedDate
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 border border-border text-muted-foreground'
          }`}
        >
          Latest
        </button>
        <Popover open={calendarOpen} onOpenChange={(open) => setCalendarOpen(open)}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className={`flex-1 justify-start rounded-2xl text-[11px] font-bold h-9 ${
                  selectedDate ? 'border-teal-500 text-teal-700 dark:text-teal-300' : 'text-muted-foreground'
                }`}
              />
            }
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {selectedDate ? formatDateLabel(selectedDate) : 'Pick a date'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate ? ymdToDate(selectedDate) : undefined}
              onSelect={(date) => {
                if (!date) return
                setSelectedDate(todayYmd(date))
                setCalendarOpen(false)
              }}
              disabled={{ after: new Date() }}
              modifiers={{ hasDiagnosis: diagnosisDates }}
              modifiersClassNames={{
                hasDiagnosis:
                  '[&_button]:font-black [&_button]:text-teal-600 dark:[&_button]:text-teal-400 [&_button]:underline [&_button]:underline-offset-4',
              }}
            />
            <p className="px-3 pb-3 text-[10px] text-muted-foreground font-semibold">
              Underlined dates have a completed diagnosis.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      {selectedDate ? (
        <>
          <h3 className="text-xs font-extrabold text-foreground px-1">Diagnosis on {formatDateLabel(selectedDate)}</h3>
          {loadingDay ? (
            <LoadingCard />
          ) : dayDiagnoses.length === 0 ? (
            <EmptyState icon="stethoscope" title="No Diagnosis" description="No diagnosis recorded on this date." />
          ) : (
            <div className="space-y-6">
              {dayDiagnoses.map((diagnosis) => (
                <DayDiagnosis key={diagnosis.id} diagnosis={diagnosis} />
              ))}
            </div>
          )}
        </>
      ) : loadingLatest ? (
        <LoadingCard />
      ) : !latest || latestIsEmpty ? (
        <EmptyState
          icon="stethoscope"
          title="No Medical History Yet"
          description="Your diagnoses will appear here once a doctor completes them."
        />
      ) : (
        <>
          <ConditionBadge condition={latest.currentCondition?.condition} />
          <AllergiesSection items={latest.allergies} title="Allergic Info" />
          <DoctorNotesSection notes={latest.doctorNotes} />
          <VitalsSection items={latest.vitals} title="Recent Vitals" />
          <MedicationSection items={latest.medications} />
          <InsulinSection items={latest.insulin} />
        </>
      )}
    </div>
  )
}

export default MedicalHistoryTab
