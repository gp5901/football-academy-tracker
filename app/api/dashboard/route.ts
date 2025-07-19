import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { mockDb } from "@/lib/database/connection"

export async function GET(request: NextRequest) {
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

    // Get today's sessions for this coach's age group
    const todaySessions = mockDb.getTodaysSessions(coach.ageGroup).map((session) => ({
      id: session.id,
      date: session.date.toISOString().split("T")[0],
      timeSlot: session.timeSlot,
      ageGroup: session.ageGroup,
    }))

    // Get players for this coach's age group
    const players = mockDb.getPlayersByAgeGroup(coach.ageGroup)

    // Calculate stats
    const totalPlayers = players.length
    const averageAttendance =
      totalPlayers > 0
        ? Math.round(
            players.reduce((acc, player) => {
              const rate = player.bookedSessions > 0 ? (player.attendedSessions / player.bookedSessions) * 100 : 0
              return acc + rate
            }, 0) / totalPlayers,
          )
        : 0

    const lowAttendancePlayers = players.filter((player) => {
      const rate = player.bookedSessions > 0 ? (player.attendedSessions / player.bookedSessions) * 100 : 0
      return rate < 70
    }).length

    return NextResponse.json({
      coach: {
        id: coach.id,
        username: coach.username,
        name: coach.name,
        ageGroup: coach.ageGroup,
        createdAt: coach.createdAt,
      },
      todaySessions,
      players,
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
