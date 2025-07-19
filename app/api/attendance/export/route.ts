import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { exportSchema } from "../../../../lib/validation/schemas"

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
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      format: searchParams.get("format") || "csv",
    }

    const validatedParams = exportSchema.parse(queryParams)

    // In production, this would query the database with proper joins
    const mockAttendanceData = [
      {
        playerName: "Alex Johnson",
        ageGroup: "U-12",
        bookedSessions: 12,
        attendedRegular: 8,
        attendedComplimentary: 2,
        attendanceRate: 83.3,
        status: "Good",
      },
      {
        playerName: "Sam Wilson",
        ageGroup: "U-12",
        bookedSessions: 12,
        attendedRegular: 6,
        attendedComplimentary: 1,
        attendanceRate: 58.3,
        status: "Low Attendance",
      },
    ]

    if (validatedParams.format === "csv") {
      // Generate CSV content
      const csvHeader =
        "Player Name,Age Group,Booked Sessions,Regular Attendance,Complimentary Used,Attendance Rate (%),Status\n"
      const csvRows = mockAttendanceData
        .map(
          (row) =>
            `"${row.playerName}","${row.ageGroup}",${row.bookedSessions},${row.attendedRegular},${row.attendedComplimentary},${row.attendanceRate.toFixed(1)},"${row.status}"`,
        )
        .join("\n")

      const csvContent = csvHeader + csvRows

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="attendance-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      data: mockAttendanceData,
      metadata: {
        exportDate: new Date().toISOString(),
        coachId: coach.coachId,
        totalPlayers: mockAttendanceData.length,
      },
    })
  } catch (error: any) {
    console.error("Export failed:", error)
    return NextResponse.json({ error: "Failed to export attendance data" }, { status: 500 })
  }
}
