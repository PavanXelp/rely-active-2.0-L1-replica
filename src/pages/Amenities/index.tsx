import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Clock3, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { amenityMobileService } from '@/lib/services/amenityService'
import type { L1AmenitySummary } from '@/lib/types/amenity'
import { toast } from 'sonner'

type AmenityFilter = 'ALL' | 'SLOT' | 'STANDARD'

function amenityTimeLabel(item: L1AmenitySummary): string {
  if (item.slotBookable && item.summary) {
    return `${item.summary.openLabel} - ${item.summary.closeLabel} · ${item.summary.durationLabel}`
  }
  if (item.availableFrom && item.availableTo) return `${item.availableFrom} - ${item.availableTo}`
  return item.slotBookable ? 'Setup pending' : 'Hours not set'
}

export default function AmenitiesPage() {
  const navigate = useNavigate()
  const [amenities, setAmenities] = useState<L1AmenitySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<AmenityFilter>('ALL')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const data = await amenityMobileService.listAmenities()
        if (!ignore) setAmenities(data)
      } catch (error) {
        console.error('Failed to load amenities:', error)
        if (!ignore) toast.error('Failed to load amenities')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return amenities
    if (filter === 'SLOT') return amenities.filter((item) => item.slotBookable)
    return amenities.filter((item) => !item.slotBookable)
  }, [amenities, filter])

  const slotCount = amenities.filter((item) => item.slotBookable).length
  const standardCount = amenities.length - slotCount

  return (
    <div className="space-y-4 pb-8 font-sans select-none">
      <div className="bg-[#005390] text-white p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black tracking-tight">Amenities</h2>
            <p className="text-[11px] text-blue-100 font-medium">View all amenities and book slot-based ones</p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className={`rounded-2xl px-2 py-2 text-[11px] font-bold cursor-pointer ${
            filter === 'ALL' ? 'bg-teal-600 text-white' : 'bg-card border border-border text-muted-foreground'
          }`}
          onClick={() => setFilter('ALL')}
        >
          All ({amenities.length})
        </button>
        <button
          type="button"
          className={`rounded-2xl px-2 py-2 text-[11px] font-bold cursor-pointer ${
            filter === 'SLOT' ? 'bg-teal-600 text-white' : 'bg-card border border-border text-muted-foreground'
          }`}
          onClick={() => setFilter('SLOT')}
        >
          Slot ({slotCount})
        </button>
        <button
          type="button"
          className={`rounded-2xl px-2 py-2 text-[11px] font-bold cursor-pointer ${
            filter === 'STANDARD' ? 'bg-teal-600 text-white' : 'bg-card border border-border text-muted-foreground'
          }`}
          onClick={() => setFilter('STANDARD')}
        >
          Standard ({standardCount})
        </button>
      </div>

      {loading ? (
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">Loading amenities...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="rounded-3xl border border-border/60 p-8 text-center text-muted-foreground">
          <p className="text-xs font-semibold">No amenities found for this filter.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <Card
              key={item.amenityId}
              className="rounded-3xl border border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/amenities/${item.amenityId}`)}
            >
              <CardContent className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-foreground truncate">{item.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5 line-clamp-2">
                      {item.description ||
                        (item.slotBookable ? 'Tap to view slots and book.' : 'Standard amenity for residents.')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Badge
                    className={`text-[9px] font-extrabold border-none ${
                      item.slotBookable
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.slotBookable ? 'Slot-based' : 'Standard'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-semibold inline-flex items-center gap-1">
                    <Clock3 className="w-3 h-3" />
                    {amenityTimeLabel(item)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
