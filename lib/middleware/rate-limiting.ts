import type { NextRequest } from "next/server"

// Simple in-memory rate limiting (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(
  request: NextRequest,
  maxRequests = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
): Promise<{ success: boolean; remaining: number }> {
  const ip = request.ip || "unknown"
  const now = Date.now()

  const record = requestCounts.get(ip)

  if (!record || now > record.resetTime) {
    // Reset window
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: maxRequests - record.count }
}
