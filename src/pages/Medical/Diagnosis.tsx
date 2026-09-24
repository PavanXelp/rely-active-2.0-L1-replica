import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, HeartPulse, Loader2, NotebookPen, Pill, Stethoscope, Syringe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { diagnosisService } from '@/lib/services/diagnosisService'
import type { AppointmentDiagnosis, ConsultantAllergy, ConsultantVital } from '@/lib/types/diagnosis'
import type { ResidentMedication } from '@/lib/types/medication'
import type { ResidentInsulin } from '@/lib/types/insulin'
import { toast } from 'sonner'

function formatRecordedAt(value: string): string {
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

function formatMedDate(value: string | null | undefined): string {
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

function formatMedicationSummary(med: ResidentMedication): string {
  const selected = (med.timings || []).filter((t) => t.selected)
  const slots = selected.map((t) => t.timeOfDay).join(', ')
  if (med.isUntilDischarge) {
    return `${formatMedDate(med.startDate)} → Until discharge${slots ? ` · ${slots}` : ''}`
  }
  return `${formatMedDate(med.startDate)} – ${formatMedDate(med.endDate)}${slots ? ` · ${slots}` : ''}`
}

export default function DiagnosisPage() {
  const navigate = useNavigate()
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [diagnosis, setDiagnosis] = useState<AppointmentDiagnosis | null>(null)
  const [allergies, setAllergies] = useState<ConsultantAllergy[]>([])
  const [vitals, setVitals] = useState<ConsultantVital[]>([])
  const [medications, setMedications] = useState<ResidentMedication[]>([])
  const [insulin, setInsulin] = useState<ResidentInsulin[]>([])
  const [note, setNote] = useState('')

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
        setAllergies(data.allergies || [])
        setVitals(data.vitals || [])
        setMedications(data.medications || [])
        setInsulin(data.insulin || [])
        setNote(data.note || '')
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

  const subtitleParts = [diagnosis?.memberName || diagnosis?.doctorName || 'Consultation', 'Attended']

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/medical')}
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
      ) : (
        <>
          {diagnosis.doctorName && (
            <p className="text-[11px] text-muted-foreground font-semibold px-0.5">
              {diagnosis.doctorName}
              {diagnosis.appointmentDate ? ` · ${formatMedDate(diagnosis.appointmentDate)}` : ''}
              {diagnosis.slotTimeRange ? ` · ${diagnosis.slotTimeRange}` : ''}
            </p>
          )}

          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-black text-foreground">Allergies</h3>
              {allergies.length === 0 ? (
                <p className="text-xs text-muted-foreground font-medium">None</p>
              ) : (
                <div className="space-y-2">
                  {allergies.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
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

          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-black text-foreground">Vitals</h3>
              {vitals.length === 0 ? (
                <p className="text-xs text-muted-foreground font-medium">None</p>
              ) : (
                <div className="space-y-2">
                  {vitals.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
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

          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Pill className="w-4 h-4 text-sky-500" />
                Medication
              </h3>
              {medications.length === 0 ? (
                <p className="text-xs text-muted-foreground font-medium">None</p>
              ) : (
                <div className="space-y-2">
                  {medications.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                      <p className="text-sm font-bold text-foreground">{item.medicineName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatMedicationSummary(item)}</p>
                      {item.note && <p className="text-[11px] text-muted-foreground mt-0.5">{item.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Syringe className="w-4 h-4 text-sky-500" />
                Insulin
              </h3>
              {insulin.length === 0 ? (
                <p className="text-xs text-muted-foreground font-medium">None</p>
              ) : (
                <div className="space-y-2">
                  {insulin.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                      <p className="text-sm font-bold text-foreground">{item.medicineName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatMedicationSummary(item)}</p>
                      {item.note && <p className="text-[11px] text-muted-foreground mt-0.5">{item.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-1.5 px-0.5">
            <Label htmlFor="diagnosis-note" className="text-sm font-black text-foreground flex items-center gap-2">
              <NotebookPen className="w-4 h-4 text-sky-500" />
              Note
            </Label>
            <Textarea
              id="diagnosis-note"
              value={note || 'None'}
              readOnly
              disabled
              className="rounded-2xl min-h-[100px] bg-card border-border/60"
            />
          </div>
        </>
      )}
    </div>
  )
}
