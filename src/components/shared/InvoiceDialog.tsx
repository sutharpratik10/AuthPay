"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Download,
  Calendar,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface InvoiceData {
  id: string
  entity: string
  invoice_number: string | null
  customer_id: string
  customer_details: {
    id: string
    name: string
    email: string
    contact: string
    billing_address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      zipcode?: string
      country?: string
    }
    customer_name?: string
    customer_email?: string
    customer_contact?: string
  }
  order_id: string
  line_items: Array<{
    id: string
    name: string
    description: string
    amount: number
    unit_amount: number
    gross_amount: number
    tax_amount: number
    net_amount: number
    currency: string
    quantity: number
    taxes: unknown[]
  }>
  payment_id: string | null
  status: string
  expire_by: number | null
  issued_at: number
  paid_at: number | null
  cancelled_at: number | null
  expired_at: number | null
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  currency_symbol: string
  description: string
  short_url: string
  created_at: number
  gross_amount: number
  tax_amount: number
  taxable_amount: number
}

interface InvoiceDialogProps {
  invoiceId?: string | null
  subscriptionId?: string | null
  provider?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceDialog({ invoiceId, subscriptionId, provider, open, onOpenChange }: InvoiceDialogProps) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (invoiceId) {
        fetchInvoiceById(invoiceId)
      } else if (subscriptionId) {
        fetchInvoiceBySubscription(subscriptionId, provider || 'razorpay')
      }
    }
  }, [open, invoiceId, subscriptionId, provider])

  const fetchInvoiceById = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const isStripe = id.startsWith('in_') && !id.startsWith('inv_');
      const endpoint = isStripe
        ? `/api/payments/stripe-invoices/${encodeURIComponent(id)}`
        : `/api/payments/razorpay-invoices/${encodeURIComponent(id)}`;

      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error('Failed to fetch invoice')
      }
      const data = await response.json()
      setInvoice(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoiceBySubscription = async (subId: string, paymentProvider: string) => {
    setLoading(true)
    setError(null)
    try {
      const isStripe = paymentProvider === 'stripe'
      const endpoint = isStripe
        ? `/api/payments/stripe-invoices?subscription_id=${encodeURIComponent(subId)}&limit=1`
        : `/api/payments/razorpay-invoices?subscription_id=${encodeURIComponent(subId)}`

      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error('Failed to fetch invoice for subscription')
      }
      const data = await response.json()
      if (data?.items && data.items.length > 0) {
        setInvoice(data.items[0])
      } else {
        throw new Error('No invoice found for this subscription')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currencySymbol: string = '₹') => {
    return `${currencySymbol}${(amount / 100).toFixed(2)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      paid: { variant: 'default', label: 'Paid' },
      issued: { variant: 'secondary', label: 'Issued' },
      partially_paid: { variant: 'outline', label: 'Partially Paid' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      expired: { variant: 'destructive', label: 'Expired' },
      draft: { variant: 'outline', label: 'Draft' }
    }
    const config = statusConfig[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleDownload = () => {
    if (invoice?.short_url) {
      window.open(invoice.short_url, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" hideClose>
        <DialogHeader className="mb-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <DialogTitle className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                <FileText className="h-7 w-7 text-primary" />
                AuthPay Invoice
              </DialogTitle>
              {invoice && (
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  Invoice No. <span className="text-foreground">{invoice.invoice_number || invoice.id}</span>
                </p>
              )}
            </div>
            {invoice && (
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(invoice.status)}
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : invoice ? (
          <div className="space-y-8">
            {/* Top Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 rounded-xl border border-border dark:border-gray-700 bg-muted/30">

              {/* Bill To */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Billed To</h3>

                <div className="space-y-1.5">
                  <p className="font-semibold text-lg text-foreground">
                    {invoice.customer_details.name || invoice.customer_details.customer_name}
                  </p>
                  <p className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {invoice.customer_details.email || invoice.customer_details.customer_email}
                  </p>
                  {(invoice.customer_details.contact || invoice.customer_details.customer_contact) && (
                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {invoice.customer_details.contact || invoice.customer_details.customer_contact}
                    </p>
                  )}
                </div>

                {invoice.customer_details.billing_address && (
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground space-y-1">
                      {invoice.customer_details.billing_address.line1 && (
                        <p>{invoice.customer_details.billing_address.line1}</p>
                      )}
                      {invoice.customer_details.billing_address.line2 && (
                        <p>{invoice.customer_details.billing_address.line2}</p>
                      )}
                      <p>
                        {[
                          invoice.customer_details.billing_address.city,
                          invoice.customer_details.billing_address.state,
                          invoice.customer_details.billing_address.zipcode
                        ].filter(Boolean).join(', ')}
                      </p>
                      {invoice.customer_details.billing_address.country && (
                        <p className="uppercase">{invoice.customer_details.billing_address.country}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Invoice Details</h3>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Issued Date
                    </p>
                    <p className="font-medium text-sm">{formatDate(invoice.issued_at)}</p>
                  </div>

                  {invoice.paid_at && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Paid Date
                      </p>
                      <p className="font-medium text-sm">{formatDate(invoice.paid_at)}</p>
                    </div>
                  )}

                  {invoice.payment_id && (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" /> Payment ID
                      </p>
                      <p className="font-mono text-xs break-all bg-background px-2 py-1 rounded border inline-block mt-1">{invoice.payment_id}</p>
                    </div>
                  )}

                  {invoice.order_id && (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Order ID
                      </p>
                      <p className="font-mono text-xs break-all bg-background px-2 py-1 rounded border inline-block mt-1">{invoice.order_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {invoice.description && (
              <div className="bg-muted/20 p-4 rounded-lg border border-border dark:border-gray-700">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Note:</span> {invoice.description}
                </p>
              </div>
            )}

            {/* Line Items */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Items Summary</h3>
              <div className="rounded-xl border border-border dark:border-gray-700 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border dark:border-gray-700">
                    <tr>
                      <th className="text-left p-4 font-semibold text-muted-foreground">Description</th>
                      <th className="text-right p-4 font-semibold text-muted-foreground">Qty</th>
                      <th className="text-right p-4 font-semibold text-muted-foreground">Unit Price</th>
                      <th className="text-right p-4 font-semibold text-muted-foreground">Tax</th>
                      <th className="text-right p-4 font-semibold text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-gray-700">
                    {invoice.line_items.map((item) => (
                      <tr key={item.id} className="bg-background/50">
                        <td className="p-4">
                          <p className="font-medium text-foreground">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </td>
                        <td className="text-right p-4 text-muted-foreground">{item.quantity}</td>
                        <td className="text-right p-4 text-muted-foreground">
                          {formatCurrency(item.unit_amount, invoice.currency_symbol)}
                        </td>
                        <td className="text-right p-4 text-muted-foreground">
                          {formatCurrency(item.tax_amount, invoice.currency_symbol)}
                        </td>
                        <td className="text-right p-4 font-medium text-foreground">
                          {formatCurrency(item.amount, invoice.currency_symbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <div className="hidden md:block">
                {/* Empty left column to push totals to the right */}
              </div>

              <div className="rounded-xl border border-border dark:border-gray-700 p-6 bg-muted/10 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoice.taxable_amount, invoice.currency_symbol)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(invoice.tax_amount, invoice.currency_symbol)}</span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-foreground tracking-tight">
                    {formatCurrency(invoice.amount, invoice.currency_symbol)}
                  </span>
                </div>

                {(invoice.amount_paid > 0 || invoice.amount_due > 0) && (
                  <div className="pt-4 space-y-2">
                    {invoice.amount_paid > 0 && (
                      <div className="flex justify-between text-sm p-2 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium border border-green-200 dark:border-green-900/30">
                        <span>Amount Paid</span>
                        <span>{formatCurrency(invoice.amount_paid, invoice.currency_symbol)}</span>
                      </div>
                    )}
                    {invoice.amount_due > 0 && (
                      <div className="flex justify-between text-sm p-2 rounded-md bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold border border-orange-200 dark:border-orange-900/30">
                        <span>Amount Due</span>
                        <span>{formatCurrency(invoice.amount_due, invoice.currency_symbol)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border mt-8">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {invoice.short_url && (
                <Button onClick={handleDownload} className="shadow-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
