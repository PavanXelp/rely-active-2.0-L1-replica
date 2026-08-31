import axios from 'axios'
import { useAuthStore } from './stores/auth-store'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
