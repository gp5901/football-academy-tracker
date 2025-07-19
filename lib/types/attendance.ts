export type AttendanceStatus = "present_regular" | "present_complimentary" | "absent"

export interface AttendanceRecord {
  id: string
  sessionId: string
  playerId: string
  status: AttendanceStatus
  timestamp: Date
  photoUrl?: string | null
  version: number
}

export interface BulkAttendanceResult {
  successCount: number
  records: AttendanceRecord[]
  errors?: string[]
  timestamp: Date
}

export interface PlayerStats {
  playerId: string
  regularSessions: number
  complimentarySessions: number
  totalBooked: number
  remainingComplimentary: number
  attendanceRate: number
}

export interface SessionStats {
  totalPlayers: number
  presentCount: number
  absentCount: number
  complimentaryCount: number
  attendanceRate: number
}
