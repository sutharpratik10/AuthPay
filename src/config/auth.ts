import NextAuth from "next-auth";
import { db } from "@/server/db";
import authConfig from "./auth.config";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { randomUUID } from "crypto";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours in seconds (86400)
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
  debug: process.env.NODE_ENV === 'development',
  trustHost: true,
  basePath: "/api/auth",
  callbacks: {    async signIn({ user, account }) {
      // Allow credentials provider to handle its own logic
      if (account?.provider === "credentials") {
        return true;
      }

      // Handle OAuth providers
      if (account?.provider && ["google", "github", "facebook", "azure-ad", "apple"].includes(account.provider)) {
        try {
          const { users } = await import("@/server/db/schema");
          const { eq } = await import("drizzle-orm");

          // Check if user already exists
          let existingUser: any = null;
          try {
            existingUser = await db.query.users.findFirst({
              where: eq(users.email, user.email!),
            }) as any;
          } catch (dbErr) {
            console.error("Database error during OAuth user lookup:", dbErr);
            // Return a user-friendly error to Auth.js
            return "/auth/error?error=DatabaseUnavailable";
          }
          if (existingUser) {
            // Check if the user account is suspended
            if (existingUser.isSuspended) {
              console.log(`[OAuth] Blocked login for suspended user: ${existingUser.email}`);
              return "/auth/error?error=AccountSuspended";
            }

            // User exists, update their information and mark email as verified
            try {
              await db.update(users)
                .set({
                  name: user.name || existingUser.name,
                  image: user.image || existingUser.image,
                  isEmailVerified: true, // OAuth users don't need email verification
                  lastLoginAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
                .where(eq(users.id, existingUser.id));
            } catch (dbErr) {
              console.error("Database error during OAuth user update:", dbErr);
              return "/auth/error?error=DatabaseUnavailable";
            }

            // Check if account record exists for this provider
            const { accounts } = await import("@/server/db/schema");
            let existingAccount = null;
            try {
              existingAccount = await db.query.accounts.findFirst({
                where: (accountsTable, { and }) => and(
                  eq(accountsTable.userId, existingUser.id),
                  eq(accountsTable.provider, account.provider!)
                ),
              });
            } catch (dbErr) {
              console.error("Database error during OAuth account lookup:", dbErr);
              return "/auth/error?error=DatabaseUnavailable";
            }
            if (!existingAccount) {
              try {
                await db.insert(accounts).values({
                  userId: existingUser.id,
                  type: account.type!,
                  provider: account.provider!,
                  providerAccountId: account.providerAccountId!,
                  refresh_token: account.refresh_token ? String(account.refresh_token) : null,
                  access_token: account.access_token ? String(account.access_token) : null,
                  expires_at: account.expires_at ? Number(account.expires_at) : null,
                  token_type: account.token_type ? String(account.token_type) : null,
                  scope: account.scope ? String(account.scope) : null,
                  id_token: account.id_token ? String(account.id_token) : null,
                  session_state: account.session_state ? String(account.session_state) : null,
                });
              } catch (dbErr) {
                console.error("Database error during OAuth account insert:", dbErr);
                return "/auth/error?error=DatabaseUnavailable";
              }
            }

            // Update the user object for the session
            user.id = existingUser.id;
            return true;
          } else {
            // Create new user with email verified
            const newUserId = randomUUID();
            try {
              await db.insert(users).values({
                id: newUserId,
                email: user.email!,
                name: user.name || "",
                image: user.image || null,
                isEmailVerified: true, // OAuth users don't need email verification
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              });
            } catch (dbErr) {
              console.error("Database error during OAuth user insert:", dbErr);
              return "/auth/error?error=DatabaseUnavailable";
            }
            // Create default user preferences
            const { userPreferences, accounts } = await import("@/server/db/schema");
            try {
              await db.insert(userPreferences).values({
                userId: newUserId,
                emailNotifications: true,
                securityAlerts: true,
                productUpdates: false,
                profileVisibility: true,
                theme: 'system',
                twoFactorAuth: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            } catch (dbErr) {
              console.error("Database error during OAuth userPreferences insert:", dbErr);
              return "/auth/error?error=DatabaseUnavailable";
            }
            // Create account record for OAuth provider
            try {
              await db.insert(accounts).values({
                userId: newUserId,
                type: account.type!,
                provider: account.provider!,
                providerAccountId: account.providerAccountId!,
                refresh_token: account.refresh_token ? String(account.refresh_token) : null,
                access_token: account.access_token ? String(account.access_token) : null,
                expires_at: account.expires_at ? Number(account.expires_at) : null,
                token_type: account.token_type ? String(account.token_type) : null,
                scope: account.scope ? String(account.scope) : null,
                id_token: account.id_token ? String(account.id_token) : null,
                session_state: account.session_state ? String(account.session_state) : null,
              });
            } catch (dbErr) {
              console.error("Database error during OAuth account insert (new user):", dbErr);
              return "/auth/error?error=DatabaseUnavailable";
            }

            // Update the user object for the session
            user.id = newUserId;
            return true;
          }
        } catch (error) {
          console.error("Error handling OAuth sign in:", error);
          return "/auth/error?error=UnknownOAuthError";
        }
      }

      return true;
    },    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.error === "SessionExpired") {
        return {} as Session;
      }

      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.isEmailVerified !== undefined && session.user) {
        session.user.isEmailVerified = token.isEmailVerified;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      if (token.name && session.user) {
        session.user.name = token.name;
      }

      return session;
    },    async jwt({ token, user, trigger, session }: { token: JWT; user?: { isEmailVerified?: boolean; role?: string }; trigger?: string; session?: { name?: string } }) {
      if (!token.sub) return token;

      // Handle session update trigger (when update() is called)
      if (trigger === 'update' && session) {
        if (session.name !== undefined) {
          token.name = session.name;
        }
        return token;
      }

      // Get user from database to check if email is verified and other data
      if (user) {
        token.isEmailVerified = user.isEmailVerified;
        token.role = user.role;

        // --- Login Tracking & Security Alerts ---
        try {
          const { headers } = await import("next/headers");
          const headersList = await headers();
          const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
          const userAgent = headersList.get("user-agent");
          
          const { parseUserAgent } = await import("@/lib/utils/device");
          const { getLocationFromIP } = await import("@/lib/utils/location");
          
          const deviceData = parseUserAgent(userAgent);
          
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          const gpsLocation = cookieStore.get("client-location")?.value;
          
          let location = "Unknown Location";
          if (gpsLocation) {
            location = decodeURIComponent(gpsLocation);
          } else {
            location = await getLocationFromIP(ipAddress);
          }
          
          const { loginHistory, userPreferences, users } = await import("@/server/db/schema");
          const { eq, and } = await import("drizzle-orm");
          
          // Check if device is new
          const pastLogin = await db.query.loginHistory.findFirst({
            where: (history) => and(
              eq(history.userId, token.sub as string),
              eq(history.device, deviceData.device),
              eq(history.browser, deviceData.browser),
              eq(history.os, deviceData.os)
            )
          });
          const isNewDevice = !pastLogin;

          // Save to database
          await db.insert(loginHistory).values({
            userId: token.sub as string,
            ipAddress,
            location,
            device: deviceData.device,
            os: deviceData.os,
            browser: deviceData.browser,
            userAgent,
          });
          
          // Check user preferences for security alerts
          const prefs = await db.query.userPreferences.findFirst({
            where: eq(userPreferences.userId, token.sub as string),
            columns: { securityAlerts: true }
          });
          
          const userRecord = await db.query.users.findFirst({
            where: eq(users.id, token.sub as string),
            columns: { email: true, name: true }
          });
          
          const shouldAlert = prefs?.securityAlerts || isNewDevice;
          
          if (shouldAlert && userRecord?.email) {
            const { emailService } = await import("@/server/services/email");
            // Async send email so we don't block login
            emailService.sendSecurityAlertEmail(
              userRecord.email,
              userRecord.name || "User",
              new Date(),
              location,
              ipAddress,
              `${deviceData.device} - ${deviceData.os} - ${deviceData.browser}`
            ).catch(console.error);
          }
        } catch (err) {
          console.error("Error tracking login:", err);
        }
        // --- End Login Tracking ---
      } else {
        // Only query database if we don't have the verification status or it's been a while
        const shouldRefresh = !token.isEmailVerified || 
          !token.role ||
          !token.lastVerifiedCheck || 
          (Date.now() - (token.lastVerifiedCheck as number)) > 5 * 60 * 1000; // 5 minutes

        if (shouldRefresh) {
          try {
            const userRecord = await db.query.users.findFirst({
              where: (users, { eq }) => eq(users.id, token.sub as string),
              columns: { isEmailVerified: true, name: true, passwordChangedAt: true },
            });

            if (userRecord) {
              // Session Invalidation: Check if password was changed after token was issued
              if (userRecord.passwordChangedAt && token.iat) {
                const passwordChangeTime = new Date(userRecord.passwordChangedAt).getTime();
                if (token.iat * 1000 < passwordChangeTime) {
                  console.log(`[SECURITY] Invalidating session for user ${token.sub} due to password change`);
                  return { ...token, error: "SessionExpired" };
                }
              }

              token.isEmailVerified = userRecord.isEmailVerified ?? false;
              token.name = userRecord.name;
              
              // Get user's roles from user_roles table
              const { RBACService } = await import("@/lib/rbac");
              const userRoles = await RBACService.getUserRoles(token.sub as string);
              
              // Set role to first role or 'user' if no roles
              token.role = userRoles.length > 0 ? userRoles[0] : 'user';
              token.lastVerifiedCheck = Date.now();
            }
          } catch (error) {
            console.error('Error in jwt callback:', error);
            // Don't block the token if there's a database error
          }
        }
      }

      return token;
    }
  },
  ...authConfig,
});
