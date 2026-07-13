import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth';
import { auth, signOut } from '@/config/auth';
import { BaseRouteHandler, IRouteHandler } from './BaseRouteHandler';
import { RegisterSchema, VerifyEmailSchema, ResendVerificationSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@/lib/validations/auth';
import { createVerificationToken, verifyVerificationToken } from '@/lib/utils/secure-token';

/**
 * Abstract authentication route handler
 * Provides common methods for authentication routes
 */
abstract class AuthRouteHandler extends BaseRouteHandler {
  /**
   * Protected method to validate registration/login input
   */
  protected validateAuthInput(email: string, password: string): { isValid: boolean; error?: string } {
    if (!email || !password) {
      return { isValid: false, error: 'Email and password are required' };
    }

    if (!this.validateEmail(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
  }
}

/**
 * Registration route handler
 */
class RegistrationRouteHandler extends AuthRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const parsed = RegisterSchema.safeParse(body);
      if (!parsed.success) {
        return this.createErrorResponse(parsed.error.issues[0].message, 400);
      }
      const { email, password, name } = parsed.data;      

      // Register user
      const result = await AuthService.registerUser(email, password, name || undefined);

      if (!result.success) {
        const errorMsg = result.error || 'Registration failed. Please try again or contact support.';
        return this.createErrorResponse(errorMsg, 400);
      }

      // Create a secure signed verification token (valid for 1 hour)
      const verificationToken = createVerificationToken({
        email: result.user?.email!,
        userId: result.user?.id!
      });

      // Create response with verification token in secure cookie
      const response = this.createSuccessResponse({
        message: 'User registered successfully. Please verify your email.'
      });

      // Set secure HTTP-only cookie with verification token
      response.cookies.set('verification-token', verificationToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 // 1 hour
      });

      return response;
    } catch (error) {
      return this.handleError(error, 'Registration error');
    }
  }
}

/**
 * Email verification route handler
 */
class VerifyEmailRouteHandler extends BaseRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      let code: string | null = null;
      
      console.log(`[VERIFY] Method: ${req.method}`);
      
      if (req.method === 'GET') {
        // Legacy URL-based verification (for backwards compatibility)
        const searchParams = req.nextUrl.searchParams;
        code = searchParams.get('code');
        console.log(`[VERIFY] GET request, code from URL: ${code}`);
      } else if (req.method === 'POST') {
        // New OTP-based verification
        const body = await req.json();
        const parsed = VerifyEmailSchema.safeParse(body);
        if (!parsed.success) {
          return this.createErrorResponse(parsed.error.issues[0].message, 400);
        }
        code = parsed.data.code;
        console.log(`[VERIFY] POST request, code from body: ${code}`, body);
      } else {
        console.log(`[VERIFY] Unsupported method: ${req.method}`);
        return this.createErrorResponse('Method not allowed', 405);
      }

      if (!code) {
        console.log(`[VERIFY] No code provided`);
        return this.createErrorResponse('Verification code is required', 400);
      }

      console.log(`[VERIFY] Attempting to verify code: ${code}`);
      const result = await AuthService.verifyEmail(code);

      console.log(`[VERIFY] Verification result:`, result);
      
      if (!result.success) {
        return this.createErrorResponse(result.error || 'Email verification failed', 400);
      }

      // Create response and clear verification token cookie (security cleanup)
      const response = this.createSuccessResponse({
        message: 'Email verified successfully',
        user: result.user
      });

      // Clear the verification token cookie after successful verification
      response.cookies.delete('verification-token');

      return response;
    } catch (error) {
      console.error(`[VERIFY] Error:`, error);
      return this.handleError(error, 'Verification error');
    }
  }
}

/**
 * Resend verification email route handler
 */
class ResendVerificationEmailRouteHandler extends BaseRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      let { email } = body;

      // If email is not in body, try to get it from verification token
      if (!email) {
        const verificationToken = req.cookies.get('verification-token')?.value;
        
        if (verificationToken) {
          const tokenData = verifyVerificationToken(verificationToken);
          if (!tokenData) {
            return this.createErrorResponse('Verification session expired or invalid. Please register again.', 400);
          }
          email = tokenData.email;
        }
      }

      if (!email) {
        return this.createErrorResponse('Email is required or verification session expired', 400);
      }

      const parsed = ResendVerificationSchema.safeParse({ email });
      if (!parsed.success) {
        return this.createErrorResponse(parsed.error.issues[0].message, 400);
      }
      email = parsed.data.email;

      const result = await AuthService.resendVerificationEmail(email);

      if (!result.success) {
        return this.createErrorResponse(result.error || 'Failed to resend verification email', 400);
      }

      return this.createSuccessResponse({
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      return this.handleError(error, 'Resend verification email error');
    }
  }
}

/**
 * Password reset initiation route handler
 */
class InitiatePasswordResetRouteHandler extends BaseRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const parsed = ForgotPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return this.createErrorResponse(parsed.error.issues[0].message, 400);
      }
      const { email } = parsed.data;

      const result = await AuthService.initiatePasswordReset(email);

      if (!result.success) {
        return this.createErrorResponse(result.error || 'Failed to initiate password reset', 400);
      }

      return this.createSuccessResponse({
        message: result.message || 'Password reset code sent successfully',
        sessionToken: result.sessionToken // SECURITY: Return session token for secure flow
      });
    } catch (error) {
      return this.handleError(error, 'Password reset initiation error');
    }
  }
}

/**
 * Password reset route handler
 */
class PasswordResetRouteHandler extends BaseRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const parsed = ResetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return this.createErrorResponse(parsed.error.issues[0].message, 400);
      }
      const { code, newPassword } = parsed.data;      const result = await AuthService.resetPassword(code, newPassword);

      if (!result.success) {
        return this.createErrorResponse(
          'error' in result ? result.error : 'Failed to reset password', 
          400
        );
      }

      return this.createSuccessResponse({
        message: 'message' in result ? result.message : 'Password reset successfully'
      });
    } catch (error) {
      return this.handleError(error, 'Password reset error');
    }
  }
}

/**
 * Authentication state handler - checks current auth status
 */
class AuthStateHandler extends BaseRouteHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Get current session
      const session = await auth();
      
      if (!session || !session.user) {
        return this.createSuccessResponse({
          authenticated: false,
          user: null
        });
      }
      
      return this.createSuccessResponse({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isEmailVerified: session.user.isEmailVerified || false
        }
      });
    } catch (error) {
      return this.handleError(error, 'Auth state error');
    }
  }
}

/**
 * Logout handler - handles user logout requests
 */
class LogoutRouteHandler extends BaseRouteHandler {  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Call NextAuth signOut
      await signOut({ redirect: false });
      
      return this.createSuccessResponse({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      return this.handleError(error, 'Logout error');
    }
  }
}

/**
 * NextAuth integration handler - specific handler for NextAuth routes
 * This connects our routing system to Next-Auth handlers
 * NOTE: This handler is currently not in use but is kept for future integration
 * @unused
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class NextAuthHandler extends BaseRouteHandler {
  private readonly getHandler: (req: NextRequest | Request) => Promise<Response>;
  private readonly postHandler: (req: NextRequest | Request) => Promise<Response>;

  constructor(
    getHandler: (req: NextRequest | Request) => Promise<Response>,
    postHandler: (req: NextRequest | Request) => Promise<Response>
  ) {
    super();
    this.getHandler = getHandler;
    this.postHandler = postHandler;
  }

  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Based on the method, call the appropriate Next-Auth handler
      if (req.method === 'GET') {
        const response = await this.getHandler(req);
        return NextResponse.json(await response.json(), {
          status: response.status,
          headers: response.headers
        });
      } else if (req.method === 'POST') {
        const response = await this.postHandler(req);
        return NextResponse.json(await response.json(), {
          status: response.status,
          headers: response.headers
        });
      }

      return this.createErrorResponse('Method not supported', 405);
    } catch (error) {
      return this.handleError(error, 'NextAuth handler error');
    }
  }
}

/**
 * Route factory that creates and returns the appropriate route handler
 * Uses a registry pattern for dynamic route registration
 */
class RouteFactory {
  private static instance: RouteFactory;
  private routes: Map<string, IRouteHandler>;
  private routePatterns: Map<RegExp, IRouteHandler>;
  private constructor() {
    this.routes = new Map();
    this.routePatterns = new Map();    // Register default routes
    this.registerRoute('register', new RegistrationRouteHandler());
    this.registerRoute('verify', new VerifyEmailRouteHandler());
    this.registerRoute('resendVerification', new ResendVerificationEmailRouteHandler());
      
    // Password reset routes
    this.registerRoute('initiatePasswordReset', new InitiatePasswordResetRouteHandler());
    this.registerRoute('resetPassword', new PasswordResetRouteHandler());
    
    // Login is handled by NextAuth, not our custom routes
    this.registerRoute('authState', new AuthStateHandler());
    this.registerRoute('logout', new LogoutRouteHandler());
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance(): RouteFactory {
    if (!RouteFactory.instance) {
      RouteFactory.instance = new RouteFactory();
    }
    return RouteFactory.instance;
  }
  
  /**
   * Register a new route handler
   */
  registerRoute(routeName: string, handler: IRouteHandler): void {
    this.routes.set(routeName, handler);
  }
  
  /**
   * Register a route with a regex pattern
   */
  registerPatternRoute(pattern: RegExp, handler: IRouteHandler): void {
    this.routePatterns.set(pattern, handler);
  }

  /**
   * Get a route handler by name
   */
  getRouteHandler(routeName: string): IRouteHandler {
    const handler = this.routes.get(routeName);
    if (!handler) {
      throw new Error(`Route '${routeName}' not found`);
    }
    return handler;
  }
  
  /**
   * Find a handler that matches the given path
   */
  getHandlerForPath(path: string): IRouteHandler | null {
    // First check exact routes
    for (const [routeName, handler] of this.routes.entries()) {
      if (path.includes(`/api/auth/${routeName}`)) {
        return handler;
      }
    }
    
    // Then check pattern routes
    for (const [pattern, handler] of this.routePatterns.entries()) {
      if (pattern.test(path)) {
        return handler;
      }
    }
    
    return null;
  }
}

/**
 * Routes class with static methods that serve as API endpoints
 * Acts as the main entry point for all API routes
 */
export class Routes {
  /**
   * Register a new user
   */
  static async registerUser(req: NextRequest): Promise<NextResponse> {
    return RouteFactory.getInstance().getRouteHandler('register').handle(req);
  }

  /**
   * Verify user email
   */
  static async verifyEmail(req: NextRequest): Promise<NextResponse> {
    const handler = RouteFactory.getInstance().getRouteHandler('verify');
    return handler.handle(req);
  }
  /**
   * Resend verification email
   */
  static async resendVerificationEmail(req: NextRequest): Promise<NextResponse> {
    return RouteFactory.getInstance().getRouteHandler('resendVerification').handle(req);
  }

  /**
   * Initiate password reset
   */
  static async initiatePasswordReset(req: NextRequest): Promise<NextResponse> {
    return RouteFactory.getInstance().getRouteHandler('initiatePasswordReset').handle(req);
  }
  /**
   * Reset password
   */
  static async resetPassword(req: NextRequest): Promise<NextResponse> {
    return RouteFactory.getInstance().getRouteHandler('resetPassword').handle(req);
  }
  
  /**
   * Process a request based on its path
   */
  private static async processRequest(req: NextRequest): Promise<NextResponse> {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Get handler from factory based on path
    const handler = RouteFactory.getInstance().getHandlerForPath(path);
    
    if (handler) {
      return handler.handle(req);
    }    // If no handler is found, return 404
    const errorHandler = new class extends BaseRouteHandler {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async handle(req: NextRequest): Promise<NextResponse> {
        return this.createErrorResponse('Route not found', 404);
      }
    }();
    
    return errorHandler.handle(req);
  }

  /**
   * HTTP method handlers for API routes
   */  static async GET(req: NextRequest): Promise<NextResponse> {
    const url = new URL(req.url);
    const path = url.pathname;
    
    if (path.includes('/api/auth/verify')) {
      return Routes.verifyEmail(req);
    }
    
    // Process other GET requests through the dynamic router
    return Routes.processRequest(req);
  }  static async POST(req: NextRequest): Promise<NextResponse> {
    const url = new URL(req.url);
    const path = url.pathname;
      if (path.includes('/api/auth/register')) {
      return Routes.registerUser(req);
    }
    
    if (path.includes('/api/auth/verify')) {
      // We need to clone the request to read the body without consuming it
      const requestClone = req.clone();
      
      try {
        return Routes.verifyEmail(requestClone as NextRequest);
      } catch {
        return Routes.verifyEmail(req);
      }
    }
    // Password reset routes
    if (path.includes('/api/auth/forgot-password')) {
      return Routes.initiatePasswordReset(req);
    }

    if (path.includes('/api/auth/reset-password')) {
      return Routes.resetPassword(req);
    }
    
    // Process other POST requests through the dynamic router
    return Routes.processRequest(req);
  }
  
  /**
   * Support for PUT requests
   */
  static async PUT(req: NextRequest): Promise<NextResponse> {
    return Routes.processRequest(req);
  }
  
  /**
   * Support for DELETE requests
   */
  static async DELETE(req: NextRequest): Promise<NextResponse> {
    return Routes.processRequest(req);
  }
    /**
   * Support for PATCH requests
   */
  static async PATCH(req: NextRequest): Promise<NextResponse> {
    return Routes.processRequest(req);
  }
    /**
   * Initialize and configure routes
   * This method should be called during application startup
   */
  static initialize(): void {
    // Routes are already registered in the RouteFactory constructor
    
    // Any additional setup can be done here
    
    console.log('Routes initialized successfully');
  }
}

export default Routes;
