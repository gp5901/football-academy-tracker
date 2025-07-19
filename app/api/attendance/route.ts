import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { mockDb } from "@/lib/database/connection"
import { attendanceRequestSchema } from "@/lib/validation/schemas"
import { ValidationError, BusinessError } from "@/lib/errors/custom-errors"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { coachId } = authResult.payload!

    // Get coach data
    const coach = mockDb.getCoachById(coachId)
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = attendanceRequestSchema.parse(body)

    // Verify coach has access to this session
    const sessions = mockDb.getSessionsByAgeGroup(coach.ageGroup)
    const session = sessions.find((s) => s.id === validatedData.sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found or access denied" }, { status: 403 })
    }

    // Process attendance records
    const results = []
    const errors = []

    for (const [playerId, status] of Object.entries(validatedData.attendance)) {
      try {
        // Validate complimentary session limit (max 3 per month)
        if (status === "present_complimentary") {
          const existingComplimentary = mockDb
            .getAttendanceRecords()
            .filter((record) => record.playerId === playerId && record.status === "present_complimentary").length

          if (existingComplimentary >= 3) {
            errors.push({
              playerId,
              error: "Complimentary session limit exceeded (max 3 per month)",
            })
            continue
          }
        }

        // Add attendance record
        const record = mockDb.addAttendanceRecord({
          sessionId: validatedData.sessionId,
          playerId,
          status,
          timestamp: new Date(),
          photoUrl: validatedData.photo || undefined,
        })

        results.push(record)
      } catch (error) {
        errors.push({
          playerId,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      recordedCount: results.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("Attendance API error:", error)

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }

    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 })
  }
}
