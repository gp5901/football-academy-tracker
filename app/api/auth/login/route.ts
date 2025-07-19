import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

// Mock database - In production, use a real database
const coaches = [
  {
    id: "1",
    username: "john_doe",
    password: "password123", // In production, hash passwords
    name: "John Doe",
    ageGroup: "U-12",
  },
  {
    id: "2",
    username: "jane_smith",
    password: "password123",
    name: "Jane Smith",
    ageGroup: "U-16",
  },
]

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const coach = coaches.find((c) => c.username === username && c.password === password)

    if (!coach) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = jwt.sign({ coachId: coach.id, username: coach.username }, JWT_SECRET, { expiresIn: "24h" })

    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    })

    return NextResponse.json({
      success: true,
      coach: {
        id: coach.id,
        name: coach.name,
        ageGroup: coach.ageGroup,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
