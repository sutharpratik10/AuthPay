"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Github,
  CreditCard,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { EMAIL_REGEX, hasSQLInjectionPatterns } from "@/lib/utils/sanitize";

// Steps in the auth flow
type AuthStep =
  | "email"          // Step 1: Enter email
  | "new-user-otp"   // Step 2a: New user → OTP verification
  | "existing-login"  // Step 2b: Existing user → all login options
  | "existing-otp"   // Sub-step: existing user chose OTP
  | "existing-password" // Sub-step: existing user chose password
  | "checking-sub"   // Step 3: Checking subscription status
  | "has-subscription"; // Result: already subscribed

interface PricingAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: () => void; // Called when auth + sub check passes (no active sub)
  planName?: string;
  planId?: string;
}

export default function PricingAuthModal({
  open,
  onOpenChange,
  onAuthSuccess,
  planName,
  planId,
}: PricingAuthModalProps) {
  const router = useRouter();

  // Flow state
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // Password state
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Loading states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // General error
  const [generalError, setGeneralError] = useState("");

  // Reset all state when modal closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset everything on close
        setStep("email");
        setEmail("");
        setEmailError("");
        setOtp("");
        setOtpError("");
        setPassword("");
        setPasswordError("");
        setShowPassword(false);
        setGeneralError("");
        setIsCheckingEmail(false);
        setIsSendingOtp(false);
        setIsVerifying(false);
        setIsLoggingIn(false);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Validate email format
  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError("Email is required");
      return false;
    }
    if (hasSQLInjectionPatterns(value)) {
      setEmailError("Invalid input detected");
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Step 1: Check if email exists
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setIsCheckingEmail(true);
    setGeneralError("");

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.emailExists) {
        // Existing user → show all login options
        setStep("existing-login");
      } else {
        // New user → send OTP and go to verification
        await sendOtp();
        setStep("new-user-otp");
      }
    } catch {
      setGeneralError("Failed to check email. Please try again.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Send OTP via passwordless API
  const sendOtp = async () => {
    setIsSendingOtp(true);
    setGeneralError("");
    try {
      const res = await fetch("/api/auth/passwordless/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "otp" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Failed to send OTP"
      );
      throw err;
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP and sign in
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    setOtpError("");
    setGeneralError("");

    try {
      // Verify the OTP
      const verifyRes = await fetch("/api/auth/passwordless/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success || !verifyData.credentials) {
        setOtpError(verifyData.error || "Invalid or expired code");
        return;
      }

      // Sign in with the credentials
      const signInResult = await signIn("credentials", {
        email: verifyData.credentials.email,
        password: verifyData.credentials.password,
        skipPasswordCheck: verifyData.credentials.skipPasswordCheck,
        redirect: false,
      });

      if (signInResult?.error) {
        setGeneralError("Sign in failed. Please try again.");
        return;
      }

      // Auth successful → check subscription
      await checkSubscriptionAndProceed();
    } catch {
      setGeneralError("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    setIsLoggingIn(true);
    setPasswordError("");
    setGeneralError("");

    try {
      // Validate credentials first
      const validateRes = await fetch("/api/auth/validate-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!validateRes.ok) {
        const errorData = await validateRes.json();
        if (errorData.error === "Invalid credentials") {
          setPasswordError("Incorrect password. Please try again.");
        } else {
          setGeneralError(errorData.error || "Login failed");
        }
        return;
      }

      const validationResult = await validateRes.json();

      // Handle 2FA if required
      if (validationResult.requires2FA) {
        setGeneralError(
          "This account requires 2FA. Please use the main login page."
        );
        return;
      }

      // Sign in with NextAuth
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setGeneralError("Login failed. Please try again.");
        return;
      }

      // Auth successful → check subscription
      await checkSubscriptionAndProceed();
    } catch {
      setGeneralError("An error occurred. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider: string) => {
    const callbackUrl = planId
      ? `/pricing?plan=${encodeURIComponent(planId)}&auto=true`
      : "/pricing";
    await signIn(provider, { callbackUrl });
  };

  // Handle existing user choosing OTP
  const handleExistingUserOtp = async () => {
    try {
      await sendOtp();
      setStep("existing-otp");
    } catch {
      // Error already set by sendOtp
    }
  };

  // Check subscription and proceed
  const checkSubscriptionAndProceed = async () => {
    setStep("checking-sub");
    try {
      const res = await fetch("/api/user/subscription-status");
      const data = await res.json();

      if (data.success && data.data?.isActive) {
        setStep("has-subscription");
      } else {
        // No active subscription → proceed to payment
        handleOpenChange(false);
        // Small delay to let the modal close
        setTimeout(() => {
          onAuthSuccess();
        }, 300);
      }
    } catch {
      // On error, proceed to payment (don't block the user)
      handleOpenChange(false);
      setTimeout(() => {
        onAuthSuccess();
      }, 300);
    }
  };

  // Go back to previous step
  const handleBack = () => {
    setGeneralError("");
    setOtp("");
    setOtpError("");
    setPassword("");
    setPasswordError("");
    if (step === "new-user-otp" || step === "existing-login") {
      setStep("email");
    } else if (step === "existing-otp" || step === "existing-password") {
      setStep("existing-login");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {step === "has-subscription" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Active Subscription
                </>
              ) : step === "checking-sub" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Almost there...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-primary" />
                  {planName
                    ? `Get ${planName}`
                    : "Sign in to continue"}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {step === "email" &&
                "Enter your email to get started. We'll check if you already have an account."}
              {step === "new-user-otp" &&
                `We've sent a 6-digit code to ${email}. Enter it below to create your account.`}
              {step === "existing-login" &&
                `Welcome back! Choose how you'd like to sign in.`}
              {step === "existing-otp" &&
                `We've sent a 6-digit code to ${email}.`}
              {step === "existing-password" &&
                `Enter your password to sign in.`}
              {step === "checking-sub" &&
                "Verifying your subscription status..."}
              {step === "has-subscription" &&
                "You already have an active subscription."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 pt-4">
          {/* General Error */}
          {generalError && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-400">
                {generalError}
              </p>
            </div>
          )}

          {/* ─── Step 1: Email Input ─── */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="pricing-email"
                  className="block text-sm font-medium"
                >
                  Email address
                </label>
                <Input
                  id="pricing-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  placeholder="you@example.com"
                  className={
                    emailError
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }
                  autoFocus
                />
                {emailError && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isCheckingEmail || !email}
              >
                {isCheckingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          )}

          {/* ─── Step 2a: New User OTP Verification ─── */}
          {step === "new-user-otp" && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Change email
              </button>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="new-user-otp-input"
                    className="block text-sm font-medium"
                  >
                    Verification Code
                  </label>
                  <Input
                    id="new-user-otp-input"
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    className={`text-center tracking-widest text-lg ${otpError ? "border-red-500" : ""
                      }`}
                    autoFocus
                  />
                  {otpError && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {otpError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isVerifying || otp.length < 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={sendOtp}
                  disabled={isSendingOtp}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {isSendingOtp ? "Resending..." : "Didn't receive it? Resend code"}
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2b: Existing User Login Options ─── */}
          {step === "existing-login" && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Change email
              </button>

              {/* Email display */}
              <div className="px-3 py-2 rounded-lg bg-muted/50 border text-sm flex items-center justify-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{email}</span>
              </div>

              {/* Password login option */}
              <Button
                variant="outline"
                className="w-full h-11 justify-center gap-3 border border-border"
                onClick={() => setStep("existing-password")}
              >
                <KeyRound className="h-4 w-4" />
                Sign in with Password
              </Button>

              {/* OTP login option */}
              <Button
                variant="outline"
                className="w-full h-11 justify-center gap-3 border border-border"
                disabled={isSendingOtp}
                onClick={handleExistingUserOtp}
              >
                {isSendingOtp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isSendingOtp ? "Sending code..." : "Sign in with Email Code"}
              </Button>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-accent text-muted-foreground">
                    OR
                  </span>
                </div>
              </div>

              {/* Social login options */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-11 justify-center gap-3 border border-border"
                  onClick={() => handleSocialLogin("google")}
                >
                  <Mail className="h-4 w-4" />
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 justify-center gap-3 border border-border"
                  onClick={() => handleSocialLogin("github")}
                >
                  <Github className="h-4 w-4" />
                  Continue with GitHub
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 justify-center gap-3 border border-border"
                  onClick={() => handleSocialLogin("azure-ad")}
                >
                  <CreditCard className="h-4 w-4" />
                  Continue with Microsoft
                </Button>
              </div>
            </div>
          )}

          {/* ─── Existing User: OTP Verification ─── */}
          {step === "existing-otp" && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to login options
              </button>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="existing-otp-input"
                    className="block text-sm font-medium"
                  >
                    Verification Code
                  </label>
                  <Input
                    id="existing-otp-input"
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    className={`text-center tracking-widest text-lg ${otpError ? "border-red-500" : ""
                      }`}
                    autoFocus
                  />
                  {otpError && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {otpError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isVerifying || otp.length < 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={sendOtp}
                  disabled={isSendingOtp}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {isSendingOtp ? "Resending..." : "Didn't receive it? Resend code"}
                </button>
              </div>
            </div>
          )}

          {/* ─── Existing User: Password Login ─── */}
          {step === "existing-password" && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to login options
              </button>

              {/* Email display */}
              <div className="px-3 py-2 rounded-lg bg-muted/50 border text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{email}</span>
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label
                      htmlFor="pricing-password"
                      className="block text-sm font-medium"
                    >
                      Password
                    </label>
                    <a
                      href="/auth/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="pricing-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Enter your password"
                      className={`pr-10 ${passwordError ? "border-red-500" : ""
                        }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {passwordError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoggingIn || !password}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in & Continue"
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* ─── Step 3: Checking Subscription ─── */}
          {step === "checking-sub" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Checking your subscription status...
              </p>
            </div>
          )}

          {/* ─── Result: Active Subscription ─── */}
          {step === "has-subscription" && (
            <div className="flex flex-col items-center text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  You're Already Subscribed!
                </h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  You already have an active subscription. Head to your
                  dashboard to manage it or explore your premium features.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Button
                  onClick={() => router.push("/protected/user/dashboard")}
                  className="w-full h-11"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="w-full h-11"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
