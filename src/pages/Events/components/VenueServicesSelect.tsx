import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { L1AddOnService } from '@/lib/types/event'

function getServiceKey(service: L1AddOnService): string {
  return service.globalServiceId || service.name
}

function formatPrice(price?: number): string | null {
  if (price == null) return null
  return `₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function getServiceTotalPrice(price?: number, quantity?: number): number {
  const unit = Number(price ?? 0)
  const qty = quantity && quantity > 0 ? quantity : 1
  return unit * qty
}

interface VenueServicesSelectProps {
  services: L1AddOnService[]
  selectedServices: L1AddOnService[]
  onChange: (services: L1AddOnService[]) => void
}

export function VenueServicesSelect({ services, selectedServices, onChange }: VenueServicesSelectProps) {
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>({})

  const selectedMap = new Map(selectedServices.map((s) => [getServiceKey(s), s]))

  const toggleService = (service: L1AddOnService, checked: boolean) => {
    const key = getServiceKey(service)
    if (checked) {
      if (selectedMap.has(key)) return
      onChange([...selectedServices, { ...service, quantity: 1 }])
      return
    }
    setQuantityErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    onChange(selectedServices.filter((s) => getServiceKey(s) !== key))
  }

  const updateQuantity = (serviceKey: string, rawValue: string, maxQty: number) => {
    const parsed = parseInt(rawValue, 10)
    const nextQty = Number.isNaN(parsed) || rawValue.trim() === '' ? 1 : parsed

    if (nextQty > maxQty) {
      setQuantityErrors((prev) => ({
        ...prev,
        [serviceKey]: `Maximum allowed is ${maxQty}`,
      }))
      onChange(selectedServices.map((s) => (getServiceKey(s) === serviceKey ? { ...s, quantity: maxQty } : s)))
      return
    }

    setQuantityErrors((prev) => {
      if (!prev[serviceKey]) return prev
      const next = { ...prev }
      delete next[serviceKey]
      return next
    })

    onChange(
      selectedServices.map((s) => (getServiceKey(s) === serviceKey ? { ...s, quantity: Math.max(1, nextQty) } : s)),
    )
  }

  if (services.length === 0) {
    return <p className="text-xs text-muted-foreground">No services listed for this venue</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">Select services and set quantity (optional)</p>
      <div className="space-y-2">
        {services.map((service) => {
          const key = getServiceKey(service)
          const selected = selectedMap.get(key)
          const isChecked = Boolean(selected)
          const maxQty = service.quantity ?? 1
          const quantity = selected?.quantity ?? 1
          const total = getServiceTotalPrice(service.price, quantity)
          const qtyError = quantityErrors[key]
          const unitPrice = formatPrice(service.price)

          return (
            <div
              key={key}
              className={`rounded-xl border px-3 py-2.5 space-y-2 ${
                isChecked ? 'border-orange-200 bg-orange-50/40' : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => toggleService(service, checked === true)}
                  className="mt-0.5 data-checked:border-[#F97316] data-checked:bg-[#F97316]"
                  aria-label={service.name}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                      {service.keyFeatures && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{service.keyFeatures}</p>
                      )}
                      <p className="text-[10px] text-gray-500 mt-0.5">Max: {maxQty} for this venue</p>
                    </div>
                    {unitPrice && <span className="shrink-0 text-[11px] font-bold text-gray-700">{unitPrice}</span>}
                  </div>
                </div>
              </div>

              {isChecked && (
                <div className="pl-7 flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-medium">Qty</span>
                      <Input
                        type="number"
                        min={1}
                        max={maxQty}
                        step={1}
                        value={quantity}
                        onChange={(e) => updateQuantity(key, e.target.value, maxQty)}
                        className={`h-8 w-16 rounded-lg text-xs font-bold text-center px-2 ${
                          qtyError ? 'border-rose-400' : ''
                        }`}
                      />
                    </div>
                    {qtyError && (
                      <span className="text-[10px] text-rose-600 font-medium leading-tight">{qtyError}</span>
                    )}
                  </div>
                  {unitPrice && (
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400">
                        {unitPrice} × {quantity}
                      </div>
                      <div className="text-sm font-bold text-gray-900">{formatPrice(total)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VenueServicesSelect
