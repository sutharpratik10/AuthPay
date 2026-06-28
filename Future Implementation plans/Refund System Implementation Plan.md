Now I have a thorough picture of the entire payment system. Here's the complete plan.

---

## Refund System Implementation Plan

### Architecture Overview

```
User requests refund (via user dashboard)
  → Refund request created in DB with status 'pending'
    → Admin approves/denies
      → If approved: API calls gateway refund → updates DB → notifies user
      → If denied: marks request as rejected → notifies user
```

The refund system will support **user-initiated refund requests via a user UI** and an **admin approval workflow**. Users can request refunds directly from their dashboard, which creates a pending request for admins to process.

### Database Changes

**New table `refund_requests`** (in `src/server/db/schema/schema.ts`):

| Column | Type | Purpose |
|---|---|---|
| `id` | `uuid` PK | Internal ID |
| `paymentOrderId` | `uuid` FK → payment_orders | Which payment to refund |
| `userId` | `uuid` FK → users | The user receiving the refund |
| `planId` | `uuid` FK → subscription_plans | Plan being refunded |
| `amountMinor` | `integer` | Refund amount in smallest currency unit (paisa/cents) |
| `currency` | `varchar(3)` | e.g., INR, USD |
| `reason` | `text` | Why the refund is being processed |
| `status` | `varchar(20)` | `pending`, `approved`, `rejected`, `completed`, `failed` |
| `gateway` | `varchar(50)` | `razorpay` or `stripe` |
| `gatewayPaymentId` | `varchar(150)` | Provider payment ID to refund |
| `gatewayRefundId` | `varchar(150)` | Provider refund ID (after processing) |
| `gatewayResponse` | `jsonb` | Full gateway response for audit |
| `approvedBy` | `uuid` FK → users | Admin who approved |
| `approvedAt` | `timestamp` | When approved |
| `processedAt` | `timestamp` | When refund was sent to gateway |
| `completedAt` | `timestamp` | When refund was confirmed |
| `failureReason` | `text` | If failed, why |
| `revokeSubscription` | `boolean` | Whether to cancel the associated subscription |
| `subscriptionAction` | `varchar(20)` | `none`, `cancelled`, `keep_active` |
| `createdAt` | `timestamp` | Default now |
| `updatedAt` | `timestamp` | Default now |

**Migration**: `drizzle-kit generate` will create a new migration file.

### Files to Create (12 new files)

| # | File | Purpose |
|---|---|---|
| 1 | `src/server/services/refund.ts` | `RefundService` — core refund logic: `createRefundRequest()`, `approveRefund()`, `processRefund()`, `rejectRefund()`, `cancelSubscriptionOnRefund()`, `getRefundRequests()`, `getRefundStats()` |
| 2 | `src/app/api/admin/refunds/route.ts` | `GET` — List all refund requests (paginated, filterable by status/date/gateway). `POST` — Create a new admin-initiated refund request |
| 3 | `src/app/api/admin/refunds/[id]/route.ts` | `GET` — Single refund detail. `PATCH` — Approve/reject refund (`{ action: 'approve' | 'reject', reason?: string }`) |
| 4 | `src/app/api/admin/refunds/stats/route.ts` | `GET` — Refund stats (total refunded amount, pending count, approval rate, monthly breakdown) |
| 5 | `src/app/api/user/refunds/route.ts` | `POST` — Create a user-initiated refund request |
| 6 | `src/app/api/webhooks/razorpay/refund/route.ts` | `POST` — Razorpay refund webhook handler (`refund.created`, `refund.processed`) |
| 7 | `src/app/api/webhooks/stripe/refund/route.ts` | `POST` — Stripe refund event handler (`charge.refund.updated`, `refund.created`, `refund.failed`) |
| 8 | `src/components/admin/RefundRequests.tsx` | Full admin UI: refund requests table with filters, approve/deny dialog, create refund dialog, refund detail drawer |
| 9 | `src/components/admin/RefundDialog.tsx` | Reusable dialog: approve (with revoke subscription option) or deny (with reason input) |
| 10 | `src/components/admin/CreateRefundDialog.tsx` | Form to initiate a refund: search user/payment, enter amount, reason, revoke subscription toggle |
| 11 | `src/components/user/RequestRefundModal.tsx` | User-facing UI to select a payment/subscription and request a refund with a reason |
| 12 | `src/lib/email/templates/refund.ts` | Email templates: `refundRequestedTemplate()`, `refundApprovedTemplate()`, `refundCompletedTemplate()`, `refundRejectedTemplate()` |

### Files to Modify (11 files)

| # | File | Changes |
|---|---|---|
| 1 | `src/server/db/schema/schema.ts` | Add `refundRequests` table definition |
| 2 | `src/server/db/schema/relations.ts` | Add relations: refund_requests → users, refund_requests → payment_orders |
| 3 | `src/server/db/schema/index.ts` | Export `refundRequests` |
| 4 | `src/lib/payments/gateway.ts` | Add `createRefund()` to `PaymentProvider` interface |
| 5 | `src/lib/payments/providers/razorpay.ts` | Implement `createRefund()` using `razorpay.payments.refund(paymentId, { amount, speed: 'normal', notes })` |
| 6 | `src/lib/payments/providers/stripe.ts` | Implement `createRefund()` using `stripe.refunds.create({ payment_intent, amount })` |
| 7 | `src/components/admin/AdminDashboard.tsx` | Add refund stats widgets and link to refund management |
| 8 | `src/server/services/email.ts` | Add `sendRefundRequestedEmail()`, `sendRefundApprovedEmail()`, `sendRefundCompletedEmail()`, `sendRefundRejectedEmail()` methods |
| 9 | `src/components/admin/RazorPay.tsx` or `Transactions.tsx` | Add "Issue Refund" action button on payment rows |
| 10 | `src/lib/api/permissions.ts` | Add `REFUND_MANAGE: { policy: 'billing:manage' }` and `REFUND_VIEW: { policy: 'billing:view' }` to `API_POLICIES` |
| 11 | `src/components/user/BillingDashboard.tsx` (or similar) | Add "Request Refund" button for recent payments/subscriptions |

### Gateway Refund API Details

#### Razorpay (`razorpay.payments.refund`)

```typescript
// In RazorpayProvider:
async createRefund(input: {
  paymentId: string;        // razorpay payment_id (e.g., pay_...)
  amount: number;           // in paise (minor units)
  notes?: Record<string, string>;
  receipt?: string;
}): Promise<{
  refundId: string;         // rfnd_...
  status: string;           // pending, processed
  amount: number;
  createdAt: number;
}> {
  const response = await razorpay.payments.refund(input.paymentId, {
    amount: input.amount,
    speed: 'normal',
    notes: input.notes,
    receipt: input.receipt,
  });
  return {
    refundId: response.id,
    status: response.status,
    amount: response.amount,
    createdAt: response.created_at,
  };
}
```

**Key Razorpay refund behaviors:**
- Payment must be in `captured` state (not `authorized`)
- `amount` in paise (e.g., ₹500 = 50000)
- `speed` is always set to `'normal'` (5-7 business days)
- Test mode requires sufficient test balance (add refund credits in dashboard)
- Refund response includes `status`: `pending` (normal)
- Webhooks: `refund.created`, `refund.processed` — need to configure in Razorpay dashboard

#### Stripe (`stripe.refunds.create`)

```typescript
// In StripeProvider:
async createRefund(input: {
  paymentIntentId?: string;  // pi_...
  chargeId?: string;         // ch_... (alternative)
  amount?: number;           // in cents (minor units), omit for full refund
  reason?: string;           // 'requested_by_customer' | 'duplicate' | 'fraudulent'
  metadata?: Record<string, string>;
}): Promise<{
  refundId: string;         // re_...
  status: string;           // succeeded, pending, failed
  amount: number;
  currency: string;
}> {
  const response = await stripe.refunds.create({
    payment_intent: input.paymentIntentId,
    charge: input.chargeId,
    amount: input.amount,
    reason: input.reason,
    metadata: input.metadata,
  });
  return {
    refundId: response.id,
    status: response.status,
    amount: response.amount,
    currency: response.currency,
  };
}
```

**Key Stripe refund behaviors:**
- Can use `payment_intent` or `charge` (Stripe recommends `payment_intent`)
- Omit `amount` for full refund; specify for partial
- `status`: `succeeded` (immediate), `pending` (async methods)
- `reason` is informational only (Stripe doesn't enforce)
- Events: `charge.refund.updated`, `refund.created`, `refund.failed`, `refund.updated`
- Stripe webhooks already set up in existing `stripe-webhook` route — extend it

### Gateway Abstraction Update

The `PaymentProvider` interface (`src/lib/payments/gateway.ts`) currently has:
```typescript
export interface PaymentProvider {
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPayment(options: Record<string, unknown>): Promise<boolean>;
}
```

**Add:**
```typescript
export interface RefundInput {
  providerPaymentId: string;  // Gateway-specific payment ID
  amountMinor: number;        // In smallest currency unit
  currency?: string;
  reason?: string;
  notes?: Record<string, string>;
  receipt?: string;
}

export interface RefundResult {
  success: boolean;
  providerRefundId: string;
  status: string;
  amountMinor: number;
  currency: string;
  gatewayResponse?: Record<string, unknown>;
}

export interface PaymentProvider {
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPayment(options: Record<string, unknown>): Promise<boolean>;
  createRefund(input: RefundInput): Promise<RefundResult>;  // NEW
}
```

### Core Service (`RefundService`)

```typescript
class RefundService {
  // User creates a refund request
  async createUserRefundRequest(userId: string, input: {
    paymentOrderId: string;
    reason: string;
  }): Promise<RefundRequest>

  // Admin creates a refund request
  async createRefundRequest(adminId: string, input: {
    paymentOrderId: string;
    amountMinor: number;
    reason: string;
    revokeSubscription: boolean;
  }): Promise<RefundRequest>

  // Admin approves and processes
  async approveRefund(adminId: string, refundId: string): Promise<{
    success: boolean;
    refundRequest: RefundRequest;
  }>

  // Process the actual gateway refund call
  async processRefund(refundRequest: RefundRequest): Promise<void>

  // Admin rejects
  async rejectRefund(adminId: string, refundId: string, reason: string): Promise<RefundRequest>

  // Handle webhook updates from gateway
  async handleWebhookUpdate(refundId: string, gatewayStatus: string): Promise<void>

  // Cancel subscription if requested
  async cancelSubscriptionOnRefund(paymentOrderId: string): Promise<void>

  // Get refund requests with pagination and filters
  async getRefundRequests(filters: {
    status?: string;
    gateway?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
  }): Promise<{ requests: RefundRequest[]; total: number }>

  // Get refund statistics
  async getRefundStats(): Promise<{
    totalRefunded: number;
    pendingCount: number;
    approvedCount: number;
    completedCount: number;
    rejectedCount: number;
    failedCount: number;
    monthlyBreakdown: Array<{ month: string; count: number; amount: number }>;
  }>
}
```

### Complete Flows

#### Flow 1: User Requests Refund

```
User Dashboard → Billing → Find payment/subscription
  ├─ Click "Request Refund" → RequestRefundModal opens
  │     ├─ System calculates used time, remaining time, and eligible pro-rata refund
  │     ├─ UI displays breakdown: "Time Used: X. Unused Time: Y. Fixed Refund Amount: ₹Z"
  │     ├─ User enters: reason
  │     ├─ POST /api/user/refunds
  │     │     Body: { paymentOrderId, reason, expectedRefundAmountMinor }
  │     │     Server:
  │     │       ├─ Validate payment belongs to user
  │     │       ├─ Check payment is not already refunded or pending
  │     │       ├─ Create refund_requests record (status: 'pending') with locked amount
  │     │       ├─ Pause user's subscription access (set status to 'paused')
  │     │       ├─ Log to audit_logs
  │     │       └─ Send email: refundRequestedTemplate() → Admin
  │     └─ Shows success message. User loses access to services while request is pending review.
```

#### Flow 2: Admin Creates & Approves Refund

```
Admin Dashboard → Transactions → Find payment → "Issue Refund"

  ├─ Click "Issue Refund" → CreateRefundDialog opens
  │     ├─ Pre-filled: user, plan, amount, payment ID
  │     ├─ Admin enters: reason, partial amount (or full), revoke subscription? toggle (checked by default for full refunds)
  │     ├─ POST /api/admin/refunds
  │     │     Body: { paymentOrderId, amountMinor, reason, revokeSubscription }
  │     │     Server:
  │     │       ├─ Validate payment exists (payment_orders)
  │     │       ├─ Check payment is not already refunded
  │     │       ├─ Check amount ≤ payment amount
  │     │       ├─ Create refund_requests record (status: 'pending')
  │     │       ├─ Log to audit_logs
  │     │       └─ Return { refundRequest }
  │     └─ Shows success toast, redirects to refund requests list
  │
  ├─ Admin reviews refund in RefundRequests table
  │     ├─ Shows: user, amount, reason, status, gateway
  │     ├─ Actions: [Approve] [Deny]
  │     │
  │     ├─ Click [Deny]
  │     │     ├─ Dialog: "Reason for rejection?" (optional textarea)
  │     │     ├─ PATCH /api/admin/refunds/:id { action: 'reject', reason: '...' }
  │     │     │     ├─ Update status to 'rejected'
  │     │     │     ├─ Unpause user's subscription access (restore 'active' status)
  │     │     │     ├─ Log to audit_logs
  │     │     │     ├─ Send email: refundRejectedTemplate() → user
  │     │     │     └─ Return success
  │     │     └─ UI: status badge turns red, shows rejection reason
  │     │
  │     └─ Click [Approve]
  │           ├─ Dialog: "Confirm refund" + "Revoke subscription"
  │           ├─ PATCH /api/admin/refunds/:id { action: 'approve', revokeSubscription }
  │           │     ├─ Update status to 'approved', set approvedBy, approvedAt
  │           │     ├─ Call RefundService.processRefund()
  │           │     │     ├─ Find payment_order → get provider + providerPaymentId
  │           │     │     ├─ If razorpay: razorpay.payments.refund(paymentId, { amount, speed: 'normal' })
  │           │     │     ├─ If stripe: stripe.refunds.create({ payment_intent, amount })
  │           │     │     ├─ Store gateway refund ID + response
  │           │     │     ├─ Update status to 'completed' or mark as 'processing' if async
  │           │     │     ├─ Create payment_transactions log (event: 'refund')
  │           │     │     ├─ If revokeSubscription: cancel user's subscription
  │           │     │     ├─ Log to audit_logs
  │           │     │     └─ Send email: refundApprovedTemplate() → user
  │           │     └─ Return { success, refundRequest }
  │           └─ UI: status badge updates, user gets email
```

#### Flow 3: Webhook-Based Async Refund Status

```
Razorpay: refund.processed webhook
  └─ POST /api/webhooks/razorpay/refund
        ├─ Verify webhook signature (similar to existing Stripe webhook pattern)
        ├─ Extract refund_id, status, payment_id
        ├─ Find refund_requests by gatewayRefundId
        ├─ If status === 'processed':
        │     ├─ Update status to 'completed'
        │     ├─ Set completedAt
        │     ├─ Send email: refundCompletedTemplate() → user
        └─ If status === 'failed':
              ├─ Update status to 'failed'
              ├─ Set failureReason
              ├─ Notify admin

Stripe: refund.created, refund.failed events
  └─ Extend existing stripe-webhook route
        ├─ Handle 'charge.refund.updated' and 'refund.failed'
        ├─ Same logic as above
```

### User-Facing Pro-Rata Refund Calculation

When a user requests a refund for an active subscription, the system calculates the eligible refund amount based on the exact unused time (down to the minute). This transparent calculation must be shown to the user in the `RequestRefundModal` to set clear expectations.

#### Calculation Logic (Backend & Frontend)

1. **Identify Plan Terms**: Get the `price` and `duration` (e.g., 30 days for monthly, 365 days for yearly) of the subscription plan.
2. **Calculate Per-Minute Rate**:
   - `Total Minutes = Duration in Days * 24 * 60`
   - `Per-Minute Rate = Total Price / Total Minutes`
3. **Calculate Time Used**:
   - `Time Used (Minutes) = Current Date/Time - Subscription Start Date/Time`
4. **Calculate Remaining Time & Amount**:
   - `Remaining Minutes = Total Minutes - Time Used (Minutes)`
   - `Eligible Refund Amount = Remaining Minutes * Per-Minute Rate`

*(Note: The system handles this using Unix timestamps to compute the precise minute differences).*

#### User Interface (RequestRefundModal)

To clearly explain this to the user without causing confusion, the UI will display a breakdown similar to an invoice:

**Refund Estimate:**
- **Total Plan Cost:** ₹999.00 (Monthly)
- **Time Used:** 12 Days, 4 Hours
- **Unused Time:** 17 Days, 20 Hours
- **Fixed Refund Amount:** ₹594.50

*Disclaimer: "Your refund is calculated pro-rata based on the exact time remaining on your billing cycle. By submitting this request, your access to the service will be paused immediately, and the refund amount will be locked in while your request is pending review."*

By showing this breakdown, the user understands exactly *why* they are receiving a specific partial amount instead of a full refund. The backend locks in this exact calculation at the time of the request.

### Admin UI Design

The **RefundRequests.tsx** component will appear as a new tab in the admin dashboard:

```
┌─────────────────────────────────────────────────────────┐
│  🔄 Refund Requests                  [+ New Refund]     │
├─────────────────────────────────────────────────────────┤
│  Filters: [Status ▼] [Gateway ▼] [Date Range] [Search]  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │ #123 | user@example.com | ₹499 | Silver Plan   │  │
│  │      | Razorpay | 2 min ago      [Approve][Deny] │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ #122 | user2@example.com | $29 | Gold Plan     │  │
│  │      | Stripe | 1 hour ago        [View Only]    │  │  ← completed
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Summary: Pending: 3 | Completed: 12 | Total: ₹14,230   │
└─────────────────────────────────────────────────────────┘
```

### RBAC Policy Integration

Add to `API_POLICIES` in `src/lib/api/permissions.ts`:
```typescript
BILLING_REFUND: { policy: 'billing:manage' },
```

This ensures only users with the `billing:manage` policy can access refund endpoints. Seed script (`seed-rbac-policies.ts`) should add this to default roles.

### Email Notifications

| Email | Template | Trigger |
|---|---|---|
| Refund Requested | `refundRequestedTemplate()` | User requests a refund (sent to Admin/Support) |
| Refund Approved | `refundApprovedTemplate()` | Admin approves, refund being processed |
| Refund Completed | `refundCompletedTemplate()` | Gateway confirms refund (webhook) |
| Refund Rejected | `refundRejectedTemplate()` | Admin rejects with reason |

Each email includes: amount, plan name, reason, refund ID, estimated timeline.

### Security & Edge Cases

| Concern | Mitigation |
|---|---|
| **Double refund** | Check `payment_orders.status` before creating refund; check existing `refund_requests` for same `paymentOrderId` with non-rejected status |
| **Refund > original amount** | Validate `amountMinor ≤ paymentOrder.amountMinor` |
| **Refund of already-refunded payment** | Gateway will return error (400 from Razorpay, error from Stripe) — catch and set status to `failed` |
| **Payment not captured** | Razorpay: only captured payments can be refunded. Check payment status first |
| **Partial refund limit** | Razorpay: can refund up to remaining unrefunded amount. Track cumulative refunds per payment |
| **Gateway timeout** | Set refund to `processing` status, webhook will update to `completed`/`failed` |
| **Subscription already cancelled** | If `revokeSubscription` is true but subscription is already cancelled, log it and continue |
| **Admin permission** | All refund routes wrapped with `withPolicy(handler, API_POLICIES.BILLING_REFUND)` |
| **Rate limiting** | Refund API uses `rateLimiters.api` (60 req/min) |
| **Audit trail** | Log refund creation, approval, rejection, processing to `audit_logs` table |
| **Webhook security** | Razorpay: HMAC signature verification; Stripe: existing `verifyWebhookSignature()` |

### Implementation Order

| Step | What | Files |
|---|---|---|
| 1 | Add `refundRequests` table + relations + exports | 3 schema files |
| 2 | Drizzle migration (`generate` + `migrate`) | CLI commands |
| 3 | Add `createRefund` to `PaymentProvider` interface | `gateway.ts` |
| 4 | Implement `createRefund` in RazorpayProvider | `razorpay.ts` |
| 5 | Implement `createRefund` in StripeProvider | `stripe.ts` |
| 6 | Create `RefundService` class | `refund.ts` |
| 7 | Create admin & user API routes | 4 route files |
| 8 | Add `BILLING_REFUND` to `API_POLICIES` | `permissions.ts` |
| 9 | Add email templates + service methods | `refund.ts` template + `email.ts` |
| 10 | Create webhook handlers (Razorpay + extend Stripe) | 2 webhook files |
| 11 | Create admin UI components (RefundRequests, Dialogs) | 3 component files |
| 12 | Create user UI components (RequestRefundModal) | 2 component files |
| 13 | Add "Issue Refund" to Transactions & Dashboard | 2 files |
| 14 | Seed RBAC policy for `billing:manage` | `seed-rbac-policies.ts` |

---

### Questions (Resolved):

1. **Partial refunds**: The system will support multiple partial refunds per payment since Stripe and Razorpay both support multiple partials.
2. **Refund speed**: The refund speed is fixed to `normal` (5-7 days) for all Razorpay transactions.
3. **Subscription revocation on refund**: When an admin issues a full refund, the subscription is automatically cancelled by default.
4. **User vs Admin Initiation**: The system allows users to request refunds directly via their dashboard UI, placing requests into a pending queue for admin approval.