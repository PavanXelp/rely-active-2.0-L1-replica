import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Loader2, Stethoscope } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { diagnosisService } from '@/lib/services/diagnosisService'
import type { AppointmentDiagnosis } from '@/lib/types/diagnosis'
import { toast } from 'sonner'
import {
  AllergiesSection,
  ConditionBadge,
  InsulinSection,
  MedicationSection,
  NoteSection,
  VitalsSection,
} from './components/DiagnosisSections'
import { formatMedDate } from './components/diagnosisFormat'

export default function DiagnosisPage() {
  const navigate = useNavigate()
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [diagnosis, setDiagnosis] = useState<AppointmentDiagnosis | null>(null)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      if (!appointmentId) return
      try {
        setLoading(true)
        const data = await diagnosisService.getBookingDiagnosis(appointmentId)
        if (ignore) return
        if (!data) {
          toast.error('Diagnosis not found')
          setDiagnosis(null)
          return
        }
        setDiagnosis(data)
      } catch (err) {
        console.error('Failed to load diagnosis:', err)
        if (!ignore) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to load diagnosis'
          toast.error(message)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [appointmentId])

  const isCompleted = diagnosis?.diagnosisStatus === 'COMPLETED'
  const doctorLabel = diagnosis?.doctorName ? `Dr. ${diagnosis.doctorName}` : 'The doctor'
  const subtitleParts = [
    diagnosis?.memberName || diagnosis?.doctorName || 'Consultation',
    isCompleted ? 'Attended' : 'Pending',
  ]

  const handleBack = () => {
    const historyIdx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (historyIdx > 0) navigate(-1)
    else navigate('/medical')
  }

  const metaLine = diagnosis?.doctorName ? (
    <p className="text-[11px] text-muted-foreground font-semibold px-0.5">
      {diagnosis.doctorName}
      {diagnosis.appointmentDate ? ` · ${formatMedDate(diagnosis.appointmentDate)}` : ''}
      {diagnosis.slotTimeRange ? ` · ${diagnosis.slotTimeRange}` : ''}
    </p>
  ) : null

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white backdrop-blur shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black tracking-tight truncate">Diagnosis</h2>
              <p className="text-[11px] text-blue-100 font-semibold mt-0.5 truncate">{subtitleParts.join(' · ')}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-[#005390] animate-spin" />
          <p className="text-xs font-semibold text-muted-foreground">Loading diagnosis...</p>
        </div>
      ) : !diagnosis ? (
        <Card className="rounded-3xl border border-border/60 p-8 text-center space-y-2">
          <Stethoscope className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h4 className="font-bold text-sm text-foreground">Diagnosis Unavailable</h4>
          <p className="text-xs text-muted-foreground">No completed diagnosis was found for this appointment.</p>
        </Card>
      ) : !isCompleted ? (
        <>
          {metaLine}
          <Card className="rounded-3xl border border-amber-200/70 dark:border-amber-900/40 p-8 text-center space-y-2">
            <Clock className="w-10 h-10 mx-auto text-amber-400" />
            <h4 className="font-bold text-sm text-foreground">Diagnosis Not Completed Yet</h4>
            <p className="text-xs text-muted-foreground">
              {diagnosis.diagnosisStatus === 'IN_PROGRESS'
                ? `${doctorLabel} has started your consultation. The diagnosis will appear here once the doctor completes it.`
                : `${doctorLabel} hasn't completed the diagnosis yet. It will appear here once the doctor submits it.`}
            </p>
          </Card>
        </>
      ) : (
        <>
          {metaLine}
          <ConditionBadge condition={diagnosis.condition} />
          <AllergiesSection items={diagnosis.allergies} />
          <VitalsSection items={diagnosis.vitals} />
          <MedicationSection items={diagnosis.medications} />
          <InsulinSection items={diagnosis.insulin} />
          <NoteSection
            id="diagnosis-note"
            note={diagnosis.note}
            attachments={diagnosis.attachments}
            voiceNotes={diagnosis.voiceNotes}
          />
        </>
      )}
    </div>
  )
}
