import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { eventMobileService } from '@/lib/services/eventService'
import type { L1AddOnService, L1VenueDetail, VenueBookingDraft } from '@/lib/types/event'
import { getFileUrl } from '@/lib/utils'
import { loadBookingDraft, saveBookingDraft, splitKeyFeatures } from '@/pages/Events/book/bookingState'
import { VenueServicesSelect } from '@/pages/Events/components/VenueServicesSelect'
import { toast } from 'sonner'

const ORANGE = '#F97316'

function getServiceKey(service: L1AddOnService): string {
  return service.globalServiceId || service.name
}

export default function VenueDetailsPage() {
  const navigate = useNavigate()
  const { venueId } = useParams<{ venueId: string }>()
  const location = useLocation()
  const stateDraft = (location.state as { draft?: VenueBookingDraft } | null)?.draft
  const draft = stateDraft || loadBookingDraft()

  const [venue, setVenue] = useState<L1VenueDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedServices, setSelectedServices] = useState<L1AddOnService[]>([])
  const [syncedVenueId, setSyncedVenueId] = useState<string | null>(null)

  useEffect(() => {
    if (!draft?.title || !draft.occupancy) {
      toast.error('Please complete event details first')
      navigate('/events/book', { replace: true })
    }
  }, [draft, navigate])

  useEffect(() => {
    if (!venueId) return
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const data = await eventMobileService.getVenueById(venueId)
        if (!ignore) setVenue(data)
      } catch (err) {
        console.error(err)
        if (!ignore) {
          toast.error('Failed to load venue details')
          setVenue(null)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [venueId])

  if (venue && venue.id !== syncedVenueId) {
    const currentDraft = stateDraft || loadBookingDraft()
    const available = Array.isArray(venue.addOnServices) ? venue.addOnServices : []
    const availableKeys = new Set(available.map(getServiceKey))
    const prior =
      currentDraft?.venueId === venue.id && Array.isArray(currentDraft.selectedServices)
        ? currentDraft.selectedServices.filter((s) => availableKeys.has(getServiceKey(s)))
        : []
    setSyncedVenueId(venue.id)
    setSelectedServices(prior)
  }

  const coverUrl = getFileUrl(venue?.coverPhoto)
  const photos = useMemo(() => {
    const imgs = Array.isArray(venue?.images) ? venue!.images! : []
    return imgs.map((img) => getFileUrl(img.url)).filter(Boolean)
  }, [venue])
  const keyFeatures = useMemo(() => splitKeyFeatures(venue?.keyFeatures), [venue])
  const venueServices = useMemo(() => (Array.isArray(venue?.addOnServices) ? venue!.addOnServices! : []), [venue])

  const handleNext = () => {
    if (!draft || !venue) return

    for (const service of selectedServices) {
      const maxQty = venueServices.find((s) => getServiceKey(s) === getServiceKey(service))?.quantity ?? 1
      const qty = service.quantity ?? 1
      if (qty < 1) {
        toast.error(`Quantity must be at least 1 for "${service.name}"`)
        return
      }
      if (qty > maxQty) {
        toast.error(`Quantity for "${service.name}" exceeds venue allocation (${maxQty} max)`)
        return
      }
    }

    const nextDraft: VenueBookingDraft = {
      ...draft,
      venueId: venue.id,
      venueName: venue.name,
      venueCoverPhoto: venue.coverPhoto,
      venuePrice: Number(venue.price ?? draft.venuePrice ?? 0),
      venueAddOnServices: venueServices,
      selectedServices,
    }
    saveBookingDraft(nextDraft)
    navigate('/events/book/confirm', { state: { draft: nextDraft } })
  }

  if (!draft) return null

  return (
    <div className="space-y-4 pb-24 font-sans select-none">
      <div className="bg-white sticky top-0 z-20 -mx-1 px-1 pt-1 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/events/book')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h2 className="flex-1 text-center text-base font-black tracking-tight pr-9">Available Venues</h2>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-xs text-muted-foreground py-10 font-semibold">Loading venue...</p>
      ) : !venue ? (
        <p className="text-center text-xs text-muted-foreground py-10 font-semibold">Venue not found</p>
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-[16/10]">
            {coverUrl ? (
              <img src={coverUrl} alt={venue.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ImageOff className="w-10 h-10" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-black text-gray-900">{venue.name}</h3>

          {photos.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Photos</h4>
              <div className="grid grid-cols-2 gap-3">
                {photos.map((url) => (
                  <div key={url} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
            <h4 className="text-sm font-bold text-gray-900">About Venue</h4>
            <p className="text-xs font-semibold text-gray-700">Key Features:</p>
            {keyFeatures.length > 0 ? (
              <ul className="space-y-1.5">
                {keyFeatures.map((feature) => (
                  <li key={feature} className="text-sm font-medium flex gap-2" style={{ color: ORANGE }}>
                    <span>•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No key features listed</p>
            )}
            <p className="text-xs text-gray-500 pt-1">Capacity: {venue.occupancy} people</p>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
            <h4 className="text-sm font-bold text-gray-900">Other services</h4>
            {venue.otherServices?.trim() && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{venue.otherServices}</p>
            )}
            <VenueServicesSelect
              services={venueServices}
              selectedServices={selectedServices}
              onChange={setSelectedServices}
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100 z-30">
            <div className="max-w-md mx-auto">
              <Button
                type="button"
                onClick={handleNext}
                className="w-full h-12 rounded-2xl text-white font-bold text-base"
                style={{ backgroundColor: ORANGE }}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
