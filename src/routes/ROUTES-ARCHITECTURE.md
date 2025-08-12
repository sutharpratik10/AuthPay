# RSVP API Routes Architecture

## Overview

This document describes the architecture of the consolidated routing system in the RSVP application. The routing system uses TypeScript's Object-Oriented Programming features to provide a clean, maintainable, and scalable API layer.

## Key Components

### 1. Routes Class

The `Routes` class is the main entry point for all API routes. It:
- Exposes HTTP method handlers (GET, POST, PUT, DELETE, PATCH)
- Delegates requests to specific route handlers
- Provides a unified interface for all API endpoints

### 2. RouteFactory Class

The `RouteFactory` implements the Factory pattern to create and manage route handlers:
- Uses a singleton pattern to ensure a single instance
- Provides a registry for route handlers
- Supports both named routes and pattern-based routes
- Dynamically maps URLs to appropriate handlers

### 3. Base Route Handlers

The system includes abstract base classes that provide common functionality:
- `BaseRouteHandler` - Core functionality for all route handlers
- `AuthRouteHandler` - Specialized functionality for authentication routes

### 4. Specialized Route Handlers

Concrete implementations for specific API endpoints:
- `RegistrationRouteHandler` - User registration
- `VerifyEmailRouteHandler` - Email verification
- `ResendVerificationEmailRouteHandler` - Resending verification emails
- `LoginRouteHandler` - User login
- `LogoutRouteHandler` - User logout
- `AuthStateHandler` - Authentication status checks

### 5. User API Handlers

The system includes specialized handlers for user management:
- `UserRouteHandler` - Base class with common user functionality

## Class Hierarchy

```
IRouteHandler (Interface)
└── BaseRouteHandler (Abstract)
    ├── AuthRouteHandler (Abstract)
    │   ├── RegistrationRouteHandler
    │   └── LoginRouteHandler
    ├── UserRouteHandler (Abstract)
    ├── VerifyEmailRouteHandler
    ├── ResendVerificationEmailRouteHandler
    ├── AuthStateHandler
    └── LogoutRouteHandler
```

## How to Add a New Route

1. Create a new route handler class that extends `BaseRouteHandler` or one of its subclasses:

```typescript
class MyNewRouteHandler extends BaseRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Your route logic here
      return this.createSuccessResponse({ message: 'Success' });
    } catch (error) {
      return this.handleError(error, 'My new route error');
    }
  }
}
```

2. Register the route handler in the `RouteFactory` constructor:

```typescript
private constructor() {
  // Existing routes...
  this.registerRoute('my-new-route', new MyNewRouteHandler());
}
```

3. Optionally, add a convenience method in the `Routes` class:

```typescript
static async myNewRoute(req: NextRequest): Promise<NextResponse> {
  return RouteFactory.getInstance().getRouteHandler('my-new-route').handle(req);
}
```

## Integration with NextAuth

The system includes a `NextAuthHandler` that integrates with Next.js Authentication, but it's currently not active to avoid conflicts with Next-Auth's implementation. It can be activated when needed for custom authentication logic.

## Error Handling

The system provides unified error handling through the `BaseRouteHandler` class:
- `createErrorResponse` - Generates consistent error responses
- `handleError` - Processes unexpected errors
- Each route handler includes try/catch blocks for proper error management

## Benefits of This Architecture

1. **Separation of Concerns** - Each route handler focuses on a specific API endpoint
2. **Code Reusability** - Common functionality is shared through inheritance
3. **Maintainability** - Easy to add, modify, or remove routes without affecting others
4. **Testability** - Route handlers can be tested in isolation
5. **Type Safety** - Strong TypeScript typing throughout the system
6. **Scalability** - Pattern supports growth with minimal code duplication
