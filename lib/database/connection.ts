import type { Coach, Player, Session, AttendanceRecord } from "../types/attendance"

// Mock database with realistic data
class MockDatabase {
  private coaches: Coach[] = [
    {
      id: "1",
      username: "john_doe",
      name: "John Doe",
      ageGroup: "U-12",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      username: "jane_smith",
      name: "Jane Smith",
      ageGroup: "U-16",
      createdAt: new Date("2024-01-20"),
    },
  ]

  private players: Player[] = [
    // U-12 Players
    {
      id: "1",
      name: "Alex Johnson",
      ageGroup: "U-12",
      bookedSessions: 12,
      attendedSessions: 10,
      complimentarySessions: 1,
      joinDate: new Date("2024-02-01"),
    },
    {
      id: "2",
      name: "Emma Wilson",
      ageGroup: "U-12",
      bookedSessions: 12,
      attendedSessions: 11,
      complimentarySessions: 0,
      joinDate: new Date("2024-02-05"),
    },
    {
      id: "3",
      name: "Liam Brown",
      ageGroup: "U-12",
      bookedSessions: 12,
      attendedSessions: 8,
      complimentarySessions: 2,
      joinDate: new Date("2024-02-10"),
    },
    {
      id: "4",
      name: "Sophia Davis",
      ageGroup: "U-12",
      bookedSessions: 12,
      attendedSessions: 9,
      complimentarySessions: 1,
      joinDate: new Date("2024-02-15"),
    },
    {
      id: "5",
      name: "Noah Miller",
      ageGroup: "U-12",
      bookedSessions: 12,
      attendedSessions: 12,
      complimentarySessions: 0,
      joinDate: new Date("2024-02-20"),
    },
    // U-16 Players
    {
      id: "6",
      name: "Olivia Garcia",
      ageGroup: "U-16",
      bookedSessions: 12,
      attendedSessions: 10,
      complimentarySessions: 1,
      joinDate: new Date("2024-01-25"),
    },
    {
      id: "7",
      name: "William Rodriguez",
      ageGroup: "U-16",
      bookedSessions: 12,
      attendedSessions: 11,
      complimentarySessions: 0,
      joinDate: new Date("2024-01-30"),
    },
    {
      id: "8",
      name: "Ava Martinez",
      ageGroup: "U-16",
      bookedSessions: 12,
      attendedSessions: 7,
      complimentarySessions: 3,
      joinDate: new Date("2024-02-03"),
    },
    {
      id: "9",
      name: "James Anderson",
      ageGroup: "U-16",
      bookedSessions: 12,
      attendedSessions: 9,
      complimentarySessions: 1,
      joinDate: new Date("2024-02-08"),
    },
    {
      id: "10",
      name: "Isabella Taylor",
      ageGroup: "U-16",
      bookedSessions: 12,
      attendedSessions: 12,
      complimentarySessions: 0,
      joinDate: new Date("2024-02-12"),
    },
  ]

  private sessions: Session[] = [
    {
      id: "1",
      date: new Date(),
      timeSlot: "morning",
      ageGroup: "U-12",
      coachId: "1",
    },
    {
      id: "2",
      date: new Date(),
      timeSlot: "evening",
      ageGroup: "U-12",
      coachId: "1",
    },
    {
      id: "3",
      date: new Date(),
      timeSlot: "morning",
      ageGroup: "U-16",
      coachId: "2",
    },
    {
      id: "4",
      date: new Date(),
      timeSlot: "evening",
      ageGroup: "U-16",
      coachId: "2",
    },
  ]

  private attendanceRecords: AttendanceRecord[] = []

  getCoaches(): Coach[] {
    return [...this.coaches]
  }

  getCoachById(id: string): Coach | undefined {
    return this.coaches.find((coach) => coach.id === id)
  }

  getCoachByUsername(username: string): Coach | undefined {
    return this.coaches.find((coach) => coach.username === username)
  }

  getPlayers(): Player[] {
    return [...this.players]
  }

  getPlayersByAgeGroup(ageGroup: string): Player[] {
    return this.players.filter((player) => player.ageGroup === ageGroup)
  }

  getSessions(): Session[] {
    return [...this.sessions]
  }

  getSessionsByAgeGroup(ageGroup: string): Session[] {
    return this.sessions.filter((session) => session.ageGroup === ageGroup)
  }

  getTodaysSessions(ageGroup: string): Session[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.sessions.filter((session) => {
      const sessionDate = new Date(session.date)
      sessionDate.setHours(0, 0, 0, 0)
      return session.ageGroup === ageGroup && sessionDate >= today && sessionDate < tomorrow
    })
  }

  getAttendanceRecords(): AttendanceRecord[] {
    return [...this.attendanceRecords]
  }

  addAttendanceRecord(record: Omit<AttendanceRecord, "id" | "version">): AttendanceRecord {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: 1,
    }
    this.attendanceRecords.push(newRecord)
    return newRecord
  }

  updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): AttendanceRecord | null {
    const index = this.attendanceRecords.findIndex((record) => record.id === id)
    if (index === -1) return null

    this.attendanceRecords[index] = {
      ...this.attendanceRecords[index],
      ...updates,
      version: this.attendanceRecords[index].version + 1,
    }
    return this.attendanceRecords[index]
  }
}

export const mockDb = new MockDatabase()
