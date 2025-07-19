import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Mock data - In production, this would come from your database
const mockCoaches = [
  { id: "1", username: "john_doe", ageGroup: "U-12" },
  { id: "2", username: "jane_smith", ageGroup: "U-16" },
]

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

const mockSessions = [
  {
    id: "1",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "morning" as const,
    ageGroup: "U-12",
  },
  {
    id: "2",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "evening" as const,
    ageGroup: "U-12",
  },
  {
    id: "3",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "morning" as const,
    ageGroup: "U-16",
  },
  {
    id: "4",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "evening" as const,
    ageGroup: "U-16",
  },
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

    // Filter data by coach's age group
    const coachPlayers = mockPlayers.filter((player) => player.ageGroup === coach.ageGroup)
    const todaySessions = mockSessions.filter((session) => session.ageGroup === coach.ageGroup)

    // Calculate stats
    const totalPlayers = coachPlayers.length
    const averageAttendance =
      totalPlayers > 0
        ? Math.round(
            coachPlayers.reduce((acc, player) => {
              const rate = player.bookedSessions > 0 ? (player.attendedSessions / player.bookedSessions) * 100 : 0
              return acc + rate
            }, 0) / totalPlayers,
          )
        : 0
    const lowAttendancePlayers = coachPlayers.filter((player) => {
      const rate = player.bookedSessions > 0 ? (player.attendedSessions / player.bookedSessions) * 100 : 0
      return rate < 70
    }).length

    return NextResponse.json({
      coach: {
        id: coach.id,
        username: coach.username,
        ageGroup: coach.ageGroup,
      },
      todaySessions,
      players: coachPlayers,
      stats: {
        totalPlayers,
        averageAttendance,
        lowAttendancePlayers,
      },
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
