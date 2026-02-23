# Payment Gateway Service

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Payment Gateway Abstraction](#payment-gateway-abstraction)
- [Razorpay Integration](#razorpay-integration)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Payment Flows](#payment-flows)
- [Subscription Management](#subscription-management)
- [Security & Verification](#security--verification)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Testing](#testing)

## Overview

BookEase implements a **flexible, provider-agnostic payment gateway system** with Razorpay as the primary payment processor. The architecture supports multiple payment providers through an abstraction layer, making it easy to switch or add new payment gateways without changing application code.

### Key Features

- ✅ **Provider Abstraction**: Pluggable payment provider architecture
- ✅ **Razorpay Integration**: Complete integration with Razorpay orders, payments, and subscriptions
- ✅ **Order Management**: Track payment orders with full transaction history
- ✅ **Subscription Support**: Manage recurring subscriptions and plans
- ✅ **Transaction Logging**: Comprehensive logging of all payment events
- ✅ **Payment Verification**: HMAC-based signature verification for security
- ✅ **Plan Management**: Link payments to subscription plans
- ✅ **Multi-Currency**: Support for multiple currencies (default: INR)

### Supported Payment Providers

| Provider | Status | Features |
|----------|--------|----------|
| **Razorpay** | ✅ Active | Orders, Payments, Subscriptions, Plans, Invoices |
| **Other Payment Gateways** | 🚧 Planned | Future integration |

## Architecture

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                       │
│                                                             │
│  User initiates payment → Create Order API                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Payment Gateway Service                    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Payment Gateway Abstraction Layer                 │     │
│  │  - Provider Registry                               │     │
│  │  - Interface Definitions                           │     │
│  │  - Factory Pattern                                 │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                     │
│                       ▼                                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Razorpay Provider Implementation           │     │
│  │  - Create Orders                                   │     │
│  │  - Verify Payments                                 │     │
│  │  - Manage Subscriptions                            │     │
│  │  - HMAC Signature Verification                     │     │
│  └────────────────────┬───────────────────────────────┘     │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ payment_    │  │ payment_     │  │ subscription │        │
│  │ orders      │  │ transactions │  │ plans        │        │
│  └─────────────┘  └──────────────┘  └──────────────┘        │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐                        │
│  │ user_        │   │ subscription │                        │
│  │ subscriptions│   │ analytics    │                        │
│  └──────────────┘   └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Razorpay API                               │
│                                                             │
│  Orders → Payments → Subscriptions → Webhooks               │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

| Component | Location | Purpose |
|-----------|----------|---------|
| **Gateway Interface** | `src/lib/payments/gateway.ts` | Provider abstraction layer |
| **Razorpay Provider** | `src/lib/payments/providers/razorpay.ts` | Razorpay implementation |
| **Order API** | `src/app/api/payments/razorpay-create-order/` | Create payment orders |
| **Payment APIs** | `src/app/api/payments/razorpay-payments/` | Fetch and manage payments |
| **Subscription APIs** | `src/app/api/payments/razorpay-subscriptions/` | Subscription management |
| **Plan APIs** | `src/app/api/payments/razorpay-plans/` | Plan management |
| **Invoice APIs** | `src/app/api/payments/razorpay-invoices/` | Invoice retrieval |
| **Database Schema** | `src/server/db/schema/schema.ts` | Payment tables and relations |

## Payment Gateway Abstraction

### Core Interfaces

**Location**: `src/lib/payments/gateway.ts`

```typescript
// Input for creating a payment order
export interface CreateOrderInput {
  receipt: string;         // Internal order reference
  amount: number;          // Major units (e.g., INR rupees)
  currency?: string;       // Default: INR
  notes?: Record<string, unknown>; // Additional metadata
}

// Result from creating an order
export interface CreateOrderResult {
  id: string;              // Provider order ID
  amount: number;          // Order amount
  currency: string;        // Currency code
  [key: string]: unknown;  // Provider-specific fields
}

// Payment provider interface
export interface PaymentProvider {
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPayment(options: Record<string, unknown>): Promise<boolean>;
}
```

### Provider Registry

The gateway uses a **factory pattern** to register and retrieve payment providers:

```typescript
const providers: Record<string, () => PaymentProvider> = {};

/**
 * Register a payment provider
 * @param name - Provider identifier (e.g., "razorpay")
 * @param factory - Factory function that creates provider instance
 */
export function registerPaymentProvider(
  name: string, 
  factory: () => PaymentProvider
) {
  providers[name] = factory;
}

/**
 * Get a payment provider instance
 * @param name - Provider identifier
 * @returns PaymentProvider instance
 * @throws Error if provider not registered
 */
export function getPaymentProvider(name: string): PaymentProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(`Payment provider "${name}" is not registered`);
  }
  return factory();
}
```

### Usage Example

```typescript
import { getPaymentProvider } from "@/lib/payments/gateway";
import "@/lib/payments/providers/razorpay"; // Register provider

// Get provider instance
const provider = getPaymentProvider("razorpay");

// Create an order
const order = await provider.createOrder({
  receipt: "order_123",
  amount: 999.00,
  currency: "INR",
  notes: { planId: "uuid", userId: "uuid" }
});

// Verify payment
const isValid = await provider.verifyPayment({
  razorpay_order_id: "order_xyz",
  razorpay_payment_id: "pay_abc",
  razorpay_signature: "signature_hash"
});
```

## Razorpay Integration

### Provider Implementation

**Location**: `src/lib/payments/providers/razorpay.ts`

```typescript
class RazorpayProvider implements PaymentProvider {
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor() {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error(
        "Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
      );
    }
    this.keyId = RAZORPAY_KEY_ID;
    this.keySecret = RAZORPAY_KEY_SECRET;
  }

  async createOrder(input: CreateOrderInput): Promise<RazorpayCreateOrderResponse> {
    const client = new Razorpay({ 
      key_id: this.keyId, 
      key_secret: this.keySecret 
    });
    
    // Convert to paisa (minor units)
    const amountPaise = Math.round(input.amount * 100);
    const currency = (input.currency || "INR").toUpperCase();

    const order = await client.orders.create({
      amount: amountPaise,
      currency,
      receipt: input.receipt,
      notes: input.notes
        ? Object.fromEntries(
            Object.entries(input.notes).map(([k, v]) => 
              [k, v == null ? null : String(v)]
            )
          )
        : undefined,
    });

    return order as unknown as RazorpayCreateOrderResponse;
  }

  async verifyPayment(options: {
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<boolean> {
    const { 
      razorpay_order_id, 
      razorpay_subscription_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = options;

    let signedString: string;
    if (razorpay_order_id) {
      // Standard order payment: order_id|payment_id
      signedString = `${razorpay_order_id}|${razorpay_payment_id}`;
    } else if (razorpay_subscription_id) {
      // Subscription checkout: payment_id|subscription_id
      signedString = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    } else {
      throw new Error(
        'Either razorpay_order_id or razorpay_subscription_id must be provided'
      );
    }

    const hmac = createHmac("sha256", this.keySecret);
    hmac.update(signedString);
    const expected = hmac.digest("hex");
    
    return expected === razorpay_signature;
  }
}

// Auto-register provider
registerPaymentProvider("razorpay", () => new RazorpayProvider());
```

### Environment Configuration

**Required Environment Variables**:

```bash
# .env.local
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

**Security Note**: 
- ⚠️ Never commit credentials to version control
- ✅ Use test keys in development
- ✅ Use live keys only in production

## Database Schema

### Payment Orders Table

**Table**: `payment_orders`

Stores payment order information with links to users and subscription plans.

```typescript
export const paymentOrders = pgTable("payment_orders", {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  planId: uuid('plan_id').references(() => subscriptionPlans.id),
  
  // Order identifiers
  orderId: varchar('order_id', { length: 100 }).notNull().unique(),
  invoiceNumber: varchar('invoice_number', { length: 50 }),
  
  // Provider information
  provider: varchar('provider', { length: 50 }).notNull().default('internal'),
  providerOrderId: varchar('provider_order_id', { length: 150 }),
  providerTransactionId: varchar('provider_transaction_id', { length: 150 }),
  
  // Amount and currency
  amountMinor: integer('amount_minor').notNull(), // In paisa/cents
  currency: varchar('currency', { length: 3 }).notNull().default('INR'),
  
  // Order metadata
  purpose: varchar('purpose', { length: 50 }).notNull().default('subscription'),
  status: varchar('status', { length: 20 }).notNull().default('created'),
  
  // Razorpay specific
  razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 100 }),
  
  // URLs
  redirectUrl: varchar('redirect_url', { length: 500 }),
  callbackUrl: varchar('callback_url', { length: 500 }),
  
  // Security
  saltIndex: varchar('salt_index', { length: 10 }),
  xVerify: varchar('x_verify', { length: 255 }),
  
  // Additional data
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Status Values**:
- `created` - Order created, awaiting payment
- `pending` - Payment initiated
- `success` - Payment successful
- `failed` - Payment failed
- `expired` - Order expired

### Payment Transactions Table

**Table**: `payment_transactions`

Logs all payment-related events and transactions.

```typescript
export const paymentTransactions = pgTable("payment_transactions", {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentOrderId: uuid('payment_order_id')
    .notNull()
    .references(() => paymentOrders.id, { onDelete: 'cascade' }),
  
  // Provider information
  provider: varchar('provider', { length: 50 }).notNull().default('internal'),
  
  // Transaction details
  event: varchar('event', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  
  // Provider IDs
  providerOrderId: varchar('provider_order_id', { length: 150 }),
  providerTransactionId: varchar('provider_transaction_id', { length: 150 }),
  
  // Details
  message: varchar('message', { length: 255 }),
  
  // Raw data for debugging
  rawRequest: jsonb('raw_request'),
  rawResponse: jsonb('raw_response'),
  
  receivedAt: timestamp('received_at').defaultNow().notNull(),
});
```

**Event Types**:
- `created` - Order created
- `callback` - Payment callback received
- `status_check` - Status verification
- `refund` - Refund initiated
- `webhook` - Webhook received

**Status Values**:
- `initiated` - Transaction started
- `pending` - Awaiting completion
- `success` - Completed successfully
- `failed` - Transaction failed

### Subscription Plans Table

**Table**: `subscription_plans`

```typescript
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('INR'),
  interval: varchar('interval', { length: 20 }).notNull(), // monthly, yearly
  intervalCount: integer('interval_count').default(1),
  
  // Razorpay integration
  razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 100 }),
  razorpaySubscriptionPlanId: varchar('razorpay_subscription_plan_id', { length: 100 }),
  razorpaySubscriptionLink: varchar('razorpay_subscription_link', { length: 255 }),
  
  isActive: boolean('is_active').default(true),
  features: jsonb('features'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

## API Endpoints

### Create Payment Order

**Endpoint**: `POST /api/payments/razorpay-create-order`

Creates a new payment order with Razorpay.

**Request Body**:
```typescript
{
  amount: number;          // Major units (e.g., 999.00 INR)
  currency?: string;       // Optional, default: "INR"
  planId?: string | null;  // UUID of subscription plan
}
```

**Response**:
```typescript
{
  success: true,
  order: {
    id: "order_abc123",           // Razorpay order ID
    amount: 99900,                // Amount in paisa
    currency: "INR",
    receipt: "internal_order_id",
    status: "created",
    attempts: 0
  }
}
```

**Implementation Flow**:
```typescript
1. Validate amount and currency
2. Optional: Verify planId exists
3. Resolve userId from session (or create without user)
4. Generate internal order ID (nanoid)
5. Insert into payment_orders table
6. Create Razorpay order via provider
7. Update payment_orders with provider order ID
8. Log "created" transaction
9. Return order details to client
```

**Error Responses**:
```typescript
// 400 Bad Request
{ success: false, error: "Invalid amount" }
{ success: false, error: "Invalid planId" }

// 500 Internal Server Error
{ success: false, error: "Failed to create order" }
```

### Get All Payments

**Endpoint**: `GET /api/payments/razorpay-payments`

Fetch all payments from Razorpay.

**Query Parameters**:
- `count` (optional): Number of payments to fetch
- `skip` (optional): Number of payments to skip
- `from` (optional): Unix timestamp - start date
- `to` (optional): Unix timestamp - end date

**Response**:
```typescript
{
  success: true,
  payments: [
    {
      id: "pay_xyz123",
      amount: 99900,
      currency: "INR",
      status: "captured",
      order_id: "order_abc123",
      method: "card",
      email: "user@example.com",
      contact: "+919876543210",
      created_at: 1672531200
    }
  ],
  count: 10
}
```

### Get Payment by ID

**Endpoint**: `GET /api/payments/razorpay-payments/[id]`

Fetch a specific payment by ID.

**Response**:
```typescript
{
  success: true,
  payment: {
    id: "pay_xyz123",
    amount: 99900,
    currency: "INR",
    status: "captured",
    order_id: "order_abc123",
    method: "card",
    card_id: "card_abc",
    bank: "HDFC",
    wallet: null,
    vpa: null,
    email: "user@example.com",
    contact: "+919876543210",
    fee: 2360,
    tax: 360,
    created_at: 1672531200,
    captured: true
  }
}
```

### Subscription Management

#### Create Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/create`

Create a new Razorpay subscription.

**Request Body**:
```typescript
{
  planId?: string;           // Local plan UUID
  razorpayPlanId?: string;   // Or direct Razorpay plan ID
  customer_notify?: boolean; // Default: true
  total_count?: number;      // Number of billing cycles
  end_at?: number;           // Unix timestamp for end date
}
```

**Response**:
```typescript
{
  success: true,
  subscription: {
    id: "sub_xyz123",
    plan_id: "plan_abc123",
    status: "created",
    customer_notify: true,
    quantity: 1,
    total_count: 12,
    paid_count: 0,
    remaining_count: 12,
    short_url: "https://rzp.io/l/xyz",
    start_at: 1672531200,
    end_at: 1704067200,
    charge_at: 1672531200,
    created_at: 1672531200
  }
}
```

#### Get All Subscriptions

**Endpoint**: `GET /api/payments/razorpay-subscriptions`

**Query Parameters**:
- `plan_id` (optional): Filter by plan ID
- `from` (optional): Unix timestamp
- `to` (optional): Unix timestamp
- `count` (optional): Number of results
- `skip` (optional): Pagination offset

#### Get Subscription by ID

**Endpoint**: `GET /api/payments/razorpay-subscriptions/[id]`

#### Cancel Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/[id]/cancel`

**Request Body**:
```typescript
{
  cancel_at_cycle_end?: boolean; // Default: false (cancel immediately)
}
```

#### Pause Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/[id]/pause`

**Request Body**:
```typescript
{
  pause_at: "now" | "end_of_cycle"
}
```

#### Resume Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/[id]/resume`

**Request Body**:
```typescript
{
  resume_at: "now" | "end_of_cycle"
}
```

### Plan Management

#### Get All Plans

**Endpoint**: `GET /api/payments/razorpay-plans`

**Query Parameters**:
- `count`, `skip`, `from`, `to` (same as other endpoints)

#### Get Plan by ID

**Endpoint**: `GET /api/payments/razorpay-plans/[id]`

### Invoice Management

#### Get All Invoices

**Endpoint**: `GET /api/payments/razorpay-invoices`

**Query Parameters**:
- `type` (optional): Filter by invoice type
- `payment_id` (optional): Filter by payment ID
- `receipt` (optional): Filter by receipt
- `customer_id` (optional): Filter by customer ID

#### Get Invoice by ID

**Endpoint**: `GET /api/payments/razorpay-invoices/[id]`

## Payment Flows

### One-Time Payment Flow

```
┌────────────┐
│   Client   │
└──────┬─────┘
       │
       │ 1. Create Order Request
       │    POST /api/payments/razorpay-create-order
       │    { amount: 999, currency: "INR", planId: "..." }
       ▼
┌────────────────────────────────────────────┐
│           Backend API                      │
│                                            │
│  • Validate input                          │
│  • Generate internal order ID              │
│  • Create payment_orders record            │
│  • Call Razorpay API                       │
│  • Update with provider order ID           │
│  • Log transaction                         │
└──────┬─────────────────────────────────────┘
       │
       │ 2. Return Order Details
       │    { success: true, order: {...} }
       ▼
┌────────────┐
│   Client   │ 3. Show Razorpay Checkout
│            │    with order ID
└──────┬─────┘
       │
       │ 4. User completes payment
       │    on Razorpay modal
       ▼
┌────────────────────────────────────────────┐
│        Razorpay Payment Processing         │
│                                            │
│  • Capture payment                         │
│  • Generate signature                      │
└──────┬─────────────────────────────────────┘
       │
       │ 5. Payment Success Callback
       │    { razorpay_order_id, razorpay_payment_id,
       │      razorpay_signature }
       ▼
┌────────────┐
│   Client   │ 6. Verify Payment
│            │    (call backend verification endpoint)
└──────┬─────┘
       │
       │ 7. Verification Request
       ▼
┌────────────────────────────────────────────┐
│         Backend Verification               │
│                                            │
│  • Verify HMAC signature                   │
│  • Update payment_orders status            │
│  • Log transaction                         │
│  • Grant access / activate subscription    │
└──────┬─────────────────────────────────────┘
       │
       │ 8. Success Response
       ▼
┌────────────┐
│   Client   │ Show success message
│            │ Redirect to dashboard
└────────────┘
```

### Subscription Flow

```
┌────────────┐
│   Client   │
└──────┬─────┘
       │
       │ 1. Select Subscription Plan
       ▼
┌──────────────────────────────────────────────────────┐
│         Backend: Create Subscription                 │
│                                                      │
│  POST /api/payments/razorpay-subscriptions/create    │
│  { planId: "...", total_count: 12 }                  │
└──────┬───────────────────────────────────────────────┘
       │
       │ 2. Razorpay Subscription Created
       │    Returns: { id, short_url, ... }
       ▼
┌────────────┐
│   Client   │ 3. Redirect to Razorpay
│            │    subscription checkout URL
└──────┬─────┘
       │
       │ 4. User authenticates and
       │    authorizes subscription
       ▼
┌────────────────────────────────────────────┐
│    Razorpay Subscription Authorization     │
│                                            │
│  • Customer authentication                 │
│  • Mandate registration (for auto-debit)   │
│  • First payment (if upfront)              │
└──────┬─────────────────────────────────────┘
       │
       │ 5. Webhook: subscription.activated
       │    (Backend receives webhook)
       ▼
┌────────────────────────────────────────────┐
│       Backend: Process Webhook             │
│                                            │
│  • Verify webhook signature                │
│  • Update user_subscriptions table         │
│  • Grant subscription access               │
│  • Send confirmation email                 │
└──────┬─────────────────────────────────────┘
       │
       │ 6. Redirect back to app
       ▼
┌────────────┐
│   Client   │ Show success, update UI
└────────────┘

       │
       │ 7. Recurring Billing (automatic)
       ▼
┌────────────────────────────────────────────┐
│    Razorpay: Auto-charge at interval       │
│                                            │
│  • Razorpay charges per schedule           │
│  • Sends webhook on each charge            │
│  • Backend updates payment records         │
└────────────────────────────────────────────┘
```

## Security & Verification

### Payment Signature Verification

Razorpay uses **HMAC-SHA256** signatures to verify payment authenticity.

#### Order Payment Verification

```typescript
import { createHmac } from "crypto";

function verifyOrderPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  // Create signed string: order_id|payment_id
  const signedString = `${orderId}|${paymentId}`;
  
  // Generate HMAC signature
  const hmac = createHmac("sha256", secret);
  hmac.update(signedString);
  const expectedSignature = hmac.digest("hex");
  
  // Compare signatures
  return expectedSignature === signature;
}
```

#### Subscription Payment Verification

```typescript
function verifySubscriptionPayment(
  paymentId: string,
  subscriptionId: string,
  signature: string,
  secret: string
): boolean {
  // Create signed string: payment_id|subscription_id
  const signedString = `${paymentId}|${subscriptionId}`;
  
  // Generate HMAC signature
  const hmac = createHmac("sha256", secret);
  hmac.update(signedString);
  const expectedSignature = hmac.digest("hex");
  
  // Compare signatures
  return expectedSignature === signature;
}
```

### Webhook Verification

For webhook security, verify the webhook signature:

```typescript
function verifyWebhookSignature(
  webhookBody: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac("sha256", secret);
  hmac.update(webhookBody);
  const expectedSignature = hmac.digest("hex");
  
  return expectedSignature === signature;
}
```

**Implementation**:
```typescript
// Webhook endpoint example
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  const body = await req.text();
  
  const isValid = verifyWebhookSignature(
    body,
    signature!,
    process.env.RAZORPAY_WEBHOOK_SECRET!
  );
  
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }
  
  // Process webhook
  const payload = JSON.parse(body);
  // ...
}
```

## Error Handling

### Common Error Scenarios

#### 1. Invalid Credentials

```typescript
{
  success: false,
  error: "Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
  status: 500
}
```

**Solution**: Verify environment variables are set.

#### 2. Invalid Amount

```typescript
{
  success: false,
  error: "Invalid amount",
  status: 400
}
```

**Solution**: Ensure amount is a positive number.

#### 3. Plan Not Found

```typescript
{
  success: false,
  error: "Invalid planId",
  status: 400
}
```

**Solution**: Verify planId exists in database.

#### 4. Razorpay API Error

```typescript
{
  success: false,
  error: "The amount must be atleast INR 1.00",
  status: 400
}
```

**Solution**: Check Razorpay's minimum amount requirements.

#### 5. Payment Verification Failed

```typescript
{
  success: false,
  error: "Payment verification failed",
  status: 400
}
```

**Solution**: Verify signature is correct and order exists.

### Error Logging

All errors are logged to the console with detailed information:

```typescript
try {
  // Payment operation
} catch (error) {
  console.error('Payment error:', {
    type: error.constructor.name,
    message: error.message,
    stack: error.stack,
    razorpayError: error.error // Razorpay-specific errors
  });
  
  // Return user-friendly error
  return NextResponse.json({
    success: false,
    error: getUserFriendlyMessage(error)
  }, { status: 500 });
}
```

## Best Practices

### 1. Always Use Provider Abstraction

❌ **Don't**:
```typescript
import Razorpay from "razorpay";

const razorpay = new Razorpay({...});
await razorpay.orders.create({...});
```

✅ **Do**:
```typescript
import { getPaymentProvider } from "@/lib/payments/gateway";
import "@/lib/payments/providers/razorpay";

const provider = getPaymentProvider("razorpay");
await provider.createOrder({...});
```

### 2. Convert to Minor Units

Always convert major currency units to minor units (paisa/cents):

```typescript
// ❌ Wrong
amount: 999 // Ambiguous

// ✅ Correct
const amountPaise = Math.round(amountRupees * 100);
```

### 3. Log All Transactions

```typescript
// Always log transaction events
await db.insert(paymentTransactions).values({
  paymentOrderId,
  provider: "razorpay",
  event: "created",
  status: "initiated",
  rawRequest: inputData,
  rawResponse: providerResponse,
  receivedAt: new Date(),
});
```

### 4. Handle Idempotency

Use unique order IDs to prevent duplicate charges:

```typescript
import { nanoid } from "nanoid";

const orderId = nanoid(16); // Unique order reference
```

### 5. Verify All Payments

Never trust client-side payment success. Always verify on backend:

```typescript
const isValid = await provider.verifyPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
});

if (!isValid) {
  throw new Error("Payment verification failed");
}
```

### 6. Use Webhooks for Subscriptions

Subscriptions should be managed via webhooks, not polling:

```typescript
// Webhook endpoint
POST /api/webhooks/razorpay

// Handle events:
// - subscription.activated
// - subscription.charged
// - subscription.cancelled
// - subscription.paused
// - subscription.resumed
```

### 7. Secure Credentials

```typescript
// ❌ Never hardcode
const keyId = "rzp_test_12345";

// ✅ Use environment variables
const keyId = process.env.RAZORPAY_KEY_ID;

if (!keyId) {
  throw new Error("Missing RAZORPAY_KEY_ID");
}
```

### 8. Handle Currency Properly

```typescript
const currency = (input.currency || "INR").toUpperCase();

// Validate supported currencies
const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR"];
if (!SUPPORTED_CURRENCIES.includes(currency)) {
  throw new Error(`Unsupported currency: ${currency}`);
}
```

### 9. Graceful Error Messages

```typescript
// ❌ Don't expose internal errors
return { error: error.stack };

// ✅ Return user-friendly messages
return { 
  error: "Payment processing failed. Please try again." 
};
```

### 10. Test With Test Credentials

```bash
# Development
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx

# Production
RAZORPAY_KEY_ID=rzp_live_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
```

## Testing

### Test Card Numbers

Razorpay provides test cards for different scenarios:

```typescript
// Success
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date

// Failed Payment
Card: 4111 1111 1111 1234
CVV: Any 3 digits
Expiry: Any future date

// Authentication Required
Card: 5104 0600 0000 0008
CVV: Any 3 digits
Expiry: Any future date
```

### Testing Order Creation

```bash
curl -X POST http://localhost:3000/api/payments/razorpay-create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 999,
    "currency": "INR",
    "planId": "plan-uuid-here"
  }'
```

### Testing Payment Verification

```typescript
// Test data
const testPayment = {
  razorpay_order_id: "order_test123",
  razorpay_payment_id: "pay_test456",
  razorpay_signature: "generated_signature"
};

const provider = getPaymentProvider("razorpay");
const isValid = await provider.verifyPayment(testPayment);

console.log("Verification result:", isValid);
```

### Testing Subscriptions

```bash
# Create subscription
curl -X POST http://localhost:3000/api/payments/razorpay-subscriptions/create \
  -H "Content-Type: application/json" \
  -d '{
    "razorpayPlanId": "plan_test123",
    "total_count": 12
  }'

# Get subscription
curl http://localhost:3000/api/payments/razorpay-subscriptions/sub_test123

# Cancel subscription
curl -X POST http://localhost:3000/api/payments/razorpay-subscriptions/sub_test123/cancel \
  -H "Content-Type: application/json" \
  -d '{ "cancel_at_cycle_end": false }'
```

### Unit Tests

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { getPaymentProvider } from '@/lib/payments/gateway';
import '@/lib/payments/providers/razorpay';

describe('Payment Gateway', () => {
  let provider: PaymentProvider;

  beforeAll(() => {
    provider = getPaymentProvider('razorpay');
  });

  it('should create an order', async () => {
    const order = await provider.createOrder({
      receipt: 'test_order_1',
      amount: 999,
      currency: 'INR',
    });

    expect(order.id).toBeDefined();
    expect(order.amount).toBe(99900); // In paisa
    expect(order.currency).toBe('INR');
  });

  it('should verify valid payment signature', async () => {
    const isValid = await provider.verifyPayment({
      razorpay_order_id: 'order_test',
      razorpay_payment_id: 'pay_test',
      razorpay_signature: 'valid_signature',
    });

    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', async () => {
    const isValid = await provider.verifyPayment({
      razorpay_order_id: 'order_test',
      razorpay_payment_id: 'pay_test',
      razorpay_signature: 'invalid_signature',
    });

    expect(isValid).toBe(false);
  });
});
```

## Troubleshooting

### Common Issues

#### 1. "Missing Razorpay credentials" Error

**Cause**: Environment variables not set.

**Solution**:
```bash
# Add to .env.local
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
```

#### 2. Order Creation Fails with "Invalid amount"

**Cause**: Amount is zero, negative, or not a number.

**Solution**:
```typescript
const amount = Number(input.amount);
if (!Number.isFinite(amount) || amount <= 0) {
  throw new Error("Invalid amount");
}
```

#### 3. Payment Verification Always Fails

**Cause**: Using wrong secret or incorrect signature format.

**Solution**:
- Verify you're using `RAZORPAY_KEY_SECRET`, not `KEY_ID`
- Ensure signature string format matches payment type
- Check for trailing spaces or encoding issues

#### 4. Subscription Not Creating

**Cause**: Plan ID doesn't exist on Razorpay.

**Solution**:
- Create plan on Razorpay Dashboard first
- Store `razorpaySubscriptionPlanId` in your database
- Use correct plan ID in API request

#### 5. Webhooks Not Working

**Cause**: Webhook signature verification failing.

**Solution**:
- Set `RAZORPAY_WEBHOOK_SECRET` in environment
- Verify webhook URL in Razorpay Dashboard
- Check signature verification logic

## Summary

The BookEase payment gateway system provides:

✅ **Flexible Architecture**: Provider-agnostic design for easy integration  
✅ **Razorpay Integration**: Complete order, payment, and subscription support  
✅ **Security**: HMAC signature verification for all transactions  
✅ **Comprehensive Logging**: Full transaction history and audit trail  
✅ **Error Handling**: Graceful error handling with detailed logging  
✅ **Best Practices**: Industry-standard payment processing patterns

## Next Steps

- Read [02-AUTHENTICATION.md](./02-AUTHENTICATION.md) for user authentication
- Check [04-DATABASE.md](./04-DATABASE.md) for database schema details
- Review [05-API-ROUTES.md](./05-API-ROUTES.md) for complete API documentation
- Explore [03-RBAC.md](./03-RBAC.md) for payment permission management

---

**Need Help?** Check Razorpay's official documentation: https://razorpay.com/docs/
