export type BillStatus =
  'DRAFT' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'OVERDUE' | 'OBSOLETE' | 'CARRY_FORWARDED'

export interface BillLine {
  id: string
  serviceType: string
  name: string
  description: string | null
  consumerType: 'RESIDENT' | 'FAMILY_MEMBER' | null
  consumerName: string | null
  quantity: number
  price: number
  total: number
}

export interface BillReceipt {
  id: string
  receiptNumber: string
  paidAmount: number
  paymentMethod: string
  createdAt: string
  /** Still owed on the bill after this payment. */
  invoiceRemainingBalance: number | null
}

export interface Bill {
  id: string
  invoiceNumber: string
  unitNumber: string | null
  startDate: string
  endDate: string
  subtotal: number
  discount: number
  discountedAmount: number
  paidAmount: number
  /** Still owed; 0 once paid or moved to a later bill. */
  remainingBalance: number
  carriedForwardAmount: number
  /** Moved into a later bill; paidAmount is what has been paid on it there. */
  carriedForwardTo: { invoiceNumber: string; amount: number; paidAmount: number } | null
  status: BillStatus
  dueDate: string | null
  createdAt: string
  billTo: { name: string } | null
  services: BillLine[]
  receipts: BillReceipt[]
}
