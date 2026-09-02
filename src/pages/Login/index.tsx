import { useState } from 'react'
import { Activity, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth-store'
import { api } from '@/lib/api'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { toast } from 'sonner'

export default function Login() {
  const signIn = useAuthStore((state) => state.signIn)
  const navigate = useNavigate()

  const [username, setUsername] = useState('demo_resident')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      toast.error('Please enter resident username and password')
      return
    }

    try {
      setLoading(true)
      const res = await api.post(ENDPOINTS.auth.login, {
        username: username.trim(),
        password,
      })

      if (res.data?.success && res.data?.data?.token) {
        const { token, resident } = res.data.data
        signIn(token, resident)
        toast.success(`Welcome back, ${resident?.firstName || 'Resident'}!`)
        navigate('/overview')
      } else {
        toast.error(res.data?.message || 'Login failed')
      }
    } catch (err: unknown) {
      console.error('Resident login error:', err)
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(msg || 'Invalid resident credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-6 select-none font-sans">
      {/* Authentic Mobile Device Container Frame */}
      <div className="w-full max-w-[400px] h-[820px] max-h-[92vh] bg-slate-950 text-slate-100 rounded-[42px] border-[10px] border-slate-800 shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-slate-700/50">
        {/* Top Status Bar / Dynamic Island simulation */}
        <div className="pt-3 px-7 flex items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0 z-10">
          <span>09:41</span>
          <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-slate-950 rounded-full"></div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-extrabold text-emerald-400">5G</span>
          </div>
        </div>

        {/* Scrollable Content Inside Mobile Device */}
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-between">
          <div className="space-y-8 my-auto">
            {/* App Brand Header */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#005390] to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Rely Active</h1>
                <p className="text-xs font-medium text-slate-400 mt-1">Resident Mobile Companion</p>
              </div>
            </div>

            {/* Login Card Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl backdrop-blur-md"
            >
              <div className="space-y-1 text-center pb-2 border-b border-slate-800">
                <h2 className="text-sm font-bold text-slate-200">Resident Access</h2>
                <p className="text-[11px] text-slate-400">Sign in with your phone or resident ID</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="username" className="text-[11px] font-bold text-slate-300 ml-1">
                    Username / Phone Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Username or Phone"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-10 bg-slate-950 border-slate-800 text-xs font-semibold text-white focus:border-[#005390] rounded-xl placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="text-[11px] font-bold text-slate-300 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-10 bg-slate-950 border-slate-800 text-xs font-semibold text-white focus:border-[#005390] rounded-xl placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#005390] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Enter Resident Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connected Community Security</span>
            </div>
          </div>

          {/* Bottom Device Home Bar */}
          <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto shrink-0 mt-4"></div>
        </div>
      </div>
    </main>
  )
}
