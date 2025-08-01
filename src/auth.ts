import NextAuth from "next-auth";
import { db } from "@/db";
import authConfig from "./auth.config";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
  debug: process.env.NODE_ENV === 'development',
  trustHost: true,
  basePath: "/api/auth",
  callbacks: {    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.isEmailVerified !== undefined && session.user) {
        session.user.isEmailVerified = token.isEmailVerified;
      }

      if (token.name && session.user) {
        session.user.name = token.name;
      }

      return session;
    },    async jwt({ token, user, trigger, session }: { token: JWT; user?: { isEmailVerified?: boolean }; trigger?: string; session?: { name?: string } }) {
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
      } else {
        // Only query database if we don't have the verification status or it's been a while
        const shouldRefresh = !token.isEmailVerified || 
          !token.lastVerifiedCheck || 
          (Date.now() - (token.lastVerifiedCheck as number)) > 5 * 60 * 1000; // 5 minutes

        if (shouldRefresh) {
          try {
            const dbUser = await db.query.users.findFirst({
              where: (users, { eq }) => eq(users.id, token.sub as string),
              columns: { isEmailVerified: true, name: true } // Include name for updates
            });

            if (dbUser) {
              token.isEmailVerified = dbUser.isEmailVerified ?? false;
              token.name = dbUser.name;
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
