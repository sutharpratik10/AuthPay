import { NextRequest, NextResponse } from 'next/server';

/**
 * Base Route interface that all route handlers must implement
 */
export interface IRouteHandler {
  handle(req: NextRequest): Promise<NextResponse>;
}

/**
 * Request metadata interface for storing and passing information about the request
 */
export interface RequestMetadata {
  path: string;
  method: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  isAuthenticated: boolean;
  userId?: string;
}

/**
 * Abstract base class for all route handlers
 * Provides common error handling and response formatting
 */
export abstract class BaseRouteHandler implements IRouteHandler {
  /**
   * Main handler method that all routes must implement
   */
  abstract handle(req: NextRequest): Promise<NextResponse>;

  /**
   * Protected method to create a successful response
   */
  protected createSuccessResponse(data: Record<string, unknown>, status = 200): NextResponse {
    return NextResponse.json(data, { status });
  }
  /**
   * Protected method to create an error response
   */
  protected createErrorResponse(error: string | undefined, status = 400): NextResponse {
    return NextResponse.json({ error: error || 'An error occurred' }, { status });
  }

  /**
   * Protected method to handle unexpected errors
   */
  protected handleError(error: unknown, customMessage: string): NextResponse {
    console.error(`${customMessage}:`, error);
    return this.createErrorResponse(
      'An unexpected error occurred',
      500
    );
  }

  /**
   * Protected method to validate email format
   */
  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extract and process request metadata
   */
  protected extractRequestMetadata(req: NextRequest): RequestMetadata {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    // Extract query parameters
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    
    // Extract headers
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Extract path parameters (example: /api/users/:id)
    const params: Record<string, string> = {};
    
    // For now, we're not authenticated by default
    // In a real implementation, you would check authentication headers/cookies
    const isAuthenticated = false;
    
    return {
      path,
      method,
      params,
      query,
      headers,
      isAuthenticated
    };
  }
}
