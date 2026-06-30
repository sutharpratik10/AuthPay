// src/lib/payments/gateway.ts
// Payment gateway abstraction + registry

export interface CreateOrderInput {
  receipt: string;         // internal order ref
  amount: number;          // major units (e.g., INR rupees)
  currency?: string;       // default INR
  notes?: Record<string, unknown>;
}

export interface CreateOrderResult {
  id: string;              // provider order id
  amount: number;
  currency: string;
  [key: string]: unknown;
}

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
  createRefund(input: RefundInput): Promise<RefundResult>;
}

const providers: Record<string, () => PaymentProvider> = {};
let providersInitialized = false;

export function registerPaymentProvider(name: string, factory: () => PaymentProvider) {
  providers[name] = factory;
}

function ensureProvidersRegistered() {
  if (providersInitialized) return;
  providersInitialized = true;
  // Lazy-load providers to avoid circular dependency
  // (providers import registerPaymentProvider from this file)
  require("./providers/razorpay");
  require("./providers/stripe");
}

export function getPaymentProvider(name: string): PaymentProvider {
  ensureProvidersRegistered();
  const factory = providers[name];
  if (!factory) throw new Error(`Payment provider "${name}" is not registered`);
  return factory();
}

