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
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceDialog({ invoiceId, open, onOpenChange }: InvoiceDialogProps) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoice(invoiceId)
    }
  }, [open, invoiceId])

  const fetchInvoice = async (id: string) => {
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
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <FileText className="h-6 w-6" />
                Invoice
              </DialogTitle>
              {invoice && (
                <p className="text-sm text-muted-foreground">
                  {invoice.invoice_number || invoice.id}
                </p>
              )}
            </div>
            {invoice && getStatusBadge(invoice.status)}
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
          <div className="space-y-6 pt-4">
              {/* Invoice Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Customer Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Bill To</h3>
                  <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {invoice.customer_details.name || invoice.customer_details.customer_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <p className="text-sm">
                        {invoice.customer_details.email || invoice.customer_details.customer_email}
                      </p>
                    </div>
                    {(invoice.customer_details.contact || invoice.customer_details.customer_contact) && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <p className="text-sm">
                          {invoice.customer_details.contact || invoice.customer_details.customer_contact}
                        </p>
                      </div>
                    )}
                    {invoice.customer_details.billing_address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="text-sm">
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
                </div>

                {/* Right Column - Invoice Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Invoice Details</h3>
                  <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Issued Date</p>
                        <p className="font-medium">{formatDate(invoice.issued_at)}</p>
                      </div>
                    </div>
                    {invoice.paid_at && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Paid Date</p>
                          <p className="font-medium">{formatDate(invoice.paid_at)}</p>
                        </div>
                      </div>
                    )}
                    {invoice.payment_id && (
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Payment ID</p>
                          <p className="font-mono text-xs">{invoice.payment_id}</p>
                        </div>
                      </div>
                    )}
                    {invoice.order_id && (
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Order ID</p>
                          <p className="font-mono text-xs">{invoice.order_id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {invoice.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{invoice.description}</p>
                </div>
              )}

              <Separator />

              {/* Line Items */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Items</h3>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Item</th>
                        <th className="text-right p-3 font-medium text-sm">Qty</th>
                        <th className="text-right p-3 font-medium text-sm">Unit Price</th>
                        <th className="text-right p-3 font-medium text-sm">Tax</th>
                        <th className="text-right p-3 font-medium text-sm">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.line_items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="text-right p-3">{item.quantity}</td>
                          <td className="text-right p-3">
                            {formatCurrency(item.unit_amount, invoice.currency_symbol)}
                          </td>
                          <td className="text-right p-3">
                            {formatCurrency(item.tax_amount, invoice.currency_symbol)}
                          </td>
                          <td className="text-right p-3 font-medium">
                            {formatCurrency(item.amount, invoice.currency_symbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(invoice.taxable_amount, invoice.currency_symbol)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(invoice.tax_amount, invoice.currency_symbol)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.amount, invoice.currency_symbol)}</span>
                  </div>
                  {invoice.amount_paid > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Amount Paid</span>
                        <span>{formatCurrency(invoice.amount_paid, invoice.currency_symbol)}</span>
                      </div>
                      {invoice.amount_due > 0 && (
                        <div className="flex justify-between text-sm font-semibold text-orange-600 dark:text-orange-400">
                          <span>Amount Due</span>
                          <span>{formatCurrency(invoice.amount_due, invoice.currency_symbol)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                {invoice.short_url && (
                  <Button onClick={handleDownload}>
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
