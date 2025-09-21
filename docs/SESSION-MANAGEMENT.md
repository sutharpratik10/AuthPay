# Enhanced Session Management System

This document describes the comprehensive server-side session management system implemented for TrueAuth.

## 🚀 Features

### Core Session Management
- **Server-side session validation** with database persistence
- **Automatic session extension** for active users
- **Session expiration** with configurable timeouts
- **Multi-device session tracking** with browser and IP logging
- **Session cleanup** with automated expired session removal
- **Session activity tracking** for security monitoring

### Security Features
- **Session token validation** on every request
- **Automatic cleanup** of expired and inactive sessions
- **Session limiting** per user (configurable max sessions)
- **IP and browser tracking** for security alerts
- **Database-backed validation** (not just JWT)
- **Graceful session extension** to prevent premature logouts

### Performance Optimizations
- **Batch session cleanup** for better database performance
- **Configurable cleanup intervals**
- **Efficient session validation** with minimal database queries
- **Session statistics** for monitoring and analytics

## 📁 File Structure

```
src/
├── services/
│   └── session.ts              # Core SessionService class
├── lib/
│   ├── session-validation.ts   # Middleware helpers and validation
│   └── session-manager.ts      # Startup and shutdown management
├── app/api/
│   ├── user/sessions/          # User session management endpoints
│   └── admin/sessions/         # Admin session management endpoints
└── middleware.ts               # Enhanced middleware with session validation
```

## 🛠️ Installation & Setup

### 1. Initialize Session Management

Add this to your application startup (e.g., in `pages/_app.tsx` or `app/layout.tsx`):

```typescript
import { initializeSessionManagement } from '@/lib/session-manager';

// In your app initialization
initializeSessionManagement();
```

### 2. Update Your Environment

No additional environment variables are required. The system uses your existing database configuration.

### 3. Database Schema

The sessions table is already in your schema:

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  browser_name VARCHAR(50),
  ip_address VARCHAR(45),
  last_active_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## 🔧 Usage

### Basic Session Validation

```typescript
import { validateSessionFromRequest } from '@/lib/session-validation';

export async function GET(request: NextRequest) {
  const sessionValidation = await validateSessionFromRequest(request, {
    extendSession: true,        // Extend session if near expiry
    requireVerifiedEmail: true, // Require verified email
    requireActiveUser: true,    // Require active user account
  });

  if (!sessionValidation.isValid) {
    return NextResponse.json(
      { error: sessionValidation.error },
      { status: 401 }
    );
  }

  // Access user data
  const { user, sessionDetails } = sessionValidation;
  
  // Your protected route logic here
}
```

### Using the Session Middleware Helper

```typescript
import { withSessionValidation } from '@/lib/session-validation';

export async function GET(request: NextRequest) {
  return withSessionValidation(
    request,
    async (req, sessionData) => {
      // Your protected route logic
      return NextResponse.json({
        message: `Hello ${sessionData.user?.name}!`,
        userId: sessionData.userId,
      });
    },
    {
      extendSession: true,
      requireVerifiedEmail: true,
    }
  );
}
```

### Manual Session Management

```typescript
import { SessionService } from '@/services/session';

// Create a new session
const session = await SessionService.createSession({
  userId: 'user-id',
  userAgent: request.headers.get('user-agent'),
  ipAddress: getClientIP(request),
});

// Validate a session
const validation = await SessionService.validateSession('session-token');

// Extend a session
await SessionService.extendSession('session-token', {
  extendByMinutes: 30,
  maxSessionDuration: 72, // hours
});

// Get user's active sessions
const activeSessions = await SessionService.getUserActiveSessions('user-id');

// Invalidate a session
await SessionService.invalidateSession('session-token');

// Cleanup expired sessions
const cleanupResult = await SessionService.cleanupExpiredSessions();
```

## 🔒 Security Features

### Session Token Extraction

The system automatically extracts session tokens from multiple sources:

1. **Authorization header**: `Bearer <token>`
2. **Custom header**: `X-Session-Token: <token>`
3. **Cookies**: `session-token`, `next-auth.session-token`, etc.

### Automatic Session Extension

Sessions are automatically extended when:
- User is active and session is within 10 minutes of expiry
- Session hasn't reached maximum duration (default 72 hours)
- User makes authenticated requests

### Session Limits

- **Default**: 5 active sessions per user
- **Configurable**: Adjust in `SessionService.createSession()`
- **Automatic cleanup**: Oldest sessions are removed when limit is exceeded

### Security Alerts

- Email notifications for new logins (if enabled in user preferences)
- IP and browser tracking for suspicious activity
- Location detection for login alerts

## 📊 Monitoring & Analytics

### Session Statistics

```typescript
import { SessionService } from '@/services/session';

const stats = await SessionService.getSessionStatistics();
// Returns:
// {
//   activeSessionsCount: 150,
//   expiredSessionsCount: 12,
//   recentSessionsCount: 25,
//   weeklyActiveSessionsCount: 200,
//   lastUpdated: "2024-01-15T10:30:00Z"
// }
```

### Session Cleanup Results

```typescript
const cleanupResult = await SessionService.cleanupExpiredSessions();
// Returns:
// {
//   deletedCount: 45,
//   totalExpired: 45,
//   cleanupTime: 150 // milliseconds
// }
```

## 🎛️ Configuration

### Session Timeouts

```typescript
// In SessionService class constants:
private static readonly DEFAULT_SESSION_DURATION_HOURS = 24;
private static readonly MAX_SESSION_DURATION_HOURS = 72;
private static readonly SESSION_EXTENSION_MINUTES = 30;
private static readonly CLEANUP_INTERVAL_HOURS = 1;
```

### Cleanup Schedule

```typescript
// Modify cleanup interval (default: 1 hour)
SessionService.startAutomaticCleanup(2); // Every 2 hours
```

### Session Limits

```typescript
// Modify in SessionService.limitUserSessions()
await this.limitUserSessions(userId, 10); // Allow 10 sessions per user
```

## 🚀 API Endpoints

### User Session Management

- `GET /api/user/sessions` - Get user's active sessions
- `DELETE /api/user/sessions?sessionId=<id>` - Invalidate specific session
- `POST /api/user/sessions` - Logout from all other devices

### Admin Session Management

- `GET /api/admin/sessions` - Get session statistics (admin only)
- `POST /api/admin/sessions` - Manual session cleanup (admin only)

## 🐛 Troubleshooting

### Common Issues

1. **Sessions not extending automatically**
   - Check that `extendSession: true` is set in validation options
   - Verify session cleanup isn't running too frequently

2. **Users getting logged out frequently**
   - Increase `DEFAULT_SESSION_DURATION_HOURS`
   - Check if cleanup is removing active sessions

3. **High database load**
   - Reduce cleanup frequency
   - Optimize session validation queries
   - Consider adding database indexes

### Debug Logging

```typescript
// Enable detailed session logging
console.log('Session validation result:', sessionValidation);
console.log('Session cleanup result:', cleanupResult);
```

## 📈 Performance Considerations

### Database Optimization

1. **Indexes**: Ensure indexes on `sessions.token`, `sessions.user_id`, `sessions.expires_at`
2. **Cleanup frequency**: Balance between cleanup efficiency and database load
3. **Batch operations**: Cleanup uses batched deletes for better performance

### Memory Usage

- Session tokens are stored in database, not memory
- Minimal in-memory session data
- Automatic cleanup prevents database bloat

## 🔄 Migration from JWT-only Sessions

If migrating from JWT-only sessions:

1. Update middleware to use `validateSessionFromRequest()`
2. Add session creation to login flows
3. Set up automatic cleanup
4. Update logout to invalidate database sessions

## 🤝 Contributing

When modifying the session system:

1. Test session validation thoroughly
2. Verify cleanup doesn't remove active sessions
3. Check performance impact of changes
4. Update documentation for configuration changes

## 📝 License

This session management system is part of the TrueAuth project and follows the same license terms.
