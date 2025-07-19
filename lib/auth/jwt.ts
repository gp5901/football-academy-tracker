import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function verifyJWT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return { success: false, error: "No token provided" }
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      success: true,
      payload: payload as any,
    }
  } catch (error) {
    return { success: false, error: "Invalid token" }
  }
}
