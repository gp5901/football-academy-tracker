import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { attendanceService } from "@/lib/services/attendance-service"
import { ValidationError, BusinessError } from "@/lib/errors/custom-errors"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, attendance, photo } = body

    if (!sessionId || !attendance) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert attendance object to Map
    const attendanceMap = new Map(Object.entries(attendance))

    // Record bulk attendance
    const result = await attendanceService.recordBulkAttendance(sessionId, attendanceMap, photo)

    return NextResponse.json({
      success: true,
      recordedCount: result.successCount,
      timestamp: result.timestamp,
    })
  } catch (error) {
    console.error("Attendance recording error:", error)

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }

    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 })
  }
}
