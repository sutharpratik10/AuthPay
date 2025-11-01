# API Routes Documentation

## Table of Contents
- [Overview](#overview)
- [API Structure](#api-structure)
- [Authentication APIs](#authentication-apis)
- [RBAC APIs](#rbac-apis)
- [User APIs](#user-apis)
- [Payment APIs](#payment-apis)
- [Job APIs](#job-apis)
- [Response Patterns](#response-patterns)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

AuthPay provides a comprehensive REST API built with Next.js API Routes. All APIs follow consistent patterns for authentication, authorization, error handling, and response formatting.

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

### API Characteristics

- ✅ **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Protected**: RBAC-based authorization
- ✅ **Consistent**: Standardized response patterns
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Validation**: Request/response validation with Zod

## API Structure

```
src/app/api/
├── auth/                    # Authentication endpoints
│   ├── register/
│   ├── login/              # Handled by NextAuth
│   ├── verify/
│   ├── forgot-password/
│   └── reset-password/
│
├── rbac/                    # RBAC management (Admin only)
│   ├── roles/
│   │   ├── route.ts        # List/create roles
│   │   ├── [roleId]/
│   │   │   ├── route.ts    # Get/update/delete role
│   │   │   └── policies/   # Manage role policies
│   ├── policies/
│   │   ├── route.ts        # List/create policies
│   │   └── [policyId]/     # Manage specific policy
│   └── users/
│       └── [userId]/
│           ├── roles/      # Manage user roles
│           └── policies/   # View user policies
│
├── admin/                   # Admin-only endpoints
│   ├── users/
│   ├── dashboard/
│   └── analytics/
│
├── user/                    # User-specific endpoints
│   ├── profile/
│   ├── settings/
│   └── dashboard/
│
└── payments/                # Payment processing
    ├── create-order/
    ├── verify/
    ├── webhook/
    └── history/ 
```

## Authentication APIs

### Register User

**Endpoint**: `POST /api/auth/register`  
**Auth Required**: No

**Request Body**:
```typescript
{
  email: string;         // Valid email
  password: string;      // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
  name: string;          // Full name
}
```

**Response**: 
```typescript
// Success (201)
{
  success: true,
  message: "Registration successful. Please verify your email.",
  userId: string
}

// Error (400/409)
{
  error: "Email already registered" | "Invalid input"
}
```

**Example**:
```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: 'John Doe'
  })
});

const data = await response.json();
```

**Implementation**: `src/app/api/auth/register/route.ts`

### Verify Email

**Endpoint**: `GET /api/auth/verify?token={token}`  
**Auth Required**: No

**Query Parameters**:
- `token`: Email verification token (UUID)

**Response**: Redirects to login or error page

**Implementation**: `src/app/api/auth/verify/route.ts`

### Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`  
**Auth Required**: No

**Request Body**:
```typescript
{
  email: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "If email exists, reset link has been sent"
}
```

**Security Note**: Always returns success to prevent email enumeration

**Implementation**: `src/app/api/auth/forgot-password/route.ts`

### Reset Password

**Endpoint**: `POST /api/auth/reset-password`  
**Auth Required**: No

**Request Body**:
```typescript
{
  token: string;        // Reset token from email
  password: string;     // New password
}
```

**Response**:
```typescript
// Success (200)
{
  success: true,
  message: "Password reset successful"
}

// Error (400)
{
  error: "Invalid or expired token"
}
```

**Implementation**: `src/app/api/auth/reset-password/route.ts`

## RBAC APIs

All RBAC APIs require **admin access** unless otherwise noted.

### Role Management

#### List All Roles

**Endpoint**: `GET /api/rbac/roles`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  roles: [
    {
      id: string;
      name: string;
      description: string;
      isDefault: boolean;
      isSystemManaged: boolean;
      createdAt: string;
      updatedAt: string;
    }
  ]
}
```

#### Create Role

**Endpoint**: `POST /api/rbac/roles/create`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  name: string;              // Unique role name
  description?: string;
  isDefault?: boolean;       // Auto-assign to new users
  isSystemManaged?: boolean; // Prevent deletion
}
```

**Response**:
```typescript
{
  success: true,
  role: {
    id: string;
    name: string;
    // ... other fields
  }
}
```

#### Get Role

**Endpoint**: `GET /api/rbac/roles/[roleId]`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  role: {
    id: string;
    name: string;
    description: string;
    // ... with permissions
    permissions: [
      {
        id: string;
        name: string;
        description: string;
      }
    ]
  }
}
```

#### Update Role

**Endpoint**: `PUT /api/rbac/roles/[roleId]`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  name?: string;
  description?: string;
  isDefault?: boolean;
}
```

**Response**:
```typescript
{
  success: true,
  role: { /* updated role */ }
}
```

#### Delete Role

**Endpoint**: `DELETE /api/admin/roles/[roleId]`  
**Auth Required**: Yes  
**Required Policy**: `role:manage`

**Response**:
```typescript
{
  success: true,
  message: "Role deleted successfully"
}

// Error if system-managed
{
  error: "Cannot delete system-managed role"
}
```

### User Management

#### List All Users

**Endpoint**: `GET /api/admin/users`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

**Response**:
```typescript
{
  success: true,
  users: User[]
}
```

#### Create User

**Endpoint**: `POST /api/admin/users/create`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

**Request Body**:
```typescript
{
  email: string;
  password: string;
  name: string;
  roleId?: string;
}
```

**Response**:
```typescript
{
  success: true,
  user: User
}
```

#### Update User

**Endpoint**: `PUT /api/admin/users/[userId]`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

**Request Body**:
```typescript
{
  name?: string;
  email?: string;
  isSuspended?: boolean;
}
```

#### Delete User

**Endpoint**: `DELETE /api/admin/users/[userId]`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

#### Suspend/Unsuspend User

**Endpoint**: `PUT /api/admin/users/[userId]/suspend`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

**Request Body**:
```typescript
{
  isSuspended: boolean;
}
```

### User-Role Management

#### Get User Roles

**Endpoint**: `GET /api/admin/user-roles?userId={userId}`  
**Auth Required**: Yes  
**Required Policy**: `role:manage`

#### Assign Role to User

**Endpoint**: `POST /api/admin/user-roles`  
**Auth Required**: Yes  
**Required Policy**: `role:manage`

**Request Body**:
```typescript
{
  userId: string;
  roleId: string;
}
```

#### Remove Role from User

**Endpoint**: `DELETE /api/admin/user-roles`  
**Auth Required**: Yes  
**Required Policy**: `role:manage`

**Request Body**:
```typescript
{
  userId: string;
  roleId: string;
}
```

### Subscription Plan Management

#### List Subscription Plans

**Endpoint**: `GET /api/admin/subscription-plans`  
**Auth Required**: Yes  
**Required Policy**: `subscription:manage`

**Query Parameters** (Optional):
- `category`: Filter by category

**Response**:
```typescript
{
  success: true,
  policies: [
    {
      id: string;
      name: string;           // Format: resource:action
      description: string;
      category: string;
      createdAt: string;
    }
  ]
}
```

#### Create Policy

**Endpoint**: `POST /api/rbac/policies/create`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  name: string;           // Format: resource:action
  description?: string;
  category?: string;
}
```

**Validation**:
- Name must follow `resource:action` format
- Name must be unique

**Response**:
```typescript
{
  success: true,
  policy: {
    id: string;
    name: string;
    // ... other fields
  }
}
```

#### Update Policy

**Endpoint**: `PUT /api/rbac/policies/[policyId]`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  description?: string;
  category?: string;
}
```

**Note**: Cannot update `name` to maintain referential integrity

#### Delete Policy

**Endpoint**: `DELETE /api/rbac/policies/[policyId]`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  message: "Policy deleted successfully"
}
```

### Role-Policy Assignment

#### Get Role's Policies

**Endpoint**: `GET /api/rbac/roles/[roleId]/policies`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  role: {
    id: string;
    name: string;
  },
  policies: [
    {
      id: string;
      name: string;
      description: string;
    }
  ]
}
```

#### Assign Policy to Role

**Endpoint**: `POST /api/rbac/roles/[roleId]/policies`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  policyId: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Policy assigned to role successfully"
}
```

#### Remove Policy from Role

**Endpoint**: `DELETE /api/rbac/roles/[roleId]/policies`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  policyId: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Policy removed from role successfully"
}
```

### User-Role Assignment

#### Get User's Roles

**Endpoint**: `GET /api/rbac/users/[userId]/roles`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  user: {
    id: string;
    email: string;
    name: string;
  },
  roles: [
    {
      id: string;
      name: string;
      description: string;
      assignedAt: string;
    }
  ]
}
```

#### Assign Role to User

**Endpoint**: `POST /api/rbac/users/[userId]/roles`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  roleId: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Role assigned to user successfully"
}
```

**Side Effects**:
- Clears user's permission cache

#### Remove Role from User

**Endpoint**: `DELETE /api/rbac/users/[userId]/roles`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  roleId: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Role removed from user successfully"
}
```

**Side Effects**:
- Clears user's permission cache

#### Get User's Computed Policies

**Endpoint**: `GET /api/rbac/users/[userId]/policies`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  user: {
    id: string;
    email: string;
  },
  policies: [
    "content:view",
    "content:create",
    "profile:edit",
    // ... aggregated from all roles
  ]
}
```

### Permission Check

**Endpoint**: `POST /api/rbac/check-permission`  
**Auth Required**: Yes (Authenticated user)

**Request Body**:
```typescript
{
  userId?: string;      // Optional, defaults to current user
  policy: string;       // Policy to check
}
```

**Response**:
```typescript
{
  success: true,
  hasPermission: boolean
}
```

**Use Case**: Frontend can check if user has specific permission

## User APIs

### Get Current User Profile

**Endpoint**: `GET /api/user/profile`  
**Auth Required**: Yes

**Response**:
```typescript
{
  success: true,
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: string | null;
    createdAt: string;
    roles: string[];
    policies: string[];
  }
}
```

### Update Profile

**Endpoint**: `PUT /api/user/profile`  
**Auth Required**: Yes  
**Policy Required**: `profile:edit`

**Request Body**:
```typescript
{
  name?: string;
  image?: string;
}
```

**Response**:
```typescript
{
  success: true,
  user: { /* updated user */ }
}
```

### Get Dashboard URL

**Endpoint**: `GET /api/rbac/user/dashboard`  
**Auth Required**: Yes

**Response**:
```typescript
{
  success: true,
  dashboardUrl: string,  // '/protected/admin/dashboard' or '/protected/user/dashboard'
  isAdmin: boolean
}
```

**Use Case**: Navigate user to appropriate dashboard based on policies

## Payment APIs

> **⚠️ Security:** All payment APIs now require authentication and implement role-based authorization. See [Authorization Model](#payment-authorization-model) below.

### Payment Authorization Model

**Two-Layer Security:**

1. **Authentication** (Layer 1) - All payment APIs require valid user session
2. **Authorization** (Layer 2) - Role-based access control:
   - **Admin users** → Full access to ALL users' payment data
   - **Regular users** → Access ONLY to their OWN payment data

**Authorization Rules:**

| Resource Type | Admin Access | User Access |
|--------------|--------------|-------------|
| **Subscriptions** | All subscriptions | Only subscriptions owned by user (matched by `razorpaySubscriptionId`) |
| **Payments** | All payments | Only payments matching user's `email` or `customer_id` |
| **Invoices** | All invoices | Only invoices matching user's `subscription_id` or `customer_id` |
| **Plans** | Read all, Create new | Read all (public pricing) |

**Response Format:**
All list endpoints include an `isAdmin` flag:
```typescript
{
  "entity": "collection",
  "count": 5,
  "items": [...],
  "isAdmin": false  // Indicates if user has admin privileges
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User doesn't own the resource and is not admin

---

### Razorpay Plans

#### List All Plans

**Endpoint**: `GET /api/payments/razorpay-plans`  
**Auth Required**: ✅ Yes  
**Authorization**: All authenticated users (public pricing information)

**Query Parameters**:
- `from` (number, optional) - Unix timestamp for start date filter
- `to` (number, optional) - Unix timestamp for end date filter
- `count` (number, optional) - Number of items to return
- `skip` (number, optional) - Number of items to skip for pagination

**Response**:
```typescript
{
  "success": true,
  "entity": "collection",
  "count": 10,
  "items": [
    {
      "id": "plan_xxx",
      "entity": "plan",
      "interval": 1,
      "period": "monthly",
      "item": {
        "id": "item_xxx",
        "name": "Premium Plan",
        "amount": 99900,  // Amount in paise (999.00 INR)
        "currency": "INR",
        "description": "Premium features"
      },
      "notes": {},
      "created_at": 1640000000
    }
  ]
}
```

**Example**:
```typescript
const response = await fetch('/api/payments/razorpay-plans', {
  credentials: 'include'
});
const data = await response.json();
```

---

#### Get Plan by ID

**Endpoint**: `GET /api/payments/razorpay-plans/[id]`  
**Auth Required**: ✅ Yes  
**Authorization**: All authenticated users

**URL Parameters**:
- `id` - Razorpay Plan ID (e.g., `plan_xxx`)

**Response**:
```typescript
{
  "success": true,
  "data": {
    "id": "plan_xxx",
    "entity": "plan",
    "interval": 1,
    "period": "monthly",
    "item": {
      "id": "item_xxx",
      "name": "Premium Plan",
      "amount": 99900,
      "currency": "INR"
    }
  }
}
```

---

#### Create Plan (Admin Only)

**Endpoint**: `POST /api/payments/razorpay-plans`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 **Admin Only**

**Request Body**:
```typescript
{
  "period": "monthly" | "yearly" | "weekly" | "daily",
  "interval": 1,  // Number of billing cycles
  "item": {
    "name": "Premium Plan",
    "amount": 99900,  // Amount in paise
    "currency": "INR",
    "description": "Premium features with advanced analytics"
  },
  "notes": {
    "feature_tier": "premium",
    "custom_key": "custom_value"
  }
}
```

**Response**:
```typescript
// Success (201)
{
  "success": true,
  "plan": { /* created plan object */ }
}

// Error - Not Admin (403)
{
  "success": false,
  "error": "Admin access required"
}
```

---

### Razorpay Subscriptions

#### List All Subscriptions

**Endpoint**: `GET /api/payments/razorpay-subscriptions`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Role-based filtering
- **Admin**: Returns all subscriptions
- **User**: Returns only user's own subscriptions

**Query Parameters**:
- `plan_id` (string, optional) - Filter by Razorpay plan ID
- `from` (number, optional) - Unix timestamp
- `to` (number, optional) - Unix timestamp
- `count` (number, optional) - Number of items
- `skip` (number, optional) - Skip items for pagination

**Response**:
```typescript
{
  "success": true,
  "subscriptions": [
    {
      "id": "sub_xxx",
      "entity": "subscription",
      "plan_id": "plan_xxx",
      "customer_id": "cust_xxx",
      "status": "active" | "paused" | "cancelled" | "completed",
      "current_start": 1640000000,
      "current_end": 1642678400,
      "charge_at": 1642678400,
      "total_count": 12,
      "paid_count": 3,
      "remaining_count": 9,
      "created_at": 1640000000
    }
  ],
  "count": 5,
  "isAdmin": false  // Indicates if requesting user is admin
}
```

**Behavior**:
- Admins see ALL subscriptions from all users
- Regular users see ONLY their own subscriptions (filtered by `razorpaySubscriptionId` in database)

---

#### Get Subscription by ID

**Endpoint**: `GET /api/payments/razorpay-subscriptions/[id]`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required
- **Admin**: Can access any subscription
- **User**: Can only access subscriptions they own

**URL Parameters**:
- `id` - Razorpay Subscription ID (e.g., `sub_xxx`)

**Response**:
```typescript
// Success (200)
{
  "id": "sub_xxx",
  "entity": "subscription",
  "plan_id": "plan_xxx",
  "status": "active",
  "customer_notify": 1,
  // ... all subscription fields
  "isAdmin": false
}

// Error - Not Owned (403)
{
  "success": false,
  "error": "You do not have permission to access this subscription"
}
```

---

#### Create Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/create`  
**Auth Required**: ✅ Yes  
**Authorization**: All authenticated users can create subscriptions for themselves

**Request Body** (Option 1 - Using Local Plan ID):
```typescript
{
  "planId": "local-plan-uuid",  // UUID from your database
  "customer_notify": true,
  "total_count": 12,  // Number of billing cycles
  "quantity": 1,
  "notes": {
    "user_note": "Annual subscription"
  }
}
```

**Request Body** (Option 2 - Using Razorpay Plan ID):
```typescript
{
  "razorpayPlanId": "plan_xxx",  // Direct Razorpay plan ID
  "customer_notify": true,
  "end_at": 1735689600,  // Unix timestamp for end date
  "notes": {}
}
```

**Response**:
```typescript
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "entity": "subscription",
    "status": "created",
    "plan_id": "plan_xxx",
    // ... subscription details
  }
}
```

---

#### Pause Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/[id]/pause`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required (user must own subscription or be admin)

**URL Parameters**:
- `id` - Subscription ID to pause

**Request Body**:
```typescript
{
  "pause_at": "now" | number  // "now" or Unix timestamp
}
```

**Response**:
```typescript
// Success (200)
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "status": "paused",
    "paused_at": 1640000000
  }
}

// Error - Not Owned (403)
{
  "success": false,
  "error": "You do not have permission to access this subscription"
}
```

---

#### Resume Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/[id]/resume`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required

**URL Parameters**:
- `id` - Subscription ID to resume

**Request Body**:
```typescript
{
  "resume_at": "now" | number  // "now" or Unix timestamp
}
```

**Response**:
```typescript
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "status": "active"
  }
}
```

---

#### Cancel Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/[id]/cancel`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required

**URL Parameters**:
- `id` - Subscription ID to cancel

**Request Body**:
```typescript
{
  "cancel_at_cycle_end": boolean  // If true, cancels at end of current billing cycle
}
```

**Response**:
```typescript
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "status": "cancelled",
    "ended_at": 1640000000
  }
}
```

---

### Razorpay Payments

#### List All Payments

**Endpoint**: `GET /api/payments/razorpay-payments`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Role-based filtering
- **Admin**: Returns all payments from all users
- **User**: Returns only payments matching user's email or customer_id

**Query Parameters**:
- `count` (number, optional, default: 10, max: 10) - Items per page
- `skip` (number, optional, default: 0) - Items to skip
- `from` (number, optional) - Unix timestamp for start date
- `to` (number, optional) - Unix timestamp for end date
- `q` (string, optional) - Search query (searches payment ID, order ID, email)
- `fetchAll` (boolean, optional) - Fetch all payments across multiple pages

**Special Features**:
- **Pagination**: Use `count` and `skip` for standard pagination
- **Search**: Use `q` parameter to filter by payment ID, order ID, or email
- **Fetch All**: Set `fetchAll=true` to automatically paginate through ALL results (admin useful)

**Response**:
```typescript
{
  "entity": "collection",
  "count": 10,
  "items": [
    {
      "id": "pay_xxx",
      "entity": "payment",
      "amount": 99900,  // Amount in paise
      "currency": "INR",
      "status": "captured" | "failed" | "refunded",
      "order_id": "order_xxx",
      "method": "card" | "netbanking" | "wallet" | "upi",
      "email": "user@example.com",
      "contact": "+919876543210",
      "fee": 2360,  // Payment gateway fee
      "tax": 360,
      "captured": true,
      "created_at": 1640000000
    }
  ],
  "isAdmin": false
}
```

**Behavior**:
- Admins see payments from ALL users
- Regular users see ONLY payments matching their email or customer_id
- Search filter is applied AFTER authorization filtering

**Example - Fetch User's Payments**:
```typescript
const response = await fetch('/api/payments/razorpay-payments?count=20&skip=0', {
  credentials: 'include'
});
const data = await response.json();
console.log(`Found ${data.count} payments (Admin: ${data.isAdmin})`);
```

**Example - Search Payments**:
```typescript
const response = await fetch('/api/payments/razorpay-payments?q=user@example.com', {
  credentials: 'include'
});
```

**Example - Fetch All (Admin)**:
```typescript
// Automatically paginates through all payments
const response = await fetch('/api/payments/razorpay-payments?fetchAll=true', {
  credentials: 'include'
});
```

---

#### Get Payment by ID

**Endpoint**: `GET /api/payments/razorpay-payments/[id]`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required
- **Admin**: Can access any payment
- **User**: Can only access payments matching their email or customer_id

**URL Parameters**:
- `id` - Razorpay Payment ID (e.g., `pay_xxx`)

**Response**:
```typescript
// Success (200)
{
  "id": "pay_xxx",
  "entity": "payment",
  "amount": 99900,
  "currency": "INR",
  "status": "captured",
  "method": "card",
  "email": "user@example.com",
  "card": {
    "id": "card_xxx",
    "network": "Visa",
    "last4": "1234",
    "type": "credit"
  },
  "created_at": 1640000000,
  "isAdmin": false
}

// Error - Not Owned (403)
{
  "success": false,
  "error": "You do not have permission to access this payment"
}
```

---

### Razorpay Invoices

#### List All Invoices

**Endpoint**: `GET /api/payments/razorpay-invoices`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Role-based filtering
- **Admin**: Returns all invoices
- **User**: Returns only invoices matching user's subscription_id or customer_id

**Query Parameters**:
- `subscription_id` (string, optional) - Filter by subscription ID
- `count` (number, optional, default: 20) - Items per page
- `skip` (number, optional, default: 0) - Items to skip
- `status` (string, optional) - Filter by status (paid, issued, expired, cancelled)
- `customer_id` (string, optional) - Filter by customer ID
- `payment_id` (string, optional) - Filter by payment ID

**Response**:
```typescript
{
  "entity": "collection",
  "count": 10,
  "items": [
    {
      "id": "inv_xxx",
      "entity": "invoice",
      "type": "invoice",
      "status": "paid" | "issued" | "expired" | "cancelled",
      "amount": 99900,
      "amount_paid": 99900,
      "amount_due": 0,
      "currency": "INR",
      "customer_id": "cust_xxx",
      "subscription_id": "sub_xxx",
      "payment_id": "pay_xxx",
      "issued_at": 1640000000,
      "paid_at": 1640100000,
      "expire_by": 1640500000,
      "created_at": 1640000000
    }
  ],
  "isAdmin": false
}
```

---

#### Get Invoice by ID

**Endpoint**: `GET /api/payments/razorpay-invoices/[id]`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required
- **Admin**: Can access any invoice
- **User**: Can only access invoices matching their subscription_id or customer_id

**URL Parameters**:
- `id` - Razorpay Invoice ID (e.g., `inv_xxx`)

**Response**:
```typescript
// Success (200)
{
  "id": "inv_xxx",
  "entity": "invoice",
  "status": "paid",
  "amount": 99900,
  "currency": "INR",
  "customer_id": "cust_xxx",
  "subscription_id": "sub_xxx",
  "payment_id": "pay_xxx",
  "line_items": [
    {
      "item_id": "item_xxx",
      "name": "Premium Plan",
      "amount": 99900,
      "quantity": 1
    }
  ],
  "issued_at": 1640000000,
  "paid_at": 1640100000,
  "isAdmin": false
}

// Error - Not Owned (403)
{
  "success": false,
  "error": "You do not have permission to access this invoice"
}
```

---

### Legacy Payment Endpoints

#### Create Payment Order

**Endpoint**: `POST /api/payments/create-order`  
**Auth Required**: Yes  
**Policy Required**: `payment:create`

**Request Body**:
```typescript
{
  amount: number;       // Amount in INR
  planId: string;       // Subscription plan
  currency?: string;    // Default: 'INR'
}
```

**Response**:
```typescript
{
  success: true,
  orderId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
}
```

---

#### Verify Payment

**Endpoint**: `POST /api/payments/verify`  
**Auth Required**: Yes

**Request Body**:
```typescript
{
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Payment verified successfully",
  subscriptionId: string;
}
```

---

#### Payment History

**Endpoint**: `GET /api/payments/history`  
**Auth Required**: Yes  
**Policy Required**: `payment:view`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:
```typescript
{
  success: true,
  payments: [
    {
      id: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: string;
      completedAt: string | null;
    }
  ],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

---

#### Payment Webhook

**Endpoint**: `POST /api/payments/webhook`  
**Auth Required**: No (Validated via signature)

**Headers**:
- `x-razorpay-signature`: Webhook signature

**Request Body**: Razorpay webhook payload

**Response**:
```typescript
{
  success: true,
  message: "Webhook processed"
}
```

**Security**: Validates webhook signature before processing

---

### Payment API Security Summary

**Authentication & Authorization:**
- ✅ All payment APIs require authentication (Layer 1)
- ✅ Role-based authorization implemented (Layer 2)
- ✅ Admin users have full access to all data
- ✅ Regular users can only access their own data
- ✅ 403 Forbidden responses for unauthorized access

**Data Privacy:**
- ✅ Subscriptions matched by `razorpaySubscriptionId` ownership
- ✅ Payments matched by user's `email` or `customer_id`
- ✅ Invoices matched by user's `subscription_id` or `customer_id`

**Audit & Transparency:**
- ✅ All responses include `isAdmin` flag
- ✅ Console logging for all access attempts
- ✅ Clear error messages for denied access

**For Complete Details, See:**
- [Payment API Authorization Enhancement](./PAYMENT-API-AUTHORIZATION-ENHANCEMENT.md)
- [Payment API Security Refactor](./PAYMENT-API-SECURITY-REFACTOR.md)
- [Payment API Quick Reference](./PAYMENT-API-QUICK-REFERENCE.md)
- [Authorization Summary](./AUTHORIZATION-SUMMARY.md)

## Job APIs

### List Jobs

**Endpoint**: `GET /api/jobs`  
**Auth Required**: Yes

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `search`: Search term
- `type`: Job type filter
- `location`: Location filter

**Response**:
```typescript
{
  success: true,
  jobs: [
    {
      id: string;
      title: string;
      company: string;
      location: string;
      type: string;
      description: string;
      salary?: string;
      createdAt: string;
    }
  ],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
}
```

### Create Job

**Endpoint**: `POST /api/jobs`  
**Auth Required**: Yes  
**Policy Required**: `content:create`

**Request Body**:
```typescript
{
  title: string;
  company: string;
  location?: string;
  type?: string;
  description: string;
  requirements?: string;
  salary?: string;
  applyUrl?: string;
}
```

**Response**:
```typescript
{
  success: true,
  job: { /* created job */ }
}
```

### Get Job

**Endpoint**: `GET /api/jobs/[jobId]`  
**Auth Required**: Yes

**Response**:
```typescript
{
  success: true,
  job: {
    id: string;
    title: string;
    company: string;
    // ... all job fields
  }
}
```

### Update Job

**Endpoint**: `PUT /api/jobs/[jobId]`  
**Auth Required**: Yes  
**Policy Required**: `content:edit` (or content:edit:own for own jobs)

**Request Body**: Same as Create Job

### Delete Job

**Endpoint**: `DELETE /api/jobs/[jobId]`  
**Auth Required**: Yes  
**Policy Required**: `content:delete`

**Response**:
```typescript
{
  success: true,
  message: "Job deleted successfully"
}
```

### Search Jobs

**Endpoint**: `POST /api/jobs/search`  
**Auth Required**: Yes

**Request Body**:
```typescript
{
  query: string;
  filters?: {
    type?: string[];
    location?: string[];
    salary?: { min?: number; max?: number };
  };
  page?: number;
  limit?: number;
}
```

**Response**: Same as List Jobs

## Response Patterns

### Success Response

```typescript
{
  success: true,
  data?: any,
  message?: string,
  metadata?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    // ... other metadata
  }
}
```

### Error Response

```typescript
{
  error: string,
  details?: any,
  code?: string
}
```

**HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

## Error Handling

### Standard Error Handler

```typescript
try {
  // API logic
} catch (error) {
  console.error('API Error:', error);
  
  return NextResponse.json(
    {
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    },
    { status: 500 }
  );
}
```

### Validation Errors

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

try {
  const validated = schema.parse(body);
} catch (error) {
  return NextResponse.json(
    { error: 'Validation failed', details: error.errors },
    { status: 400 }
  );
}
```

### Authentication Errors

```typescript
const session = await auth();

if (!session) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

### Authorization Errors

```typescript
const authCheck = await requirePolicy(req, POLICIES.ADMIN_ACCESS);

if (!authCheck.authorized) {
  return authCheck.response; // 403 Forbidden
}
```

## Best Practices

### 1. Use Policy Middleware

```typescript
import { requirePolicy, POLICIES } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);
  
  if (!authCheck.authorized) {
    return authCheck.response;
  }
  
  // Proceed with logic
}
```

### 2. Validate Input

```typescript
import { z } from 'zod';

const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1),
  description: z.string().min(10),
});

const validated = createJobSchema.parse(body);
```

### 3. Use Transactions

```typescript
import { db } from '@/server/db';

await db.transaction(async (tx) => {
  const user = await tx.insert(users).values(userData).returning();
  await tx.insert(userRoles).values({ userId: user.id, roleId });
});
```

### 4. Return Consistent Responses

```typescript
// ✅ Good
return NextResponse.json({
  success: true,
  data: result
});

// ❌ Bad
return NextResponse.json(result);
```

### 5. Log Errors

```typescript
try {
  // Logic
} catch (error) {
  console.error('[API Error]', {
    endpoint: '/api/jobs',
    error: error.message,
    userId: session?.user?.id,
  });
  
  throw error;
}
```

### 6. Rate Limiting

```typescript
// Implement rate limiting for sensitive endpoints
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

await limiter.check(req, 10); // 10 requests per minute
```

### 7. Cache Responses

```typescript
// Cache expensive queries
import { cache } from '@/lib/cache';

const cacheKey = `user:${userId}:policies`;
const cached = await cache.get(cacheKey);

if (cached) {
  return NextResponse.json(cached);
}

const policies = await RBACService.getUserPolicies(userId);
await cache.set(cacheKey, policies, 300); // 5 minutes
```

### 8. Use TypeScript

```typescript
// Define request/response types
interface CreateJobRequest {
  title: string;
  company: string;
  description: string;
}

interface CreateJobResponse {
  success: true;
  job: Job;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<CreateJobResponse>> {
  // Type-safe implementation
}
```

## Testing APIs

### Using fetch

```typescript
const response = await fetch('/api/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Software Engineer',
    company: 'Tech Corp',
    description: 'Great opportunity'
  })
});

const data = await response.json();
```

### Using Axios

```typescript
import axios from 'axios';

const { data } = await axios.post('/api/jobs', {
  title: 'Software Engineer',
  company: 'Tech Corp',
  description: 'Great opportunity'
});
```

### Testing with Jest

```typescript
import { POST } from '@/app/api/jobs/route';

describe('POST /api/jobs', () => {
  it('should create a job', async () => {
    const req = new Request('http://localhost/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Job',
        company: 'Test Company',
        description: 'Test description'
      })
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.job).toBeDefined();
  });
});
```

## Next Steps

- Read [10-TESTING.md](./10-TESTING.md) for comprehensive API testing
- Check [12-SECURITY.md](./12-SECURITY.md) for security best practices
- Review example implementations in `src/app/api/examples/`
