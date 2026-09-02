import { Navigate, Route, Routes } from 'react-router-dom'
import MobileLayout from '@/mobile/layouts/MobileLayout'
import Dashboard from '@/pages/Dashboard'
import FnbPage from '@/pages/Fnb'
import Login from '@/pages/Login'
import ProfilePage from '@/pages/Profile'
import TicketsPage from '@/pages/Tickets'

export default function MobileRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<MobileLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<Dashboard />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="fnb" element={<FnbPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  )
}
