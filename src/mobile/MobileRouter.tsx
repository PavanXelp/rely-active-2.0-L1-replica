import { Navigate, Route, Routes } from 'react-router-dom'
import MobileLayout from '@/mobile/layouts/MobileLayout'
import Dashboard from '@/pages/Dashboard'
import EventDetailPage from '@/pages/Events/EventDetail'
import EventsPage from '@/pages/Events'
import CreateEventPage from '@/pages/Events/book/CreateEvent'
import VenueDetailsPage from '@/pages/Events/book/VenueDetails'
import EventBookingPage from '@/pages/Events/book/EventBooking'
import EventRequestDetailPage from '@/pages/Events/book/EventRequestDetail'
import FnbPage from '@/pages/Fnb'
import Login from '@/pages/Login'
import ProfilePage from '@/pages/Profile'
import GatePage from '@/pages/Gate'
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
        <Route path="gate" element={<GatePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/book" element={<CreateEventPage />} />
        <Route path="events/book/venue/:venueId" element={<VenueDetailsPage />} />
        <Route path="events/book/confirm" element={<EventBookingPage />} />
        <Route path="events/bookings/:requestId" element={<EventRequestDetailPage />} />
        <Route path="events/:eventId" element={<EventDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  )
}
