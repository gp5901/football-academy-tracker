export interface Coach {
  id: string
  username: string
  name: string
  ageGroup: string
  createdAt: Date
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

export interface Session {
  id: string
  date: Date
  timeSlot: "morning" | "evening"
  ageGroup: string
  coachId: string
  photoUrl?: string
}

export interface AttendanceRecord {
  id: string
  sessionId: string
  playerId: string
  status: "present_regular" | "present_complimentary" | "absent"
  timestamp: Date
  photoUrl?: string
  version: number
}

export interface BulkAttendanceResult {
  successCount: number
  records: AttendanceRecord[]
  timestamp: Date
}

export type AttendanceStatus = "present_regular" | "present_complimentary" | "absent"
