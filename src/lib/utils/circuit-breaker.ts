/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascade failures when downstream services are overwhelmed.
 * When a service starts failing, the circuit breaker "trips" and
 * immediately returns errors without hitting the failing service.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are immediately rejected
 * - HALF_OPEN: Testing if service has recovered
 * 
 * Features:
 * - Automatic recovery testing
 * - Configurable thresholds
 * - Metrics and monitoring
 * - Multiple circuit breakers for different services
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Name/identifier for this circuit breaker */
  name: string;
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before testing recovery */
  resetTimeoutMs: number;
  /** Number of successful requests needed to close circuit from half-open */
  successThreshold: number;
  /** Time window in ms for counting failures */
  failureWindowMs: number;
  /** Optional: timeout for requests in ms */
  requestTimeoutMs?: number;
  /** Callback when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState, breaker: CircuitBreaker) => void;
  /** Custom function to determine if error should count as failure */
  isFailure?: (error: unknown) => boolean;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  failureRate: number;
}

interface FailureRecord {
  timestamp: number;
  error?: string;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: FailureRecord[] = [];
  private consecutiveSuccesses = 0;
  private consecutiveFailures = 0;
  private lastStateChange: number = Date.now();
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private halfOpenRequests = 0;
  private readonly MAX_HALF_OPEN_REQUESTS = 3;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      name: config.name,
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeoutMs: config.resetTimeoutMs ?? 30000,
      successThreshold: config.successThreshold ?? 3,
      failureWindowMs: config.failureWindowMs ?? 60000,
      requestTimeoutMs: config.requestTimeoutMs,
      onStateChange: config.onStateChange,
      isFailure: config.isFailure,
    };

    this.metrics = {
      state: 'CLOSED',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      failureRate: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;

    // Check if circuit is open
    if (this.state === 'OPEN') {
      // Check if reset timeout has elapsed
      if (Date.now() - this.lastStateChange >= this.config.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      } else {
        this.metrics.rejectedRequests++;
        throw new CircuitBreakerError(
          `Circuit breaker '${this.config.name}' is OPEN. Service unavailable.`,
          this.state,
          this.getTimeUntilReset()
        );
      }
    }

    // In half-open state, limit concurrent requests
    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenRequests >= this.MAX_HALF_OPEN_REQUESTS) {
        this.metrics.rejectedRequests++;
        throw new CircuitBreakerError(
          `Circuit breaker '${this.config.name}' is HALF_OPEN. Testing recovery.`,
          this.state,
          1000 // Retry in 1 second
        );
      }
      this.halfOpenRequests++;
    }

    try {
      // Execute with optional timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    } finally {
      if (this.state === 'HALF_OPEN') {
        this.halfOpenRequests = Math.max(0, this.halfOpenRequests - 1);
      }
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.config.requestTimeoutMs) {
      return fn();
    }

    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${this.config.requestTimeoutMs}ms`));
        }, this.config.requestTimeoutMs);
      }),
    ]);
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.metrics.successfulRequests++;
    this.metrics.lastSuccessTime = Date.now();
    this.metrics.consecutiveSuccesses = this.consecutiveSuccesses;
    this.metrics.consecutiveFailures = 0;

    if (this.state === 'HALF_OPEN') {
      // Check if enough successes to close circuit
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }

    this.updateFailureRate();
  }

  /**
   * Handle failed request
   */
  private onFailure(error: unknown): void {
    // Check if this error should count as a failure
    if (this.config.isFailure && !this.config.isFailure(error)) {
      return;
    }

    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = Date.now();
    this.metrics.consecutiveFailures = this.consecutiveFailures;
    this.metrics.consecutiveSuccesses = 0;

    // Record failure
    this.failures.push({
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : String(error),
    });

    // Cleanup old failures
    this.cleanupOldFailures();

    if (this.state === 'HALF_OPEN') {
      // Any failure in half-open reopens the circuit
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      // Check if threshold reached
      if (this.getRecentFailureCount() >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }

    this.updateFailureRate();
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    if (oldState === newState) return;

    console.log(
      `[CircuitBreaker:${this.config.name}] State transition: ${oldState} -> ${newState}`
    );

    this.state = newState;
    this.lastStateChange = Date.now();
    this.metrics.state = newState;

    if (newState === 'CLOSED') {
      this.failures = [];
      this.consecutiveFailures = 0;
      this.halfOpenRequests = 0;
    } else if (newState === 'HALF_OPEN') {
      this.consecutiveSuccesses = 0;
      this.halfOpenRequests = 0;
    }

    // Call state change callback
    if (this.config.onStateChange) {
      this.config.onStateChange(oldState, newState, this);
    }
  }

  /**
   * Get recent failure count within window
   */
  private getRecentFailureCount(): number {
    const cutoff = Date.now() - this.config.failureWindowMs;
    return this.failures.filter(f => f.timestamp >= cutoff).length;
  }

  /**
   * Cleanup old failure records
   */
  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.failureWindowMs;
    this.failures = this.failures.filter(f => f.timestamp >= cutoff);
  }

  /**
   * Update failure rate metric
   */
  private updateFailureRate(): void {
    const total = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.failureRate = total > 0 
      ? Math.round((this.metrics.failedRequests / total) * 100) 
      : 0;
  }

  /**
   * Get time until circuit resets (for OPEN state)
   */
  getTimeUntilReset(): number {
    if (this.state !== 'OPEN') return 0;
    const elapsed = Date.now() - this.lastStateChange;
    return Math.max(0, this.config.resetTimeoutMs - elapsed);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * Force circuit to open (for testing or manual intervention)
   */
  forceOpen(): void {
    this.transitionTo('OPEN');
  }

  /**
   * Force circuit to close (for testing or manual intervention)
   */
  forceClose(): void {
    this.transitionTo('CLOSED');
  }

  /**
   * Reset all metrics and state
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = [];
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures = 0;
    this.halfOpenRequests = 0;
    this.lastStateChange = Date.now();
    
    this.metrics = {
      state: 'CLOSED',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      failureRate: 0,
    };
  }
}

/**
 * Custom error for circuit breaker rejections
 */
export class CircuitBreakerError extends Error {
  public readonly state: CircuitState;
  public readonly retryAfterMs: number;

  constructor(message: string, state: CircuitState, retryAfterMs: number) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.state = state;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers for different services
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(config: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(config.name)) {
      this.breakers.set(config.name, new CircuitBreaker(config));
    }
    return this.breakers.get(config.name)!;
  }

  /**
   * Get a circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  /**
   * Get health status of all circuit breakers
   */
  getHealthStatus(): Record<string, { state: CircuitState; metrics: CircuitBreakerMetrics }> {
    const status: Record<string, { state: CircuitState; metrics: CircuitBreakerMetrics }> = {};
    
    for (const [name, breaker] of this.breakers) {
      status[name] = {
        state: breaker.getState(),
        metrics: breaker.getMetrics(),
      };
    }
    
    return status;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }
}

// Singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// Pre-configured circuit breakers for common services
export const CIRCUIT_BREAKER_CONFIGS = {
  /** Database operations */
  database: {
    name: 'database',
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    successThreshold: 3,
    failureWindowMs: 60000,
    requestTimeoutMs: 5000,
  },
  
  /** External API calls */
  externalApi: {
    name: 'externalApi',
    failureThreshold: 3,
    resetTimeoutMs: 60000,
    successThreshold: 2,
    failureWindowMs: 30000,
    requestTimeoutMs: 10000,
  },
  
  /** Payment gateway */
  paymentGateway: {
    name: 'paymentGateway',
    failureThreshold: 2,
    resetTimeoutMs: 120000, // 2 minutes - more conservative for payments
    successThreshold: 3,
    failureWindowMs: 60000,
    requestTimeoutMs: 30000,
  },
  
  /** Email service */
  emailService: {
    name: 'emailService',
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    successThreshold: 2,
    failureWindowMs: 120000,
    requestTimeoutMs: 10000,
  },
  
  /** Cache/Redis */
  cache: {
    name: 'cache',
    failureThreshold: 10,
    resetTimeoutMs: 10000,
    successThreshold: 2,
    failureWindowMs: 30000,
    requestTimeoutMs: 1000,
  },
} as const;

/**
 * Helper function to wrap an async function with circuit breaker
 */
export function withCircuitBreaker<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config: CircuitBreakerConfig
): T {
  const breaker = circuitBreakerRegistry.getOrCreate(config);
  
  return (async (...args: unknown[]) => {
    return breaker.execute(() => fn(...args));
  }) as T;
}

export { CircuitBreaker };
