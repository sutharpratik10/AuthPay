import crypto from 'crypto';

export interface PhonePeConfig {
  merchantId: string;
  merchantKey: string;
  keyIndex: string;
  baseUrl: string;
  isProduction: boolean;
}

export interface PhonePePaymentPayload {
  merchantId: string;
  merchantTransactionId: string;
  merchantUserId: string;
  amount: number;
  redirectUrl: string;
  redirectMode: 'POST' | 'REDIRECT';
  callbackUrl: string;
  mobileNumber?: string;
  paymentInstrument: {
    type: 'PAY_PAGE';
  };
}

export interface PhonePeSubscriptionPayload {
  merchantId: string;
  merchantUserId: string;
  mobileNumber: string;
  subscriptionId: string;
  authWorkflowType: 'DEBIT_CONSENT';
  amountInPaise: number;
  merchantSubscriptionId: string;
  recurringCount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  redirectUrl: string;
  callbackUrl: string;
  subscriptionStartDate: string; // YYYY-MM-DD
  userConsent: {
    amount: {
      value: number;
      currency: 'INR';
    };
    frequency: {
      type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      value: number;
    };
  };
  autoExecute: boolean;
}

// PhonePe Exception Class
export class PhonePeException extends Error {
  public httpStatusCode: number;
  public code: string;
  public data?: Record<string, unknown>;

  constructor(message: string, httpStatusCode: number, code: string, data?: Record<string, unknown>) {
    super(message);
    this.name = 'PhonePeException';
    this.httpStatusCode = httpStatusCode;
    this.code = code;
    this.data = data;
  }
}

// Response Models
export interface PaymentInstrumentV2 {
  type: 'ACCOUNT' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'EGV' | 'WALLET';
  // Account specific
  ifsc?: string;
  accountType?: string;
  maskedAccountNumber?: string;
  accountHolderName?: string;
  // Card specific
  bankTransactionId?: string;
  bankId?: string;
  arn?: string;
  brn?: string;
  // EGV specific
  cardNumber?: string;
  programId?: string;
  // Wallet specific
  walletId?: string;
}

export interface PaymentRail {
  type: 'UPI' | 'PG';
  // UPI Rail
  utr?: string;
  upiTransactionId?: string;
  vpa?: string;
  // PG Rail
  transactionId?: string;
  authorizationCode?: string;
  serviceTransactionId?: string;
}

export interface InstrumentCombo {
  instrument: PaymentInstrumentV2;
  rails: PaymentRail;
  amount: number;
}

export interface PaymentDetail {
  paymentMode: string;
  timestamp: number;
  amount: number;
  transactionId: string;
  state: 'PENDING' | 'COMPLETED' | 'FAILED';
  errorCode?: string;
  detailedErrorCode?: string;
  splitInstruments?: InstrumentCombo[];
}

export interface OrderStatusResponse {
  orderId: string;
  state: 'PENDING' | 'FAILED' | 'COMPLETED';
  amount: number;
  expireAt: number;
  paymentDetails: PaymentDetail[];
}

export interface CallbackData {
  merchantId: string;
  orderId?: string;
  merchantOrderId?: string;
  originalMerchantOrderId?: string;
  refundId?: string;
  merchantRefundId?: string;
  state: string;
  amount: number;
  expireAt: number;
  errorCode?: string;
  detailedErrorCode?: string;
  metaInfo?: Record<string, unknown>;
  paymentDetails?: PaymentDetail[];
}

export interface CallbackResponse {
  type: 'CHECKOUT_ORDER_COMPLETED' | 'CHECKOUT_ORDER_FAILED' | 'PG_REFUND_ACCEPTED' | 'PG_REFUND_COMPLETED' | 'PG_REFUND_FAILED';
  payload: CallbackData;
}

export class PhonePeService {
  private config: PhonePeConfig;
  
  constructor() {
    this.config = {
      merchantId: process.env.PHONEPE_MERCHANT_ID || 'TEST-M23VXUNQAMGVP_25080',
      merchantKey: process.env.PHONEPE_MERCHANT_KEY || 'MTE2MDZjNzAtNjlmNC00ZjQzLWI3MjQtODdmYzk3NThkYzhl',
      keyIndex: process.env.PHONEPE_KEY_INDEX || '1',
      isProduction: process.env.NODE_ENV === 'production',
      baseUrl: process.env.NODE_ENV === 'production' 
        ? 'https://api.phonepe.com/apis/pg'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox'
    };
    
    // Log configuration (without sensitive data)
    console.log('PhonePe Service Configuration:', {
      merchantId: this.config.merchantId,
      keyIndex: this.config.keyIndex,
      baseUrl: this.config.baseUrl,
      isProduction: this.config.isProduction
    });
  }
  /**
   * Generate X-VERIFY header for PhonePe API calls (standard pg payments only)
   */
  private generateXVerify(payload: string): string {
    const dataToHash = payload + this.config.merchantKey;
    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    return `${hash}###${this.config.keyIndex}`;
  }  /**
   * Get OAuth access token for SUBSCRIPTIONS v2 APIs
   */
  async getAccessToken(): Promise<string> {
    try {
      const payload = {
        merchantId: this.config.merchantId,
        clientSecret: this.config.merchantKey
      };

      // Use the correct OAuth endpoint for subscriptions
      const authUrl = this.config.isProduction 
        ? 'https://api.phonepe.com/apis/pg/oauth2/token'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox/oauth2/token';

      console.log('PhonePe OAuth request:', {
        url: authUrl,
        payload: { ...payload, clientSecret: '[HIDDEN]' }
      });

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      console.log('PhonePe OAuth response:', {
        status: response.status,
        success: data.success,
        code: data.code,
        hasAccessToken: !!(data.data?.accessToken || data.accessToken)
      });

      if ((data.success || data.code === 'SUCCESS') && (data.data?.accessToken || data.accessToken)) {
        return data.data?.accessToken || data.accessToken;
      } else {
        throw new PhonePeException(
          'Failed to get access token: ' + (data.message || data.error || 'Unknown error'),
          response.status,
          data.code || 'AUTH_ERROR',
          data
        );
      }
    } catch (error) {
      console.error('Error getting PhonePe access token:', error);
      if (error instanceof PhonePeException) {
        throw error;
      }
      throw new PhonePeException(
        'Network error while getting access token',
        500,
        'NETWORK_ERROR',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Create a payment request (standard payment flow)
   */
  async createPayment(params: {
    userId: string;
    orderId: string;
    amount: number;
    mobileNumber?: string;
    redirectUrl: string;
    callbackUrl: string;
  }) {
    const merchantTransactionId = `TXN_${Date.now()}_${params.userId.substring(0, 8)}`;
      const payload: PhonePePaymentPayload = {
      merchantId: this.config.merchantId,
      merchantTransactionId,
      merchantUserId: params.userId,
      amount: Math.round(params.amount * 100), // Convert to paise
      redirectUrl: params.redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl: params.callbackUrl,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Add mobile number only if provided and not empty
    if (params.mobileNumber && params.mobileNumber.trim()) {
      payload.mobileNumber = params.mobileNumber;
    }const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const xVerify = this.generateXVerify(base64Payload);

    return {
      payload: base64Payload,
      xVerify,
      merchantTransactionId,
      url: `${this.config.baseUrl}/pg/v1/pay`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
  }

  /**
   * Create a subscription setup request (Mandate Setup) - SUBSCRIPTIONS v2
   */
  async createSubscriptionSetup(params: {
    userId: string;
    planId: string;
    mobileNumber: string;
    amount: number;
    frequency: 'MONTHLY' | 'YEARLY';
    redirectUrl: string;
    callbackUrl: string;
  }) {
    const merchantOrderId = `ORD_${Date.now()}_${params.userId.substring(0, 8)}`;
    const merchantSubscriptionId = `MSUB_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const phonepeFrequency = params.frequency === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
    const expireAt = Date.now() + (30 * 365 * 24 * 60 * 60 * 1000);

    const payload = {
      merchantOrderId,
      amount: Math.round(params.amount * 100),
      expireAt: expireAt,
      paymentFlow: {
        type: 'SUBSCRIPTION_SETUP',
        merchantSubscriptionId,
        authWorkflowType: 'TRANSACTION',
        amountType: 'FIXED',
        maxAmount: Math.round(params.amount * 100),
        frequency: phonepeFrequency,
        expireAt: expireAt,
        paymentMode: {
          type: 'UPI_INTENT',
          targetApp: 'com.phonepe.app'
        }
      },
      deviceContext: {
        deviceOS: 'ANDROID'
      },
      metaInfo: {
        udf1: `plan_${params.planId}`
      }
    };    // For SUBSCRIPTIONS v2, use the correct endpoint
    const subscriptionUrl = this.config.isProduction 
      ? 'https://api.phonepe.com/apis/pg/subscription/v2/setup'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/subscription/v2/setup';

    return {
      payload,
      merchantOrderId,
      merchantSubscriptionId,
      url: subscriptionUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
  /** Verify callback signature (used for standard pg callback variants) */
  verifyCallback(xVerify: string, response: string): boolean {
    const expectedHash = this.generateXVerify(response);
    return expectedHash === xVerify;
  }
  /**
   * Check standard payment status (pg/v1) - for standard payments, not subscriptions
   */
  async checkPaymentStatus(merchantTransactionId: string) {
    const endpoint = `/pg/v1/status/${this.config.merchantId}/${merchantTransactionId}`;
    const xVerify = this.generateXVerify(endpoint);

    return {
      url: `${this.config.baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': this.config.merchantId
      }
    };
  }

  /**
   * Get order status with detailed payment information
   */
  async getOrderStatus(merchantOrderId: string, details: boolean = true): Promise<OrderStatusResponse> {
    try {
      const endpoint = `/pg/v1/status/${this.config.merchantId}/${merchantOrderId}${details ? '?details=true' : ''}`;
      const xVerify = this.generateXVerify(endpoint);

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'X-MERCHANT-ID': this.config.merchantId
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new PhonePeException(
          data.message || 'Failed to get order status',
          response.status,
          data.code || 'STATUS_ERROR',
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof PhonePeException) {
        throw error;
      }
      throw new PhonePeException(
        'Network error while checking order status',
        500,
        'NETWORK_ERROR',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Create SDK order for mobile apps
   */
  async createSdkOrder(params: {
    merchantOrderId: string;
    amount: number;
    redirectUrl: string;
  }) {
    try {
      const payload = {
        merchantOrderId: params.merchantOrderId,
        amount: Math.round(params.amount * 100), // Convert to paise
        redirectUrl: params.redirectUrl
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const xVerify = this.generateXVerify(base64Payload);

      const response = await fetch(`${this.config.baseUrl}/pg/v1/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'X-MERCHANT-ID': this.config.merchantId
        },
        body: JSON.stringify({
          request: base64Payload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new PhonePeException(
          data.message || 'Failed to create SDK order',
          response.status,
          data.code || 'SDK_ORDER_ERROR',
          data
        );
      }

      return {
        orderId: data.data?.orderId || data.orderId,
        state: data.data?.state || data.state,
        expireAt: data.data?.expireAt || data.expireAt,
        token: data.data?.token || data.token
      };
    } catch (error) {
      if (error instanceof PhonePeException) {
        throw error;
      }
      throw new PhonePeException(
        'Network error while creating SDK order',
        500,
        'NETWORK_ERROR',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Validate callback from PhonePe
   */
  validateCallback(
    username: string,
    password: string,
    authorizationHeader: string,
    responseBody: string
  ): CallbackResponse {
    try {
      // Verify the authorization header
      const expectedAuth = crypto
        .createHash('sha256')
        .update(responseBody + username + password)
        .digest('hex');

      if (authorizationHeader !== expectedAuth) {
        throw new PhonePeException(
          'Invalid callback authorization',
          401,
          'INVALID_CALLBACK_AUTH',
          { receivedAuth: authorizationHeader, expectedAuth }
        );
      }

      // Parse the response body
      const callbackData: CallbackResponse = JSON.parse(responseBody);

      return callbackData;
    } catch (error) {
      if (error instanceof PhonePeException) {
        throw error;
      }
      throw new PhonePeException(
        'Failed to validate callback',
        400,
        'CALLBACK_VALIDATION_ERROR',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Create authorization request for subscription (v2)
   */
  async createSubscriptionAuthorization(params: {
    subscriptionId: string;
    merchantSubscriptionId: string;
    redirectUrl: string;
  }) {
    const payload = {
      subscriptionId: params.subscriptionId,
      merchantSubscriptionId: params.merchantSubscriptionId,
      redirectUrl: params.redirectUrl
    };
    return {
      payload: JSON.stringify(payload),
      url: `${this.config.baseUrl}/subscriptions/v2/authorization`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
  /** Check subscription status (v2) - according to PhonePe docs */
  async checkSubscriptionStatus(merchantSubscriptionId: string) {
    const accessToken = await this.getAccessToken();
    return {
      url: `${this.config.baseUrl}/subscriptions/v2/${merchantSubscriptionId}/status?details=true`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    };
  }

  /** Execute subscription charge (Redemption Execute) (v2) */
  async executeSubscriptionCharge(params: { subscriptionId: string; transactionId: string; amount: number; }) {
    const accessToken = await this.getAccessToken();
    const payload = {
      subscriptionId: params.subscriptionId,
      transactionId: params.transactionId,
      amount: Math.round(params.amount * 100)
    };
    return {
      payload: JSON.stringify(payload),
      url: `${this.config.baseUrl}/subscriptions/v2/redemption/execute`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    };
  }

  /** Check redemption order status (v2) */
  async checkRedemptionOrderStatus(transactionId: string) {
    const accessToken = await this.getAccessToken();
    return {
      url: `${this.config.baseUrl}/subscriptions/v2/redemption/order/status/${this.config.merchantId}/${transactionId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    };
  }

  /** Cancel subscription (v2) */
  async cancelSubscription(subscriptionId: string) {
    const accessToken = await this.getAccessToken();
    const payload = { subscriptionId };
    return {
      payload: JSON.stringify(payload),
      url: `${this.config.baseUrl}/subscriptions/v2/cancel`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    };
  }

  /** Pause/Unpause subscription (v2) */
  async pauseUnpauseSubscription(subscriptionId: string, action: 'PAUSE' | 'UNPAUSE') {
    const accessToken = await this.getAccessToken();
    const payload = { subscriptionId, action };
    return {
      payload: JSON.stringify(payload),
      url: `${this.config.baseUrl}/subscriptions/v2/pause-unpause`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    };
  }

  /** Revoke subscription (v2) */
  async revokeSubscription(subscriptionId: string) {
    const accessToken = await this.getAccessToken();
    const payload = { subscriptionId };
    return {
      payload: JSON.stringify(payload),
      url: `${this.config.baseUrl}/subscriptions/v2/revoke`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    };
  }
}

export const phonePeService = new PhonePeService();
