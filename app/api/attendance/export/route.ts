import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Mock data - In production, this would come from your database
const mockPlayers = [
  {
    id: "1",
    name: "Alex Johnson",
    ageGroup: "U-12",
    bookedSessions: 12,
    attendedSessions: 10,
    complimentarySessions: 1,
  },
  {
    id: "2",
    name: "Emma Wilson",
    ageGroup: "U-12",
    bookedSessions: 12,
    attendedSessions: 11,
    complimentarySessions: 0,
  },
  {
    id: "3",
    name: "Liam Brown",
    ageGroup: "U-12",
    bookedSessions: 12,
    attendedSessions: 8,
    complimentarySessions: 2,
  },
  {
    id: "4",
    name: "Sophia Davis",
    ageGroup: "U-12",
    bookedSessions: 12,
    attendedSessions: 9,
    complimentarySessions: 1,
  },
  {
    id: "5",
    name: "Noah Miller",
    ageGroup: "U-12",
    bookedSessions: 12,
    attendedSessions: 12,
    complimentarySessions: 0,
  },
  {
    id: "6",
    name: "Olivia Garcia",
    ageGroup: "U-16",
    bookedSessions: 12,
    attendedSessions: 10,
    complimentarySessions: 1,
  },
  {
    id: "7",
    name: "William Rodriguez",
    ageGroup: "U-16",
    bookedSessions: 12,
    attendedSessions: 11,
    complimentarySessions: 0,
  },
  {
    id: "8",
    name: "Ava Martinez",
    ageGroup: "U-16",
    bookedSessions: 12,
    attendedSessions: 7,
    complimentarySessions: 3,
  },
  {
    id: "9",
    name: "James Anderson",
    ageGroup: "U-16",
    bookedSessions: 12,
    attendedSessions: 9,
    complimentarySessions: 1,
  },
  {
    id: "10",
    name: "Isabella Taylor",
    ageGroup: "U-16",
    bookedSessions: 12,
    attendedSessions: 12,
    complimentarySessions: 0,
  },
]

const mockCoaches = [
  { id: "1", username: "john_doe", ageGroup: "U-12" },
  { id: "2", username: "jane_smith", ageGroup: "U-16" },
]

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const coach = mockCoaches.find((c) => c.id === decoded.coachId)

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 })
    }

    // Filter players by coach's age group
    const coachPlayers = mockPlayers.filter((player) => player.ageGroup === coach.ageGroup)

    // Generate CSV content
    const headers = [
      "Player Name",
      "Age Group",
      "Booked Sessions",
      "Attended Sessions",
      "Attendance Rate (%)",
      "Complimentary Sessions Used",
      "Remaining Sessions",
      "Status",
    ]

    const csvRows = coachPlayers.map((player) => {
      const attendanceRate =
        player.bookedSessions > 0 ? Math.round((player.attendedSessions / player.bookedSessions) * 100) : 0
      const remainingSessions = player.bookedSessions - player.attendedSessions
      const status = attendanceRate >= 90 ? "Excellent" : attendanceRate >= 70 ? "Good" : "Needs Attention"

      return [
        player.name,
        player.ageGroup,
        player.bookedSessions.toString(),
        player.attendedSessions.toString(),
        attendanceRate.toString(),
        player.complimentarySessions.toString(),
        remainingSessions.toString(),
        status,
      ]
    })

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
      "",
      `Report generated on: ${new Date().toLocaleDateString()}`,
      `Coach: ${coach.username}`,
      `Age Group: ${coach.ageGroup}`,
      `Total Players: ${coachPlayers.length}`,
    ].join("\n")

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-report-${coach.ageGroup}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
