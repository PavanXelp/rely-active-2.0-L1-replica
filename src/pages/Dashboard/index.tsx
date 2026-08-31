import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Utensils,
  Ticket,
  ShieldCheck,
  User,
  ChevronRight,
  Sparkles,
  Calendar,
  Clock,
  QrCode,
  CheckCircle2,
  Wrench,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'

export default function Dashboard() {
  const resident = useAuthStore((state) => state.resident)
  const navigate = useNavigate()

  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [gateModalOpen, setGateModalOpen] = useState(false)

  // Quick ticket form state
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketCategory, setTicketCategory] = useState('Maintenance')
  const [ticketsList, setTicketsList] = useState([
    { id: 'TCK-101', title: 'A/C Filter Cleaning', category: 'Maintenance', status: 'In Progress', date: 'Today' },
  ])

  // Gate visitor state
  const [visitorName, setVisitorName] = useState('')
  const [visitorType, setVisitorType] = useState('Guest')
  const [visitorsList, setVisitorsList] = useState([
    { id: 'GATE-88', name: 'John Doe', type: 'Delivery', status: 'Pre-Approved', time: '02:30 PM' },
  ])

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketTitle.trim()) return
    const newTck = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      title: ticketTitle.trim(),
      category: ticketCategory,
      status: 'Open',
      date: 'Just now',
    }
    setTicketsList([newTck, ...ticketsList])
    setTicketTitle('')
    setTicketModalOpen(false)
    toast.success(`Ticket #${newTck.id} created successfully!`)
  }

  const handleCreateGatePass = (e: React.FormEvent) => {
    e.preventDefault()
    if (!visitorName.trim()) return
    const newVis = {
      id: `GATE-${Math.floor(10 + Math.random() * 90)}`,
      name: visitorName.trim(),
      type: visitorType,
      status: 'Pre-Approved',
      time: 'Expected Today',
    }
    setVisitorsList([newVis, ...visitorsList])
    setVisitorName('')
    setGateModalOpen(false)
    toast.success(`Gate pass generated for ${newVis.name}!`)
  }

  return (
    <div className="space-y-5 pb-8 select-none font-sans">
      {/* Top Welcome Header Banner */}
      <div className="bg-gradient-to-r from-[#005390] via-blue-700 to-indigo-800 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-white/20 text-white border-none px-2.5 py-0.5 text-[10px] font-bold backdrop-blur">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-300" /> Resident Portal
            </Badge>
            <span className="text-[10px] font-bold text-blue-100 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
              <Calendar className="w-3 h-3 text-amber-300" /> {todayFormatted}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight">Welcome back, {resident?.firstName || 'Resident'}! 👋</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Unit {resident?.unitNumber || 'A-11'} • Rely Active Community Companion
            </p>
          </div>
        </div>
      </div>

      {/* Main Service Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            Quick Access Services
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground">4 Core Modules</span>
        </div>

        {/* 1. Food & Beverage (FnB) Card */}
        <Card
          onClick={() => navigate('/fnb')}
          className="rounded-3xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-md hover:shadow-xl hover:border-[#005390] transition-all cursor-pointer overflow-hidden group"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#005390] text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:text-[#005390] transition-colors">
                      Food & Beverage (FnB)
                    </h4>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    Today's breakfast, lunch, snacks & dinner menu
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#005390] group-hover:translate-x-1 transition-all" />
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { slot: 'Breakfast', time: '08:00 AM' },
                { slot: 'Lunch', time: '01:00 PM' },
                { slot: 'Snacks', time: '05:00 PM' },
                { slot: 'Dinner', time: '08:00 PM' },
              ].map((item) => (
                <div
                  key={item.slot}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-xl p-1.5 text-center border border-gray-100 dark:border-slate-700"
                >
                  <span className="text-[9px] font-extrabold text-gray-900 dark:text-gray-100 block">{item.slot}</span>
                  <span className="text-[8px] text-muted-foreground font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                    <Clock className="w-2 h-2 text-blue-500" />
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 2. Tickets (Helpdesk & Maintenance) Card */}
        <Card
          onClick={() => setTicketModalOpen(true)}
          className="rounded-3xl border border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group"
        >
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      Tickets & Maintenance
                    </h4>
                    <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-none text-[9px] font-extrabold">
                      {ticketsList.length} Active
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    Raise support tickets, plumbing, & electric issues
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>

            {ticketsList.length > 0 && (
              <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-2.5 flex items-center justify-between border border-amber-100 dark:border-amber-900/30 text-xs">
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                    {ticketsList[0].title}
                  </span>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold text-amber-600 border-amber-300">
                  {ticketsList[0].status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Gate & Security Card */}
        <Card
          onClick={() => setGateModalOpen(true)}
          className="rounded-3xl border border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      Gate & Security
                    </h4>
                    <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Protected
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    Pre-approve guests, delivery passes & entry logs
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>

            <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-2.5 flex items-center justify-between border border-emerald-100 dark:border-emerald-900/30 text-xs">
              <div className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {visitorsList[0]?.name || 'Pre-Approve Visitor'}
                </span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Pre-Approved
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 4. My Profile Card */}
        <Card
          onClick={() => navigate('/profile')}
          className="rounded-3xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  My Profile & Family
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  View personal details & family member info
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </CardContent>
        </Card>
      </div>

      {/* Ticket Modal Overlay */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm">Raise Helpdesk Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="ticket-title-input" className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  Issue Title / Summary
                </label>
                <Input
                  id="ticket-title-input"
                  type="text"
                  placeholder="e.g. Water leak in bathroom"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="ticket-category-select"
                  className="text-[11px] font-bold text-gray-700 dark:text-gray-300"
                >
                  Category
                </label>
                <select
                  id="ticket-category-select"
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full h-10 bg-background border border-input rounded-xl px-3 text-xs font-semibold"
                >
                  <option value="Maintenance">Maintenance / Repair</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Housekeeping">Housekeeping</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTicketModalOpen(false)}
                  className="w-1/2 h-10 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-1/2 h-10 text-xs bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl"
                >
                  Create Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gate Pass Modal Overlay */}
      {gateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-black text-sm">Pre-Approve Visitor Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setGateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGatePass} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="visitor-name-input" className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  Visitor Name / Delivery Service
                </label>
                <Input
                  id="visitor-name-input"
                  type="text"
                  placeholder="e.g. Swiggy / Alex Smith"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="visitor-type-select" className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  Visitor Type
                </label>
                <select
                  id="visitor-type-select"
                  value={visitorType}
                  onChange={(e) => setVisitorType(e.target.value)}
                  className="w-full h-10 bg-background border border-input rounded-xl px-3 text-xs font-semibold"
                >
                  <option value="Guest">Guest / Friend</option>
                  <option value="Delivery">Delivery / Courier</option>
                  <option value="Service">Service Technician</option>
                  <option value="Cab">Cab / Taxi</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGateModalOpen(false)}
                  className="w-1/2 h-10 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-1/2 h-10 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl"
                >
                  Approve Pass
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
