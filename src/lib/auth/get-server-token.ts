import { getToken } from "next-auth/jwt"
import { cookies } from "next/headers"

/**
 * Get JWT token from Next.js Server Component
 * 
 * This helper properly extracts cookies for NextAuth's getToken to work in Server Components.
 * 
 * @returns JWT token or null if not authenticated
 */
export async function getServerToken() {
  try {
    const cookieStore = await cookies()
    
    // Get the session token cookie name (NextAuth uses this pattern)
    const secureCookie = process.env.NODE_ENV === "production"
    const cookieName = secureCookie 
      ? "__Secure-next-auth.session-token" 
      : "next-auth.session-token"
    
    const sessionToken = cookieStore.get(cookieName)
    
    if (!sessionToken?.value) {
      return null
    }
    
    // Verify and decode the JWT
    const token = await getToken({
      req: {
        headers: {
          cookie: `${cookieName}=${sessionToken.value}`
        }
      } as { headers: { cookie: string } },
      secret: process.env.NEXTAUTH_SECRET,
    })
    
    return token
  } catch (error) {
    console.error("[AUTH] Error getting server token:", error)
    return null
  }
}
