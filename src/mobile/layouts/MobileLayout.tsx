import { Activity, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function MobileLayout() {
  const token = useAuthStore((state) => state.token)
  const signOut = useAuthStore((state) => state.signOut)
  const { resolvedTheme, setTheme } = useTheme()
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-xl items-center gap-3 px-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Activity />
            </span>
            Rely Active <Badge variant="outline">Mobile</Badge>
          </NavLink>
          <div className="ml-auto flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
              <LogOut />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-6">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-2 backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-2">
          <Button variant="ghost" render={<NavLink to="/" />}>
            Overview
          </Button>
          <Button variant="ghost" render={<NavLink to="/components" />}>
            Components
          </Button>
        </div>
      </nav>
    </div>
  )
}
