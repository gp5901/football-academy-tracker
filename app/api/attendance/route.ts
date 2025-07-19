import { type NextRequest, NextResponse } from "next/server"
import { attendanceService } from "@/lib/services/attendance-service"
import { attendanceRequestSchema } from "@/lib/validation/schemas"
import { BusinessError, ValidationError } from "@/lib/errors/custom-errors"
import { verifyJWT } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const coach = authResult.payload

    // Parse and validate request body
    const body = await request.json()
    const validatedData = attendanceRequestSchema.parse(body)

    // Convert attendance object to Map for service
    const attendanceMap = new Map(Object.entries(validatedData.attendance))

    // Process photo if provided
    let photoBuffer: Buffer | undefined
    if (validatedData.photo) {
      const base64Data = validatedData.photo.split(",")[1]
      photoBuffer = Buffer.from(base64Data, "base64")
    }

    // Record bulk attendance
    const result = await attendanceService.recordBulkAttendance(validatedData.sessionId, attendanceMap, photoBuffer)

    return NextResponse.json({
      success: true,
      recordedCount: result.successCount,
      timestamp: result.timestamp,
      errors: result.errors,
    })
  } catch (error) {
    console.error("Attendance recording error:", error)

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "Invalid input data", details: error.message }, { status: 400 })
    }

    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
