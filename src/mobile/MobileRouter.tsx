import { Navigate, Route, Routes } from 'react-router-dom'
import MobileLayout from '@/mobile/layouts/MobileLayout'
import ComponentShowcase from '@/pages/ComponentShowcase'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'

export default function MobileRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<MobileLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="components" element={<ComponentShowcase />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
