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
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.isEmailVerified !== undefined && session.user) {
        session.user.isEmailVerified = token.isEmailVerified;
      }

      return session;
    },
    async jwt({ token, user }: { token: JWT; user?: { isEmailVerified?: boolean } }) {
      if (!token.sub) return token;

      // Get user from database to check if email is verified
      if (user) {
        token.isEmailVerified = user.isEmailVerified;
      } else {
        try {
          const dbUser = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, token.sub as string)
          });

          if (dbUser) {
            token.isEmailVerified = dbUser.isEmailVerified ?? false;
          }
        } catch (error) {
          console.error('Error in jwt callback:', error);
        }
      }

      return token;
    }
  },
  ...authConfig,
});
