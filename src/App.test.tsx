import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { useAuthStore } from '@/lib/stores/auth-store'

describe('Rely Active mobile shell', () => {
  beforeEach(() => useAuthStore.setState({ token: null }))
  it('redirects unauthenticated users to login', () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(getByText('Resident Access')).toBeInTheDocument()
  })
})
