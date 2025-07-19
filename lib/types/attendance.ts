export type AttendanceStatus = "present_regular" | "present_complimentary" | "absent"

export interface AttendanceRecord {
  id: string
  sessionId: string
  playerId: string
  status: AttendanceStatus
  photoUrl?: string
  version: number
  timestamp: Date
  createdAt: Date
  updatedAt: Date
}

export interface Player {
  id: string
  name: string
  ageGroupId: string
  monthlySessionsBooked: number
  joinDate: Date
  isActive: boolean
}

export interface Session {
  id: string
  date: Date
  timeSlot: "morning" | "evening"
  ageGroupId: string
  coachId: string
  photoUrl?: string
  isActive: boolean
}

export interface Coach {
  id: string
  username: string
  name: string
  email: string
  ageGroupId: string
  isActive: boolean
}
