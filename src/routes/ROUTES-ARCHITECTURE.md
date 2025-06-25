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

### 5. Tenant API Handlers

The system includes specialized handlers for tenant management:
- `TenantRouteHandler` - Base class with common tenant functionality
- `CreateTenantRouteHandler` - Create new tenants
- `GetTenantRouteHandler` - Retrieve tenant data
- `UpdateTenantRouteHandler` - Update tenant information
- `DeleteTenantRouteHandler` - Delete tenants
- `TenantSettingsRouteHandler` - Manage tenant settings

## Class Hierarchy

```
IRouteHandler (Interface)
└── BaseRouteHandler (Abstract)
    ├── AuthRouteHandler (Abstract)
    │   ├── RegistrationRouteHandler
    │   └── LoginRouteHandler
    ├── TenantRouteHandler (Abstract)
    │   ├── CreateTenantRouteHandler
    │   ├── GetTenantRouteHandler
    │   ├── UpdateTenantRouteHandler
    │   ├── DeleteTenantRouteHandler
    │   ├── TenantSettingsRouteHandler
    │   ├── TenantUsersRouteHandler
    │   ├── TenantRolesRouteHandler
    │   └── TenantBillingRouteHandler
    ├── VerifyEmailRouteHandler
    ├── ResendVerificationEmailRouteHandler
    ├── AuthStateHandler
    └── LogoutRouteHandler
```

## Tenant API Endpoints

The routing system supports the following tenant-related endpoints:

1. **Create Tenant**
   - Path: `/api/tenant/create`
   - Method: `POST`
   - Description: Creates a new tenant
   - Payload:
     ```json
     {
       "name": "Tenant Name",
       "slug": "tenant-slug",
       "logoUrl": "https://example.com/logo.png",
       "primaryColor": "#FF5733"
     }
     ```

2. **Get Tenant**
   - Path: `/api/tenant/:slug`
   - Method: `GET`
   - Description: Retrieves tenant data by slug

3. **Update Tenant**
   - Path: `/api/tenant/:slug/update`
   - Method: `PUT` or `PATCH`
   - Description: Updates tenant information
   - Payload: Same as Create Tenant (fields to update)

4. **Delete Tenant**
   - Path: `/api/tenant/:slug/delete`
   - Method: `DELETE`
   - Description: Deletes a tenant

5. **Manage Tenant Settings**
   - Path: `/api/tenant/:slug/settings`
   - Methods:
     - `GET`: Retrieve all settings
     - `POST`/`PUT`: Create or update settings
     - `DELETE`: Delete a setting
   - Payload for Create/Update:
     ```json
     {
       "key": "setting-key",
       "value": "setting-value"
     }
     ```
   - Payload for Delete:
     ```json
     {
       "key": "setting-key"
     }
     ```

6. **Manage Tenant Users**
   - Path: `/api/tenant/:slug/users`
   - Methods:
     - `GET`: List all users in the tenant
     - `POST`: Add a user to the tenant or update role
     - `DELETE`: Remove a user from the tenant
   - Payload for Add/Update:
     ```json
     {
       "email": "user@example.com",
       "role": "admin|member|guest"
     }
     ```
   - Payload for Delete:
     ```json
     {
       "userId": "user-uuid",
       "role": "admin|member|guest"
     }
     ```

7. **Manage Tenant Roles**
   - Path: `/api/tenant/:slug/roles`
   - Methods:
     - `GET`: List all roles in the tenant
     - `POST`: Create a new role
     - `PUT`/`PATCH`: Update an existing role
     - `DELETE`: Delete a role
   - Payload for Create:
     ```json
     {
       "name": "Role Name",
       "description": "Role description",
       "isDefault": false,
       "permissionIds": ["uuid1", "uuid2", "uuid3"]
     }
     ```
   - Payload for Update:
     ```json
     {
       "id": "role-uuid",
       "name": "Updated Role Name",
       "description": "Updated description",
       "isDefault": true,
       "permissionIds": ["uuid1", "uuid2", "uuid3"]
     }
     ```
   - Payload for Delete:
     ```json
     {
       "id": "role-uuid"
     }
     ```

8. **Manage Tenant Billing**
   - Path: `/api/tenant/:slug/billing`
   - Methods:
     - `GET`: Get billing details including subscription plan and invoice history
     - `POST`/`PUT`: Update subscription plan or billing details
   - Payload for Update:
     ```json
     {
       "planId": "plan-uuid",
       "paymentMethod": "credit_card|paypal|bank_transfer"
     }
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
