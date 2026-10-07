import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { useAuthStore } from '@/lib/stores/auth-store'

describe('Rely Active mobile shell', () => {
  beforeEach(() => useAuthStore.setState({ token: null }))
  it('redirects unauthenticated users to login', () => {
    const { getByText } = render(
      // main.tsx provides the query client in the real app; the layout's notification badge needs it.
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(getByText('Resident Access')).toBeInTheDocument()
  })
})
