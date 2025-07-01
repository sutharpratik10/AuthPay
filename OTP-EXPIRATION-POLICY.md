# OTP Code Management and 15-Minute Expiration Policy

## Overview
This document outlines the implementation of the 15-minute expiration policy for OTP (One-Time Password) codes used in email verification.

## 🕐 **Expiration Policy**

### **15-Minute Expiration Window**
- **Duration**: OTP codes expire exactly 15 minutes after generation
- **Automatic Cleanup**: Expired codes are automatically deleted from the database
- **Security**: Codes are immediately deleted after successful verification

### **Code Lifecycle**
```
Code Generation → 15-Minute Window → Expiration/Deletion
     ↓
Successful Verification → Immediate Deletion
```

## 🔧 **Technical Implementation**

### **Database Changes**
- **Expiration Time**: `expiresAt` set to `new Date(Date.now() + 15 * 60 * 1000)`
- **Immediate Deletion**: Successful verification deletes the code instead of marking invalid
- **Cleanup Process**: Expired codes are automatically removed

### **AuthService Updates**

#### **1. Registration Process**
```typescript
// Store verification code with 15-minute expiration
await db.insert(otpCodes).values({
  userId: newUser.id,
  code: verificationCode,
  type: "email_verification",
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  isValid: true,
  createdAt: new Date(),
});
```

#### **2. Verification Process**
```typescript
// Delete the OTP code after successful verification
await db.delete(otpCodes)
  .where(eq(otpCodes.id, otpRecord.id));
```

#### **3. Resend Process**
```typescript
// Delete old codes instead of invalidating them
await db.delete(otpCodes)
  .where(
    and(
      eq(otpCodes.userId, user.id),
      eq(otpCodes.type, "email_verification")
    )
  );
```

## 🧹 **Cleanup System**

### **Automatic Cleanup**
- **During Verification**: Expired codes are cleaned up before processing
- **Periodic Cleanup**: `CleanupService` handles scheduled maintenance
- **Manual Cleanup**: Admin API endpoint for manual trigger

### **CleanupService Features**
```typescript
// Run all cleanup tasks
CleanupService.runCleanup()

// Schedule periodic cleanup (every 60 minutes by default)
CleanupService.schedulePeriodicCleanup(60)
```

### **Admin API Endpoint**
- **Endpoint**: `POST /api/admin/cleanup`
- **Purpose**: Manual cleanup trigger for testing and maintenance
- **Response**: Success/failure status with cleanup details

## 📧 **Email Template Updates**

### **Expiration Notice**
The verification email now clearly states:
```html
<p>This code will expire in 15 minutes</p>
```

### **Security Instructions**
- Clear 15-minute deadline communicated to users
- Urgency conveyed without causing alarm
- Instructions remain user-friendly

## 🔄 **User Experience Flow**

### **Optimal Flow**
```
1. User registers → OTP generated (15-min timer starts)
2. User receives email → "Code expires in 15 minutes"
3. User enters code → Verification successful → Code deleted
4. User redirected to dashboard
```

### **Expiration Scenarios**
```
1. Code expires → User gets "Invalid or expired" error
2. User requests resend → Old codes deleted, new code generated
3. New 15-minute timer starts
```

## 🛡️ **Security Benefits**

### **Reduced Attack Window**
- **15-minute window** vs previous 24-hour window
- **87.5% reduction** in exposure time
- **Immediate deletion** prevents code reuse

### **Database Hygiene**
- **No accumulation** of old codes
- **Automatic cleanup** prevents table bloat
- **Performance optimization** through regular maintenance

## 🧪 **Testing the Implementation**

### **Manual Testing Steps**

1. **Register a new user**:
   ```bash
   # Use test script
   node test-signup-flow.js
   ```

2. **Verify expiration timing**:
   - Check database after 15 minutes
   - Confirm codes are automatically deleted
   - Test expired code rejection

3. **Test cleanup service**:
   ```bash
   # Manual cleanup trigger
   curl -X POST http://localhost:3001/api/admin/cleanup
   ```

### **Database Verification**
```sql
-- Check OTP codes table
SELECT * FROM otp_codes WHERE type = 'email_verification';

-- Check expiration times
SELECT code, expires_at, 
       CASE 
         WHEN expires_at > NOW() THEN 'Valid'
         ELSE 'Expired'
       END as status
FROM otp_codes;
```

## 📊 **Performance Improvements**

### **Before (24-hour expiration)**
- Codes accumulated in database
- Manual invalidation only
- Potential for code reuse attacks

### **After (15-minute expiration)**
- ✅ Immediate deletion after use
- ✅ Automatic cleanup of expired codes
- ✅ 87.5% reduction in attack window
- ✅ Better database performance
- ✅ Enhanced security posture

## 🔧 **Configuration Options**

### **Expiration Time**
Currently hardcoded to 15 minutes. Can be configured via environment variable:
```typescript
const expirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES || '15');
const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
```

### **Cleanup Frequency**
Periodic cleanup can be adjusted:
```typescript
// Run cleanup every 30 minutes
CleanupService.schedulePeriodicCleanup(30);
```

## 🚀 **Deployment Considerations**

### **Environment Variables**
```env
# Optional: Custom OTP expiration (in minutes)
OTP_EXPIRATION_MINUTES=15

# Optional: Cleanup interval (in minutes)
CLEANUP_INTERVAL_MINUTES=60
```

### **Production Setup**
1. **Cron Job**: Set up periodic cleanup via cron
2. **Monitoring**: Monitor cleanup logs for issues
3. **Metrics**: Track OTP success/failure rates

## ✅ **Implementation Status**

- ✅ **15-minute expiration implemented**
- ✅ **Immediate deletion after verification**
- ✅ **Automatic cleanup during verification**
- ✅ **CleanupService created**
- ✅ **Admin cleanup API endpoint**
- ✅ **Email template updated**
- ✅ **Documentation completed**

## 📋 **Summary**

The 15-minute OTP expiration policy significantly enhances security while maintaining a good user experience. The implementation includes:

1. **15-minute expiration window** for all OTP codes
2. **Immediate deletion** after successful verification
3. **Automatic cleanup** of expired codes
4. **Comprehensive cleanup service** for maintenance
5. **Admin API endpoint** for manual cleanup
6. **Updated email templates** with clear expiration notice

The system is now more secure, performant, and maintainable with proper database hygiene.
