import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Mock attendance storage - In production, use a real database
const attendanceRecords: any[] = []

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const { sessionId, attendance, photo } = await request.json()

    // Create attendance record
    const attendanceRecord = {
      id: Date.now().toString(),
      sessionId,
      coachId: decoded.coachId,
      attendance,
      photo,
      timestamp: new Date().toISOString(),
    }

    attendanceRecords.push(attendanceRecord)

    // In a real app, you would:
    // 1. Update player attendance counts in the database
    // 2. Store the photo in cloud storage
    // 3. Send notifications if needed

    return NextResponse.json({
      success: true,
      recordId: attendanceRecord.id,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const coachRecords = attendanceRecords.filter((r) => r.coachId === decoded.coachId)

    return NextResponse.json({
      records: coachRecords,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
