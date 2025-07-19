import type { NextRequest } from "next/server"

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: Date
}

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(
  request: NextRequest,
  maxRequests = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
): Promise<RateLimitResult> {
  const clientId = getClientId(request)
  const now = Date.now()
  const windowStart = now - windowMs

  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }

  const current = rateLimitStore.get(clientId)

  if (!current || current.resetTime < now) {
    // New window
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + windowMs,
    })

    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: new Date(now + windowMs),
    }
  }

  if (current.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(current.resetTime),
    }
  }

  // Increment count
  current.count++
  rateLimitStore.set(clientId, current)

  return {
    success: true,
    remaining: maxRequests - current.count,
    resetTime: new Date(current.resetTime),
  }
}

function getClientId(request: NextRequest): string {
  // In production, use a combination of IP, user agent, and user ID
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.ip || "unknown"
  return ip
}
