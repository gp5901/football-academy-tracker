export type AttendanceStatus = "present_regular" | "present_complimentary" | "absent"

export interface AttendanceRecord {
  id: string
  sessionId: string
  playerId: string
  status: AttendanceStatus
  timestamp: Date
  photoUrl?: string
  version: number
}

export interface BulkAttendanceResult {
  successCount: number
  records: AttendanceRecord[]
  timestamp: Date
  errors?: Array<{
    playerId: string
    error: string
  }>
}

export interface AttendanceStats {
  totalSessions: number
  attendedSessions: number
  complimentarySessions: number
  attendanceRate: number
  status: "good" | "warning" | "critical"
}

export interface SessionAttendance {
  sessionId: string
  date: string
  timeSlot: "morning" | "evening"
  ageGroup: string
  totalPlayers: number
  presentCount: number
  absentCount: number
  complimentaryCount: number
  photoUrl?: string
}

export interface Player {
  id: string
  name: string
  ageGroup: string
  bookedSessions: number
  attendedSessions: number
  complimentarySessions: number
  joinDate: Date
}

export interface Coach {
  id: string
  username: string
  name: string
  ageGroup: string
  createdAt: Date
}

export interface Session {
  id: string
  date: string
  timeSlot: "morning" | "evening"
  ageGroup: string
  coachId: string
  photoUrl?: string
}
