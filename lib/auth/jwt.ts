import type { NextRequest } from "next/server"
import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export interface JWTPayload {
  coachId: string
  username: string
  ageGroup: string
  iat: number
  exp: number
}

export async function signJWT(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

export async function verifyJWT(request: NextRequest): Promise<{ success: boolean; payload?: JWTPayload }> {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return { success: false }
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { success: true, payload: payload as JWTPayload }
  } catch (error) {
    return { success: false }
  }
}
