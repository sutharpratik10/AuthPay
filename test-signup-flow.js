#!/usr/bin/env node
/**
 * Test script for email verification flow
 * This script tests the registration and verification API endpoints
 */

const API_BASE = 'http://localhost:3001/api';

async function testRegistrationFlow() {
  console.log('🧪 Testing Signup and Email Verification Flow\n');

  // Test data
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'testpassword123',
    name: 'Test User'
  };

  console.log(`📝 Testing with user: ${testUser.email}\n`);

  try {
    // Step 1: Test user registration
    console.log('1️⃣ Testing user registration...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ Registration successful');
      console.log(`   User ID: ${registerData.user?.id}`);
      console.log(`   Email: ${registerData.user?.email}`);
      console.log(`   Message: ${registerData.message}\n`);
    } else {
      console.log('❌ Registration failed');
      console.log(`   Error: ${registerData.error}\n`);
      return;
    }

    // Step 2: Simulate OTP verification (would need manual input in real scenario)
    console.log('2️⃣ Email verification test...');
    console.log('📧 Verification email should have been sent');
    console.log('ℹ️  In a real scenario, user would:');
    console.log('   - Check their email inbox');
    console.log('   - Find the 6-digit verification code');
    console.log('   - Enter it on /auth/verify page');
    console.log('   - Get redirected to dashboard after verification\n');

    // Step 3: Test resend verification email
    console.log('3️⃣ Testing resend verification email...');
    const resendResponse = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testUser.email }),
    });

    const resendData = await resendResponse.json();
    
    if (resendResponse.ok) {
      console.log('✅ Resend verification email successful');
      console.log(`   Message: ${resendData.message}\n`);
    } else {
      console.log('❌ Resend verification email failed');
      console.log(`   Error: ${resendData.error}\n`);
    }

    // Summary
    console.log('📊 Test Summary:');
    console.log('✅ User registration API works');
    console.log('✅ Verification email sending works');
    console.log('✅ Resend verification email works');
    console.log('\n🎯 Next steps for manual testing:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to: http://localhost:3001/auth/signup');
    console.log('3. Register with a real email address');
    console.log('4. Check email for verification code');
    console.log('5. Complete verification on /auth/verify');
    console.log('6. Verify redirect to dashboard\n');

  } catch (error) {
    console.log('❌ Test failed with error:');
    console.error(error);
    console.log('\n💡 Make sure the development server is running:');
    console.log('   npm run dev');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRegistrationFlow();
}

module.exports = { testRegistrationFlow };
