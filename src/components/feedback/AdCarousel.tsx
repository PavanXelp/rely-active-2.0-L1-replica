import { useEffect, useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdvertisements } from '@/hooks/useFeedback'
import { cn } from '@/lib/utils'
import type { Advertisement } from '@/lib/types/feedback'

const AUTOPLAY_MS = 5000

const AdSlide = ({ ad, onOpen }: { ad: Advertisement; onOpen: () => void }) => (
  <button
    type="button"
    onClick={onOpen}
    className="relative block w-full overflow-hidden rounded-3xl shadow-md cursor-pointer text-left"
  >
    <img src={ad.imageUrl} alt={ad.title} className="h-40 w-full object-cover" draggable={false} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 p-4">
      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur">
        <Megaphone className="h-2.5 w-2.5" /> Featured
      </span>
      <p className="mt-1 text-sm font-black text-white line-clamp-1">{ad.title}</p>
    </div>
  </button>
)

/** Full-screen detail view, positioned inside the phone frame rather than the browser viewport. */
const AdDetail = ({ ad, onClose }: { ad: Advertisement; onClose: () => void }) => (
  <div className="absolute inset-0 z-40 flex flex-col bg-black/60 backdrop-blur-sm" role="dialog" aria-label={ad.title}>
    <button type="button" aria-label="Close" className="flex-1 cursor-default" onClick={onClose} />
    <div className="max-h-[80%] overflow-y-auto rounded-t-[28px] bg-background pb-6 animate-in slide-in-from-bottom">
      <div className="relative">
        <img src={ad.imageUrl} alt={ad.title} className="w-full max-h-72 object-cover rounded-t-[28px]" />
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2 px-5 pt-4">
        <h3 className="text-lg font-black text-foreground">{ad.title}</h3>
        {ad.description && (
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{ad.description}</p>
        )}
      </div>
    </div>
  </div>
)

/** Property advertisements at the top of the home page: one banner, or an auto-playing carousel for several. */
export default function AdCarousel() {
  const { data: ads = [], isLoading } = useAdvertisements()
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const [openAd, setOpenAd] = useState<Advertisement | null>(null)

  const hasMany = ads.length > 1

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  // Auto-advance while the detail view is closed.
  useEffect(() => {
    if (!api || !hasMany || openAd) return
    const timer = setInterval(() => api.scrollNext(), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [api, hasMany, openAd])

  if (isLoading) return <Skeleton className="h-40 w-full rounded-3xl" />
  if (ads.length === 0) return null

  return (
    <>
      {hasMany ? (
        <div className="space-y-2">
          <Carousel setApi={setApi} opts={{ loop: true }}>
            <CarouselContent>
              {ads.map((ad) => (
                <CarouselItem key={ad.id}>
                  <AdSlide ad={ad} onOpen={() => setOpenAd(ad)} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center gap-1.5">
            {ads.map((ad, index) => (
              <button
                key={ad.id}
                type="button"
                aria-label={`Show advertisement ${index + 1}`}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  'h-1.5 rounded-full transition-all cursor-pointer',
                  index === selected ? 'w-5 bg-[#005390]' : 'w-1.5 bg-muted-foreground/30',
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        <AdSlide ad={ads[0]!} onOpen={() => setOpenAd(ads[0]!)} />
      )}

      {openAd && <AdDetail ad={openAd} onClose={() => setOpenAd(null)} />}
    </>
  )
}
