import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import MobileRouter from '@/mobile/MobileRouter'

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Rely Active mobile error', error, info)
  }
  render() {
    return this.state.failed ? (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </main>
    ) : (
      this.props.children
    )
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <MobileRouter />
    </AppErrorBoundary>
  )
}
