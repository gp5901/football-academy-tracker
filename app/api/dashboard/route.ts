import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Mock data - In production, use a real database
const coaches = [
  { id: "1", username: "john_doe", name: "John Doe", ageGroup: "U-12" },
  { id: "2", username: "jane_smith", name: "Jane Smith", ageGroup: "U-16" },
]

const sessions = [
  { id: "1", date: new Date().toISOString(), timeSlot: "morning", ageGroup: "U-12" },
  { id: "2", date: new Date().toISOString(), timeSlot: "evening", ageGroup: "U-12" },
  { id: "3", date: new Date().toISOString(), timeSlot: "morning", ageGroup: "U-16" },
  { id: "4", date: new Date().toISOString(), timeSlot: "evening", ageGroup: "U-16" },
]

const players = [
  // U-12 Players
  {
    id: "1",
    name: "Alex Johnson",
    ageGroup: "U-12",
    bookedSessions: 12,
    attendedSessions: 8,
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
  { id: "3", name: "Liam Brown", ageGroup: "U-12", bookedSessions: 12, attendedSessions: 6, complimentarySessions: 2 },
  {
    id: "4",
    name: "Sophia Davis",
    ageGroup: "U-12",
    bookedSessions: 12,
    attendedSessions: 10,
    complimentarySessions: 0,
  },
  { id: "5", name: "Noah Miller", ageGroup: "U-12", bookedSessions: 12, attendedSessions: 9, complimentarySessions: 1 },

  // U-16 Players
  {
    id: "6",
    name: "Olivia Garcia",
    ageGroup: "U-16",
    bookedSessions: 15,
    attendedSessions: 13,
    complimentarySessions: 0,
  },
  {
    id: "7",
    name: "Ethan Rodriguez",
    ageGroup: "U-16",
    bookedSessions: 15,
    attendedSessions: 12,
    complimentarySessions: 1,
  },
  {
    id: "8",
    name: "Ava Martinez",
    ageGroup: "U-16",
    bookedSessions: 15,
    attendedSessions: 14,
    complimentarySessions: 0,
  },
  {
    id: "9",
    name: "Mason Anderson",
    ageGroup: "U-16",
    bookedSessions: 15,
    attendedSessions: 10,
    complimentarySessions: 2,
  },
  {
    id: "10",
    name: "Isabella Taylor",
    ageGroup: "U-16",
    bookedSessions: 15,
    attendedSessions: 15,
    complimentarySessions: 0,
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
    const coach = coaches.find((c) => c.id === decoded.coachId)

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 })
    }

    // Filter sessions and players by coach's age group
    const coachSessions = sessions.filter((s) => s.ageGroup === coach.ageGroup)
    const coachPlayers = players.filter((p) => p.ageGroup === coach.ageGroup)

    return NextResponse.json({
      coach,
      sessions: coachSessions,
      players: coachPlayers,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
