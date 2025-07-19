import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { mockDb } from "@/lib/database/connection"
import { csvExportService } from "@/lib/services/csv-export-service"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const coach = authResult.payload

    // Get coach data
    const coachData = mockDb.getCoachById(coach.coachId)

    if (!coachData) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 })
    }

    // Get players for coach's age group
    const players = mockDb.getPlayersByAgeGroup(coachData.ageGroup)

    // Get sessions for coach's age group
    const sessions = mockDb.getSessionsByAgeGroup(coachData.ageGroup)

    // Generate CSV content
    const csvContent = csvExportService.generateAttendanceCSV({
      coach: coachData,
      players,
      sessions,
      reportDate: new Date(),
    })

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-report-${coachData.ageGroup}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export attendance data" }, { status: 500 })
  }
}
