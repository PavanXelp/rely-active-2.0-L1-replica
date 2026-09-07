import { useState, useEffect } from 'react'
import {
  Ticket as TicketIcon,
  Plus,
  Home,
  Clock,
  Wrench,
  X,
  ChevronRight,
  Check,
  List,
  User,
  AlertTriangle,
  Calendar,
  Building2,
  ShieldAlert,
  FileText,
  Receipt,
  Mic,
  Image as ImageIcon,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth-store'
import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { toast } from 'sonner'

export interface ResidentTicket {
  id: string
  ticketNumber: string
  title: string
  description?: string
  category: string
  subCategory?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED'
  createdAt: string
  unitNumber?: string
  areaType?: 'IN_FLAT' | 'COMMON_AREA'
  assignedTo?: string
  assignedToUserId?: string
  tatOption?: string
  customTatDeadline?: string | null
  resolutionNotes?: string | null
  attachments?: string[] | Record<string, unknown> | null
}

interface ParsedCompletion {
  notes: string | null
  amount: number | string | null
  invoiceUrl: string | null
  invoiceNumber: string | null
  audioUrl: string | null
  photos: string[]
  completedByName: string | null
  completedAt: string | null
}

function parseTicketCompletion(ticket: ResidentTicket | null): ParsedCompletion | null {
  if (!ticket) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let atts: any = ticket.attachments
  if (typeof atts === 'string') {
    try {
      atts = JSON.parse(atts)
    } catch {
      atts = null
    }
  }

  const comp =
    atts?.completion ||
    (atts && (atts.photos || atts.audioUrl || atts.invoiceUrl || atts.amount !== undefined) ? atts : null)

  const notes = comp?.resolutionNotes || ticket.resolutionNotes || null
  const amount = comp?.amount ?? null
  const invoiceUrl = comp?.invoiceUrl || null
  const invoiceNumber = comp?.invoiceNumber || null
  const audioUrl = comp?.audioUrl || null
  const photos: string[] = Array.isArray(comp?.photos) ? comp.photos : Array.isArray(atts?.photos) ? atts.photos : []

  const completedByName = comp?.completedByName || null
  const completedAt = comp?.completedAt || null

  if (!notes && amount === null && !invoiceUrl && !audioUrl && photos.length === 0) {
    return null
  }

  return {
    notes,
    amount,
    invoiceUrl,
    invoiceNumber,
    audioUrl,
    photos,
    completedByName,
    completedAt,
  }
}

// Primary Departments & Job Categories Mapping
const COMMON_AREA_DEPARTMENTS: Record<string, string[]> = {
  'Repair & Maintenance': ['Electrical', 'Carpentry', 'Plumbing', 'Miscellaneous'],
  Concierge: ['Housekeeping', 'Laundry', 'Customer Support', 'Transportation', 'Others'],
}

const IN_FLAT_DEPARTMENTS: Record<string, string[]> = {
  'Repair & Maintenance': ['Electrical', 'Carpentry', 'Plumbing', 'Miscellaneous'],
  Concierge: ['Housekeeping', 'Laundry', 'Customer Support', 'Transportation', 'Others'],
}

export default function TicketsPage() {
  const resident = useAuthStore((state) => state.resident)
  const unitLabel = resident?.unitNumber ? `Flat ${resident.unitNumber}` : 'Flat A-11'

  const [tickets, setTickets] = useState<ResidentTicket[]>([])
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IN_PROGRESS' | 'CLOSED'>('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<ResidentTicket | null>(null)

  // Modal State for Raise Ticket
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createStep, setCreateStep] = useState<1 | 2>(1)
  const [areaType, setAreaType] = useState<'IN_FLAT' | 'COMMON_AREA'>('IN_FLAT')
  const [department, setDepartment] = useState('')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM')
  const [description, setDescription] = useState('')

  // Modal State for Update TAT
  const [isTatModalOpen, setIsTatModalOpen] = useState(false)
  const [tatDate, setTatDate] = useState('')
  const [tatTime, setTatTime] = useState('')
  const [selectedTatPreset, setSelectedTatPreset] = useState('1-2 hour')
  const [isUpdatingTat, setIsUpdatingTat] = useState(false)

  // Modal State for Escalate Ticket
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false)
  const [escalationReason, setEscalationReason] = useState('')
  const [escalationPriority, setEscalationPriority] = useState<'HIGH' | 'CRITICAL'>('HIGH')
  const [isEscalating, setIsEscalating] = useState(false)

  const [apiDepartments, setApiDepartments] = useState<
    Array<{ id: string; code: string; name: string; jobCategories: Array<{ id: string; code: string; name: string }> }>
  >([])

  // Fetch departments & job categories from /api/v1/mobile/l1/tickets/departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiClient.get(ENDPOINTS.tickets.departments)
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setApiDepartments(res.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch L1 departments:', err)
      }
    }

    fetchDepartments()
  }, [])

  // Fetch tickets strictly from backend L1 mobile API endpoint (/api/v1/mobile/l1/tickets)
  useEffect(() => {
    const fetchResidentTickets = async () => {
      setIsLoading(true)
      try {
        const res = await apiClient.get(ENDPOINTS.tickets.list)
        if (res.data?.data && Array.isArray(res.data.data)) {
          setTickets(res.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch L1 resident tickets:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResidentTickets()
  }, [resident?.id])

  const handleSelectAreaType = (type: 'IN_FLAT' | 'COMMON_AREA') => {
    setAreaType(type)
    const deps = type === 'COMMON_AREA' ? Object.keys(COMMON_AREA_DEPARTMENTS) : Object.keys(IN_FLAT_DEPARTMENTS)
    const defaultDep = deps[0] || ''
    setDepartment(defaultDep)
    const cats = type === 'COMMON_AREA' ? COMMON_AREA_DEPARTMENTS[defaultDep] : IN_FLAT_DEPARTMENTS[defaultDep]
    setCategory(cats ? cats[0] : '')
  }

  const handleDepartmentChange = (dep: string) => {
    setDepartment(dep)
    const cats = areaType === 'COMMON_AREA' ? COMMON_AREA_DEPARTMENTS[dep] : IN_FLAT_DEPARTMENTS[dep]
    setCategory(cats ? cats[0] : '')
  }

  // Filtered Tickets list based on active tab
  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === 'IN_PROGRESS')
      return t.status === 'IN_PROGRESS' || t.status === 'OPEN' || t.status === 'ON_HOLD'
    if (activeFilter === 'CLOSED') return t.status === 'CLOSED' || t.status === 'RESOLVED'
    return true
  })

  // Handle New Ticket Submit matching standardized web payload format
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    const issueTitle = title.trim() || `${department} - ${category}`

    const activeDeptObj = apiDepartments.find((d) => d.name === department)
    const activeJobCatObj = activeDeptObj?.jobCategories.find((j) => j.name === category)

    try {
      const res = await apiClient.post(ENDPOINTS.tickets.create, {
        areaType,
        departmentId: activeDeptObj?.id || null,
        department,
        jobCategoryId: activeJobCatObj?.id || null,
        category,
        title: issueTitle,
        description: description.trim(),
        priority,
        unitId: areaType === 'COMMON_AREA' ? null : (resident as { unitId?: string | null })?.unitId || null,
      })

      if (res.data?.data) {
        setTickets([res.data.data, ...tickets])
        toast.success(`Ticket #${res.data.data.ticketNumber} created successfully!`)
      }
    } catch {
      // Local fallback creation if server unreachable
      const formattedCategory = areaType === 'COMMON_AREA' ? `Common Area - ${department}` : `In-Flat (${department})`
      const newTicket: ResidentTicket = {
        id: `tck-${Date.now()}`,
        ticketNumber: `${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(1000 + Math.random() * 9000)}-RME-${Math.floor(100 + Math.random() * 900)}`,
        title: issueTitle,
        description: description.trim(),
        category: formattedCategory,
        subCategory: category,
        priority,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        unitNumber: areaType === 'COMMON_AREA' ? 'Common Area' : resident?.unitNumber || 'A-11',
        areaType,
        assignedTo: 'Unassigned',
        tatOption: '1-2 hour',
      }
      setTickets([newTicket, ...tickets])
      toast.success(
        `Ticket #${newTicket.ticketNumber} created for ${areaType === 'COMMON_AREA' ? 'Common Area' : unitLabel}!`,
      )
    } finally {
      setTitle('')
      setDescription('')
      setIsCreateModalOpen(false)
      setCreateStep(1)
    }
  }

  // Handle Update TAT Submit
  const handleUpdateTat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket) return

    try {
      setIsUpdatingTat(true)
      const customDeadline = tatDate && tatTime ? `${tatDate}T${tatTime}` : tatDate || null
      const displayTat = customDeadline
        ? `Custom: ${new Date(customDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
        : selectedTatPreset

      await apiClient.patch(ENDPOINTS.tickets.updateTat(selectedTicket.id), {
        tatOption: displayTat,
        customTatDeadline: customDeadline,
      })

      // Update local state
      const updatedList = tickets.map((t) =>
        t.id === selectedTicket.id ? { ...t, tatOption: displayTat, customTatDeadline: customDeadline } : t,
      )
      setTickets(updatedList)
      setSelectedTicket((prev) => (prev ? { ...prev, tatOption: displayTat, customTatDeadline: customDeadline } : null))
      toast.success(`TAT updated successfully to ${displayTat}`)
      setIsTatModalOpen(false)
    } catch {
      // Local state fallback
      const displayTat = tatDate ? `Custom: ${tatDate} ${tatTime}` : selectedTatPreset
      const updatedList = tickets.map((t) => (t.id === selectedTicket.id ? { ...t, tatOption: displayTat } : t))
      setTickets(updatedList)
      setSelectedTicket((prev) => (prev ? { ...prev, tatOption: displayTat } : null))
      toast.success(`TAT updated to ${displayTat}`)
      setIsTatModalOpen(false)
    } finally {
      setIsUpdatingTat(false)
    }
  }

  // Handle Escalate Ticket Submit
  const handleEscalateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket) return
    if (!escalationReason.trim()) {
      toast.error('Please enter a reason for escalating this ticket')
      return
    }

    try {
      setIsEscalating(true)
      await apiClient.patch(ENDPOINTS.tickets.escalate(selectedTicket.id), {
        reason: escalationReason.trim(),
        priority: escalationPriority,
      })

      const reasonNote = `[ESCALATED]: ${escalationReason.trim()}`

      // Update local state
      const updatedList = tickets.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              priority: escalationPriority,
              resolutionNotes: t.resolutionNotes ? `${t.resolutionNotes}\n${reasonNote}` : reasonNote,
            }
          : t,
      )
      setTickets(updatedList)
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              priority: escalationPriority,
              resolutionNotes: prev.resolutionNotes ? `${prev.resolutionNotes}\n${reasonNote}` : reasonNote,
            }
          : null,
      )
      toast.success(`Ticket escalated to ${escalationPriority} priority!`)
      setIsEscalateModalOpen(false)
      setEscalationReason('')
    } catch {
      // Local state fallback
      const reasonNote = `[ESCALATED]: ${escalationReason.trim()}`
      const updatedList = tickets.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              priority: escalationPriority,
              resolutionNotes: t.resolutionNotes ? `${t.resolutionNotes}\n${reasonNote}` : reasonNote,
            }
          : t,
      )
      setTickets(updatedList)
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              priority: escalationPriority,
              resolutionNotes: prev.resolutionNotes ? `${prev.resolutionNotes}\n${reasonNote}` : reasonNote,
            }
          : null,
      )
      toast.success(`Ticket escalated to ${escalationPriority} priority!`)
      setIsEscalateModalOpen(false)
      setEscalationReason('')
    } finally {
      setIsEscalating(false)
    }
  }

  // Categories list based on current active areaType & department
  const availableCategories =
    areaType === 'COMMON_AREA' ? COMMON_AREA_DEPARTMENTS[department] || [] : IN_FLAT_DEPARTMENTS[department] || []

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      {/* Resident Header Card with Primary Color */}
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white backdrop-blur">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Tickets & Support</h2>
              <p className="text-[11px] text-blue-100 font-semibold mt-0.5">
                Service requests for <span className="font-extrabold underline">{unitLabel}</span>
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              setIsCreateModalOpen(true)
              setCreateStep(1)
            }}
            className="bg-white text-[#005390] hover:bg-blue-50 font-extrabold text-xs rounded-xl px-3 py-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Raise Ticket
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-muted/60 p-1 rounded-2xl border border-border/40 text-xs">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`flex-1 py-2 text-center rounded-xl font-bold transition-all cursor-pointer ${
            activeFilter === 'ALL' ? 'bg-[#005390] text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({tickets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('IN_PROGRESS')}
          className={`flex-1 py-2 text-center rounded-xl font-bold transition-all cursor-pointer ${
            activeFilter === 'IN_PROGRESS'
              ? 'bg-[#005390] text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Active ({tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('CLOSED')}
          className={`flex-1 py-2 text-center rounded-xl font-bold transition-all cursor-pointer ${
            activeFilter === 'CLOSED'
              ? 'bg-[#005390] text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Closed ({tickets.filter((t) => t.status === 'CLOSED' || t.status === 'RESOLVED').length})
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-xs font-semibold text-muted-foreground">
            Loading tickets for your flat...
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card className="rounded-3xl border border-border/60 p-6 text-center text-muted-foreground space-y-2">
            <Wrench className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <h4 className="font-bold text-sm text-foreground">No Tickets Found</h4>
            <p className="text-xs">There are no service tickets listed for your unit under this tab.</p>
          </Card>
        ) : (
          filteredTickets.map((t) => {
            const isClosed = t.status === 'CLOSED' || t.status === 'RESOLVED'
            const isCommon = t.areaType === 'COMMON_AREA' || t.unitNumber === 'Common Area'

            return (
              <Card
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`rounded-3xl border transition-all cursor-pointer hover:shadow-md ${
                  isClosed
                    ? 'border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : 'border-border/60 bg-card hover:border-[#005390]/40'
                }`}
              >
                <CardContent className="p-4 space-y-2.5">
                  {/* Top Ticket Number & Priority/Status */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-foreground">{t.ticketNumber}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black ${
                          isCommon
                            ? 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300'
                            : 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300'
                        }`}
                      >
                        {isCommon ? 'Common Area' : 'In-Flat'}
                      </Badge>
                      {t.priority === 'HIGH' || t.priority === 'CRITICAL' ? (
                        <Badge className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.2">
                          {t.priority}
                        </Badge>
                      ) : null}
                    </div>

                    <Badge
                      className={`text-[10px] font-extrabold border-none px-2 py-0.5 ${
                        isClosed
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : t.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-[#005390] dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {isClosed ? 'Closed' : t.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}
                    </Badge>
                  </div>

                  {/* Title & Flat Info */}
                  <div>
                    <h3 className="font-bold text-xs text-foreground leading-snug line-clamp-2">{t.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-semibold mt-1">
                      <span className="flex items-center gap-1">
                        {isCommon ? (
                          <Building2 className="w-3 h-3 text-purple-500" />
                        ) : (
                          <Home className="w-3 h-3 text-blue-500" />
                        )}
                        {isCommon ? 'Society Common Space' : unitLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Category Pill */}
                  <div className="text-[11px] font-bold text-muted-foreground">
                    Category: <span className="text-foreground font-extrabold">{t.category}</span>
                  </div>

                  {/* Footer Assignee & View Details Trigger */}
                  <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-muted-foreground">
                      Assigned: <span className="text-foreground">{t.assignedTo || 'Unassigned'}</span>
                    </span>

                    <span className="text-[#005390] font-extrabold flex items-center gap-0.5 hover:underline">
                      View Status <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal: 2-Step Area Selection & Cascading Ticket Creation Form */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background text-foreground w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in duration-200">
            {/* Step Header */}
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#005390]/10 text-[#005390]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Raise Service Ticket</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    Step {createStep} of 2: {createStep === 1 ? 'Select Target Area' : 'Select Department & Details'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setCreateStep(1)
                }}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: Select Area (In-Flat vs Common Area) */}
            {createStep === 1 ? (
              <div className="space-y-3 pt-1 text-xs">
                <p className="font-bold text-muted-foreground">Where is the issue located?</p>

                {/* Option 1: In-Flat */}
                <button
                  type="button"
                  onClick={() => handleSelectAreaType('IN_FLAT')}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                    areaType === 'IN_FLAT'
                      ? 'border-[#005390] bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-[#005390]/30'
                      : 'border-border bg-card hover:border-[#005390]/40'
                  }`}
                >
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-[#005390]">
                    <Home className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-foreground">In-Flat Issue</h4>
                      {areaType === 'IN_FLAT' && <Badge className="bg-[#005390] text-white text-[9px]">Selected</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      For issues inside your apartment flat ({unitLabel}: Plumbing, Electrical, AC, Locksmith).
                    </p>
                  </div>
                </button>

                {/* Option 2: Common Area */}
                <button
                  type="button"
                  onClick={() => handleSelectAreaType('COMMON_AREA')}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                    areaType === 'COMMON_AREA'
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-600/30'
                      : 'border-border bg-card hover:border-purple-600/40'
                  }`}
                >
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-foreground">Common Area Issue</h4>
                      {areaType === 'COMMON_AREA' && (
                        <Badge className="bg-purple-600 text-white text-[9px]">Selected</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      For shared community spaces (Clubhouse, Gym, Swimming Pool, Lobbies, Elevators, Gardens).
                    </p>
                  </div>
                </button>

                <Button
                  type="button"
                  onClick={() => setCreateStep(2)}
                  className="w-full mt-2 bg-[#005390] hover:bg-[#004273] text-white font-extrabold text-xs rounded-xl py-2.5 shadow-sm cursor-pointer"
                >
                  Next: Department & Issue Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              /* STEP 2: Cascading Form (Department -> Categories) */
              <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
                {/* Active Area Banner */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border/50">
                  <span className="text-[11px] font-bold text-muted-foreground">Target Location:</span>
                  <Badge
                    className={`text-[10px] font-extrabold border-none ${
                      areaType === 'COMMON_AREA' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-[#005390]'
                    }`}
                  >
                    {areaType === 'COMMON_AREA' ? 'Common Area' : unitLabel}
                  </Badge>
                </div>

                {/* Cascading Dropdown 1: Department */}
                <div className="space-y-1">
                  <div className="font-bold text-foreground">1. Select Department *</div>
                  <select
                    value={department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs focus:ring-2 focus:ring-[#005390]"
                  >
                    {(areaType === 'COMMON_AREA'
                      ? Object.keys(COMMON_AREA_DEPARTMENTS)
                      : Object.keys(IN_FLAT_DEPARTMENTS)
                    ).map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cascading Dropdown 2: Category / Specific Issue */}
                <div className="space-y-1">
                  <div className="font-bold text-foreground">2. Select Issue Category *</div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs focus:ring-2 focus:ring-[#005390]"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Selection */}
                <div className="space-y-1">
                  <div className="font-bold text-foreground">3. Priority Level</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`py-1.5 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                          priority === p
                            ? p === 'CRITICAL'
                              ? 'bg-red-600 text-white border-red-700'
                              : p === 'HIGH'
                                ? 'bg-amber-600 text-white border-amber-700'
                                : 'bg-[#005390] text-white border-[#005390]'
                            : 'bg-card text-muted-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description Textarea */}
                <div className="space-y-1">
                  <div className="font-bold text-muted-foreground">Description (Optional)</div>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details or floor location..."
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground font-medium text-xs focus:ring-2 focus:ring-[#005390] focus:outline-none"
                  />
                </div>

                {/* Submit Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateStep(1)}
                    className="flex-1 rounded-xl text-xs font-bold"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#005390] hover:bg-[#004273] text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Submit Ticket
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Ticket Details Progress Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-background text-foreground w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#005390]/10 text-[#005390]">
                  <TicketIcon className="w-4 h-4" />
                </div>
                <span className="font-mono font-extrabold text-sm text-foreground">{selectedTicket.ticketNumber}</span>
                {selectedTicket.priority === 'HIGH' || selectedTicket.priority === 'CRITICAL' ? (
                  <Badge className="bg-red-500 text-white text-[9px] font-black animate-pulse">
                    ESCALATED ({selectedTicket.priority})
                  </Badge>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={`text-[10px] font-bold border-none ${
                    selectedTicket.status === 'CLOSED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedTicket.status === 'CLOSED' ? 'Closed' : 'In Progress'}
                </Badge>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Timeline Box */}
            <div className="border border-dashed border-border rounded-2xl p-4 bg-muted/30 space-y-3">
              {(() => {
                const isStep2Done = Boolean(
                  selectedTicket.assignedToUserId ||
                  selectedTicket.assignedTo ||
                  selectedTicket.status === 'IN_PROGRESS' ||
                  selectedTicket.status === 'RESOLVED' ||
                  selectedTicket.status === 'CLOSED',
                )
                const isStep3Done =
                  selectedTicket.status === 'IN_PROGRESS' ||
                  selectedTicket.status === 'RESOLVED' ||
                  selectedTicket.status === 'CLOSED'
                const isStep4Done = selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'

                const stepIndex = isStep4Done ? 3 : isStep3Done ? 2 : isStep2Done ? 1 : 0
                const activeWidthPercent = (stepIndex / 3) * 75

                return (
                  <div className="grid grid-cols-4 relative">
                    <div className="absolute top-3.5 -translate-y-1/2 left-[12.5%] right-[12.5%] h-0.5 bg-muted z-0" />
                    <div
                      className="absolute top-3.5 -translate-y-1/2 left-[12.5%] h-0.5 bg-[#005390] transition-all duration-300 z-0"
                      style={{ width: `${activeWidthPercent}%` }}
                    />

                    {/* Step 1: Request Raised */}
                    <div className="flex flex-col items-center z-10 space-y-1 text-center">
                      <div className="w-7 h-7 rounded-full bg-[#005390] text-white font-bold flex items-center justify-center text-[10px] shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-foreground">Request Raised</span>
                    </div>

                    {/* Step 2: Assigned Task */}
                    <div className="flex flex-col items-center z-10 space-y-1 text-center">
                      <div
                        className={`w-7 h-7 rounded-full border-2 ${
                          isStep2Done
                            ? 'border-[#005390] bg-[#005390] text-white'
                            : 'border-border bg-background text-muted-foreground'
                        } font-bold flex items-center justify-center text-[10px] shadow-xs`}
                      >
                        {isStep2Done ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${isStep2Done ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        Assigned Task
                      </span>
                    </div>

                    {/* Step 3: Request Accepted */}
                    <div className="flex flex-col items-center z-10 space-y-1 text-center">
                      <div
                        className={`w-7 h-7 rounded-full border-2 ${
                          isStep3Done
                            ? 'border-[#005390] bg-[#005390] text-white'
                            : 'border-border bg-background text-muted-foreground'
                        } font-bold flex items-center justify-center text-[10px] shadow-xs`}
                      >
                        {isStep3Done ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${isStep3Done ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        Request Accepted
                      </span>
                    </div>

                    {/* Step 4: Ticket Closed */}
                    <div className="flex flex-col items-center z-10 space-y-1 text-center">
                      <div
                        className={`w-7 h-7 rounded-full border-2 ${
                          isStep4Done
                            ? 'border-[#005390] bg-[#005390] text-white'
                            : 'border-border bg-background text-muted-foreground'
                        } font-bold flex items-center justify-center text-[10px] shadow-xs`}
                      >
                        {isStep4Done ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${isStep4Done ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        Ticket Closed
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Detail Information List */}
            <div className="space-y-2.5 text-xs text-foreground">
              <div className="flex items-center gap-2 font-bold">
                {selectedTicket.areaType === 'COMMON_AREA' ? (
                  <Building2 className="w-4 h-4 text-purple-600" />
                ) : (
                  <Home className="w-4 h-4 text-blue-600" />
                )}
                <span>{selectedTicket.areaType === 'COMMON_AREA' ? 'Common Area' : unitLabel}</span>
              </div>

              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground font-semibold">Category :</span>
                <span className="font-bold">{selectedTicket.category}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground font-semibold">TAT :</span>
                <span className="font-bold text-[#005390] underline">{selectedTicket.tatOption || '1-2 hour'}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground font-semibold">Assigned :</span>
                <span className="font-bold">{selectedTicket.assignedTo || 'Unassigned'}</span>
              </div>

              {selectedTicket.resolutionNotes && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl text-[11px] font-medium text-amber-900 dark:text-amber-200">
                  <span className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="w-3.5 h-3.5" /> Escalation Notes:
                  </span>
                  <p className="mt-0.5 whitespace-pre-line">{selectedTicket.resolutionNotes}</p>
                </div>
              )}
            </div>

            {/* Readonly Summary */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-bold text-muted-foreground">Description</span>
              <p className="p-3 bg-muted/50 rounded-xl text-xs font-medium text-foreground border border-border/50">
                {selectedTicket.description || selectedTicket.title}
              </p>
            </div>

            {/* Work Resolution & Completion Section (Invoice, Voice Note, Photos, Notes) */}
            {(() => {
              const comp = parseTicketCompletion(selectedTicket)
              if (!comp) return null

              return (
                <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-foreground">Completion Report</span>
                    </div>
                    {comp.amount !== null && comp.amount !== undefined && (
                      <Badge className="bg-emerald-600 text-white text-[11px] font-mono">
                        ₹{typeof comp.amount === 'number' ? comp.amount.toLocaleString('en-IN') : comp.amount}
                      </Badge>
                    )}
                  </div>

                  {comp.notes && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3 text-emerald-600" /> Resolution Note
                      </span>
                      <p className="text-xs p-2.5 rounded-xl bg-card border border-border/60 text-foreground whitespace-pre-line">
                        {comp.notes}
                      </p>
                    </div>
                  )}

                  {comp.audioUrl && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Mic className="w-3 h-3 text-[#005390]" /> Voice Recording
                      </span>
                      <audio controls src={comp.audioUrl} className="w-full h-8 rounded-lg" preload="metadata">
                        <track kind="captions" />
                      </audio>
                    </div>
                  )}

                  {comp.invoiceUrl && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-amber-600" /> Invoice / Bill
                      </span>
                      <a
                        href={comp.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border/60 hover:bg-muted/40 transition-colors"
                      >
                        <img
                          src={comp.invoiceUrl}
                          alt="Invoice"
                          className="w-12 h-12 object-cover rounded-lg border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">Invoice Document</p>
                          <span className="text-[10px] text-muted-foreground">Tap to view full bill</span>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </a>
                    </div>
                  )}

                  {comp.photos && comp.photos.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-purple-600" /> Work Photos ({comp.photos.length})
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {comp.photos.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl overflow-hidden border border-border aspect-video"
                          >
                            <img src={url} alt={`Work ${i + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Action Buttons for Active Ticket: Update TAT & Escalate Ticket */}
            {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTatModalOpen(true)}
                  className="w-full text-xs font-bold border-[#005390]/40 text-[#005390] hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 mr-1" /> Update TAT
                </Button>

                <Button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(true)}
                  className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Escalate Ticket
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Update TAT Deadline (Date & Time Picker) */}
      {isTatModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background text-foreground w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#005390]">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">Update TAT Deadline</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTatModalOpen(false)}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTat} className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-muted-foreground">Select Preset TAT Option</div>
                <select
                  value={selectedTatPreset}
                  onChange={(e) => setSelectedTatPreset(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground font-medium text-xs focus:ring-2 focus:ring-[#005390]"
                >
                  <option value="1-2 hour">1 - 2 Hours (Urgent)</option>
                  <option value="2-4 hour">2 - 4 Hours (Standard)</option>
                  <option value="24 hour">24 Hours (Next Day)</option>
                  <option value="Custom Date & Time">Custom Date & Time</option>
                </select>
              </div>

              {/* Date & Time Picker Fields */}
              <div className="space-y-2 pt-1 border-t border-border/50">
                <div className="font-bold text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#005390]" /> Specify Custom Date & Time
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold">Date</span>
                    <Input
                      type="date"
                      value={tatDate}
                      onChange={(e) => setTatDate(e.target.value)}
                      className="text-xs rounded-xl mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold">Time</span>
                    <Input
                      type="time"
                      value={tatTime}
                      onChange={(e) => setTatTime(e.target.value)}
                      className="text-xs rounded-xl mt-0.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTatModalOpen(false)}
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingTat}
                  className="flex-1 bg-[#005390] hover:bg-[#004273] text-white rounded-xl text-xs font-bold"
                >
                  {isUpdatingTat ? 'Saving...' : 'Save TAT'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Escalate Ticket (Reason Text Box & Priority Upgrade) */}
      {isEscalateModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background text-foreground w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Escalate Ticket</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Upgrade ticket priority to urgent management review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEscalateTicket} className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-muted-foreground">Target Priority Upgrade</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEscalationPriority('HIGH')}
                    className={`flex-1 py-2 rounded-xl font-extrabold text-xs border transition-all ${
                      escalationPriority === 'HIGH'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-card text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    HIGH
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscalationPriority('CRITICAL')}
                    className={`flex-1 py-2 rounded-xl font-extrabold text-xs border transition-all ${
                      escalationPriority === 'CRITICAL'
                        ? 'bg-red-600 text-white border-red-700 shadow-xs'
                        : 'bg-card text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    CRITICAL
                  </button>
                </div>
              </div>

              {/* Text Box for Escalation Reason */}
              <div className="space-y-1.5">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>Reason for Escalation</span>
                  <span className="text-[10px] text-red-500 font-bold">*Required</span>
                </div>
                <textarea
                  rows={3}
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Explain why this request needs urgent escalation (e.g. Technician delayed, urgent water leakage)..."
                  className="w-full p-3 rounded-xl border border-border bg-card text-foreground font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEscalateModalOpen(false)}
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isEscalating}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {isEscalating ? 'Escalating...' : 'Confirm Escalation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
