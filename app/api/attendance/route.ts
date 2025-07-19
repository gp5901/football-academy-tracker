import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { rateLimit } from "../../../lib/middleware/rate-limiting"
import { AttendanceService } from "../../../lib/services/attendance-service"
import { PostgresAttendanceRepository } from "../../../lib/repositories/attendance-repository"
import { PhotoStorageService } from "../../../lib/services/photo-storage-service"
import { getDbPool } from "../../../lib/database/connection"
import { bulkAttendanceSchema } from "../../../lib/validation/schemas"
import { BusinessError, ValidationError } from "../../../lib/errors/custom-errors"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

// Initialize services
const dbPool = getDbPool()
const attendanceRepo = new PostgresAttendanceRepository(dbPool)
const photoStorage = new PhotoStorageService({ maxSizeBytes: 5 * 1024 * 1024 }) // 5MB
const attendanceService = new AttendanceService(attendanceRepo, dbPool, photoStorage)

async function validateJWT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as any
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting to prevent abuse
    const rateLimitResult = await rateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // JWT authentication and coach authorization
    const coach = await validateJWT(request)
    if (!coach) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = bulkAttendanceSchema.parse(body)

    // Process photo if provided
    let photoBuffer: Buffer | undefined
    if (validatedData.photo) {
      const base64Data = validatedData.photo.split(",")[1]
      photoBuffer = Buffer.from(base64Data, "base64")
    }

    // Process attendance with proper error handling
    const result = await attendanceService.recordBulkAttendance(
      validatedData.sessionId,
      new Map(Object.entries(validatedData.attendance)),
      photoBuffer,
    )

    // Log successful operations for audit trail
    console.log("Attendance recorded", {
      coachId: coach.coachId,
      sessionId: validatedData.sessionId,
      playerCount: result.successCount,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      recordedCount: result.successCount,
      timestamp: result.timestamp,
      errors: result.errors || [],
    })
  } catch (error: any) {
    // Structured error handling with appropriate HTTP status codes
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "Invalid input data", details: error.message }, { status: 400 })
    }

    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }

    // Log unexpected errors for monitoring
    console.error("Attendance recording failed", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date(),
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const coach = await validateJWT(request)
    if (!coach) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In production, this would fetch from database
    // For now, return mock data
    return NextResponse.json({
      records: [],
      total: 0,
    })
  } catch (error: any) {
    console.error("Failed to fetch attendance records:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
