import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { exportRequestSchema } from "../../../../lib/validation/schemas"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

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

export async function GET(request: NextRequest) {
  try {
    const coach = await validateJWT(request)
    if (!coach) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      format: searchParams.get("format") || "csv",
    }

    const validatedParams = exportRequestSchema.parse(queryParams)

    // Mock attendance data for export
    const mockAttendanceData = [
      {
        playerName: "Alex Johnson",
        ageGroup: "U-12",
        bookedSessions: 12,
        attendedSessions: 10,
        complimentarySessions: 2,
        attendanceRate: 83.3,
        status: "Good",
      },
      {
        playerName: "Sam Wilson",
        ageGroup: "U-12",
        bookedSessions: 12,
        attendedSessions: 8,
        complimentarySessions: 1,
        attendanceRate: 66.7,
        status: "Needs Improvement",
      },
      {
        playerName: "Jordan Brown",
        ageGroup: "U-16",
        bookedSessions: 12,
        attendedSessions: 11,
        complimentarySessions: 0,
        attendanceRate: 91.7,
        status: "Excellent",
      },
    ]

    if (validatedParams.format === "csv") {
      // Generate CSV
      const headers = [
        "Player Name",
        "Age Group",
        "Booked Sessions",
        "Attended Sessions",
        "Complimentary Sessions",
        "Attendance Rate (%)",
        "Status",
      ]

      const csvRows = [
        headers.join(","),
        ...mockAttendanceData.map((row) =>
          [
            `"${row.playerName}"`,
            `"${row.ageGroup}"`,
            row.bookedSessions,
            row.attendedSessions,
            row.complimentarySessions,
            row.attendanceRate,
            `"${row.status}"`,
          ].join(","),
        ),
      ]

      const csvContent = csvRows.join("\n")
      const fileName = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      })
    }

    // Return JSON format
    return NextResponse.json({
      data: mockAttendanceData,
      metadata: {
        exportDate: new Date().toISOString(),
        coachId: coach.coachId,
        totalPlayers: mockAttendanceData.length,
        averageAttendanceRate:
          mockAttendanceData.reduce((sum, player) => sum + player.attendanceRate, 0) / mockAttendanceData.length,
      },
    })
  } catch (error: any) {
    console.error("Export failed:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
