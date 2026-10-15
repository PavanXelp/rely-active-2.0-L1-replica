import { useState } from 'react'
import { ChevronDown, Download, FileText, Loader2, ReceiptIndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useBills } from '@/hooks/useBills'
import { billingService } from '@/lib/services/billingService'
import type { Bill, BillStatus } from '@/lib/types/billing'
import { cn } from '@/lib/utils'

type ApiError = { response?: { data?: { message?: string } } }

const inr = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const day = (value: string | null) =>
  value
    ? new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

const STATUS: Partial<Record<BillStatus, { label: string; className: string }>> = {
  PENDING: { label: 'Due', className: 'bg-amber-500/10 text-amber-700' },
  OVERDUE: { label: 'Overdue', className: 'bg-rose-500/10 text-rose-600' },
  PARTIALLY_PAID: { label: 'Part paid', className: 'bg-blue-500/10 text-blue-700' },
  PAID: { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-700' },
  CARRY_FORWARDED: { label: 'Moved to a later bill', className: 'bg-purple-500/10 text-purple-700' },
  OBSOLETE: { label: 'Moved to a later bill', className: 'bg-purple-500/10 text-purple-700' },
}

/** Owed now: unpaid bills whose balance hasn't moved to a later bill. */
const isOpen = (bill: Bill) => ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(bill.status)

const BillCard = ({ bill }: { bill: Bill }) => {
  const [expanded, setExpanded] = useState(false)
  const [opening, setOpening] = useState<string | null>(null)
  const status = STATUS[bill.status] ?? { label: bill.status, className: 'bg-muted text-muted-foreground' }

  const openPdf = async (key: string, receiptId?: string) => {
    const tab = window.open('', '_blank')
    setOpening(key)
    try {
      const url = await billingService.getPdfUrl(bill.id, receiptId)
      if (tab) tab.location.href = url
      else window.location.assign(url)
    } catch (error) {
      tab?.close()
      toast.error((error as ApiError)?.response?.data?.message || 'Could not open the PDF')
    } finally {
      setOpening(null)
    }
  }

  return (
    <div className="rounded-3xl border bg-card p-4 shadow-xs">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-start gap-3 text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#005390]/10 text-[#005390]">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-foreground">
              {day(bill.startDate)} – {day(bill.endDate)}
            </p>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', status.className)}>
              {status.label}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground">
            {bill.invoiceNumber}
            {bill.dueDate && isOpen(bill) ? ` • due ${day(bill.dueDate)}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-foreground">{inr(bill.discountedAmount)}</p>
          {isOpen(bill) && bill.paidAmount > 0 && (
            <p className="text-[11px] font-semibold text-amber-700">{inr(bill.remainingBalance)} left</p>
          )}
        </div>
        <ChevronDown
          className={cn('mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 border-t pt-3">
          <div className="space-y-2">
            {bill.services.map((line) => (
              <div key={line.id} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{line.name}</p>
                  {line.consumerName && (
                    <p className="text-[10px] font-semibold text-[#005390]">
                      {line.consumerType === 'FAMILY_MEMBER' ? 'Family member' : 'Resident'} · {line.consumerName}
                    </p>
                  )}
                  {line.description && <p className="text-[11px] text-muted-foreground">{line.description}</p>}
                </div>
                <p className={cn('shrink-0 font-semibold', line.total < 0 && 'text-emerald-600')}>{inr(line.total)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1 rounded-2xl bg-muted/50 p-3 text-xs">
            {bill.discount !== 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>- {inr(bill.discount)}</span>
              </div>
            )}
            {bill.carriedForwardAmount !== 0 && (
              <div className="flex justify-between text-purple-700">
                <span>Previous balance carried forward</span>
                <span>{inr(bill.carriedForwardAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{inr(bill.discountedAmount)}</span>
            </div>
            {bill.paidAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Paid</span>
                <span>{inr(bill.paidAmount)}</span>
              </div>
            )}
            {bill.carriedForwardTo ? (
              bill.status === 'PAID' ? (
                <p className="font-semibold text-emerald-700">Paid via {bill.carriedForwardTo.invoiceNumber}</p>
              ) : (
                <p className="text-purple-700">
                  Moved to {bill.carriedForwardTo.invoiceNumber}
                  {bill.carriedForwardTo.paidAmount > 0 &&
                    ` · ${inr(bill.carriedForwardTo.paidAmount)} of ${inr(bill.carriedForwardTo.amount)} paid`}
                </p>
              )
            ) : (
              bill.paidAmount > 0 && (
                <div className="flex justify-between font-semibold">
                  <span>Remaining balance</span>
                  <span className={bill.remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                    {inr(bill.remainingBalance)}
                  </span>
                </div>
              )
            )}
          </div>
          {bill.receipts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Payments</p>
              {bill.receipts.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => openPdf(r.id, r.id)}
                  className="flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-xs"
                >
                  <span>
                    {day(r.createdAt)} • {r.paymentMethod.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-2 font-bold">
                    {inr(r.paidAmount)}
                    {r.invoiceRemainingBalance !== null && (
                      <span className="font-normal text-muted-foreground">· {inr(r.invoiceRemainingBalance)} left</span>
                    )}
                    {opening === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => openPdf(bill.id)}
            disabled={opening === bill.id}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#005390] py-2.5 text-xs font-bold text-white"
          >
            {opening === bill.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download bill
          </button>
        </div>
      )}
    </div>
  )
}

export default function BillsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useBills(page)
  const bills = data?.invoices ?? []
  const due = bills.filter(isOpen).reduce((sum, b) => sum + b.remainingBalance, 0)

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-xl font-black tracking-tight text-foreground">My Bills</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Invoices and payments for your flat</p>
      </div>

      {error ? (
        <div className="rounded-3xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {(error as ApiError)?.response?.data?.message || 'Could not load your bills.'}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
        </div>
      ) : bills.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border bg-card p-8 text-center">
          <ReceiptIndianRupee className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-bold">No bills yet</p>
        </div>
      ) : (
        <>
          {due > 0 && (
            <div className="rounded-3xl bg-gradient-to-br from-[#005390] to-[#2a517c] p-4 text-white">
              <p className="text-[11px] font-semibold opacity-80">Amount due</p>
              <p className="text-2xl font-black">{inr(due)}</p>
            </div>
          )}
          <div className="space-y-3">
            {bills.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
          {(data?.pagination.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-between text-xs font-semibold">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="disabled:opacity-40"
              >
                Newer
              </button>
              <span className="text-muted-foreground">
                Page {page} of {data?.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= (data?.pagination.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                className="disabled:opacity-40"
              >
                Older
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
