import { Activity, LogOut, Moon, Sun, Home, User, Ticket } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function MobileLayout() {
  const token = useAuthStore((state) => state.token)
  const signOut = useAuthStore((state) => state.signOut)
  const resident = useAuthStore((state) => state.resident)
  const { resolvedTheme, setTheme } = useTheme()

  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-2 sm:p-6 font-sans select-none">
      {/* Authentic Mobile Device Frame Container */}
      <div className="w-full max-w-[420px] h-[860px] max-h-[96vh] bg-background text-foreground rounded-[42px] border-[10px] border-slate-800 shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-slate-700/50">
        {/* Top Mobile Status Bar */}
        <div className="pt-3 px-7 flex items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0 z-30 bg-background/90 backdrop-blur border-b border-border/40">
          <span>09:41</span>
          <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-slate-950 rounded-full"></div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-emerald-500">5G</span>
          </div>
        </div>

        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-[#005390] text-white flex items-center justify-center font-black shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs leading-none">Rely Active</div>
              <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                {resident?.firstName ? `Resident • ${resident.firstName}` : 'Resident App'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl cursor-pointer"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              aria-label="Sign out"
              onClick={signOut}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Main Viewport Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none">
          <Outlet />
        </main>

        {/* Bottom Mobile Tab Bar */}
        <nav className="z-20 border-t bg-background/95 backdrop-blur px-3 py-2 shrink-0">
          <div className="grid grid-cols-3 gap-1.5">
            <NavLink
              to="/overview"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 rounded-2xl text-[10px] font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#005390] text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              <Home className="w-4 h-4 mb-0.5" />
              <span>Overview</span>
            </NavLink>

            <NavLink
              to="/tickets"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 rounded-2xl text-[10px] font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#005390] text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              <Ticket className="w-4 h-4 mb-0.5" />
              <span>Tickets</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 rounded-2xl text-[10px] font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#005390] text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              <User className="w-4 h-4 mb-0.5" />
              <span>Profile</span>
            </NavLink>
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="w-28 h-1 bg-slate-700/60 rounded-full mx-auto mt-2"></div>
        </nav>
      </div>
    </div>
  )
}
