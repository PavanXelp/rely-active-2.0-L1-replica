import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'
const serverHost = apiBase.replace(/\/api\/v1\/?$/, '')

export function getFileUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${serverHost}/${path.replace(/^\/+/, '')}`
}
