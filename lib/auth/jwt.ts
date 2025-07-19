import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export interface JWTPayload {
  coachId: string
  username: string
  ageGroup: string
  iat?: number
  exp?: number
}

export async function verifyJWT(request: NextRequest): Promise<{ success: boolean; payload?: JWTPayload }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return { success: false }
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { success: true, payload: payload as JWTPayload }
  } catch (error) {
    console.error("JWT verification failed:", error)
    return { success: false }
  }
}
