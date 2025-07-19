// Mock database implementation for development
// In production, replace with actual PostgreSQL connection

interface MockDatabase {
  coaches: any[]
  players: any[]
  sessions: any[]
  attendance: any[]
}

class MockDatabaseConnection {
  private data: MockDatabase = {
    coaches: [
      {
        id: "coach-1",
        username: "john_doe",
        passwordHash: "$2b$10$rQJ5qZ5qZ5qZ5qZ5qZ5qZO", // password123
        name: "John Doe",
        ageGroup: "U-12",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "coach-2",
        username: "jane_smith",
        passwordHash: "$2b$10$rQJ5qZ5qZ5qZ5qZ5qZ5qZO", // password123
        name: "Jane Smith",
        ageGroup: "U-16",
        createdAt: new Date("2024-01-01"),
      },
    ],
    players: [
      // U-12 Players
      {
        id: "player-1",
        name: "Alex Johnson",
        ageGroup: "U-12",
        bookedSessions: 12,
        attendedSessions: 10,
        complimentarySessions: 1,
        joinDate: new Date("2024-01-15"),
      },
      {
        id: "player-2",
        name: "Sam Wilson",
        ageGroup: "U-12",
        bookedSessions: 12,
        attendedSessions: 8,
        complimentarySessions: 2,
        joinDate: new Date("2024-01-20"),
      },
      {
        id: "player-3",
        name: "Emma Davis",
        ageGroup: "U-12",
        bookedSessions: 12,
        attendedSessions: 11,
        complimentarySessions: 0,
        joinDate: new Date("2024-01-10"),
      },
      {
        id: "player-4",
        name: "Liam Brown",
        ageGroup: "U-12",
        bookedSessions: 12,
        attendedSessions: 6,
        complimentarySessions: 3,
        joinDate: new Date("2024-02-01"),
      },
      {
        id: "player-5",
        name: "Olivia Taylor",
        ageGroup: "U-12",
        bookedSessions: 12,
        attendedSessions: 9,
        complimentarySessions: 1,
        joinDate: new Date("2024-01-25"),
      },

      // U-16 Players
      {
        id: "player-6",
        name: "Noah Miller",
        ageGroup: "U-16",
        bookedSessions: 12,
        attendedSessions: 11,
        complimentarySessions: 0,
        joinDate: new Date("2024-01-12"),
      },
      {
        id: "player-7",
        name: "Ava Garcia",
        ageGroup: "U-16",
        bookedSessions: 12,
        attendedSessions: 7,
        complimentarySessions: 2,
        joinDate: new Date("2024-01-18"),
      },
      {
        id: "player-8",
        name: "Ethan Martinez",
        ageGroup: "U-16",
        bookedSessions: 12,
        attendedSessions: 10,
        complimentarySessions: 1,
        joinDate: new Date("2024-01-22"),
      },
      {
        id: "player-9",
        name: "Sophia Anderson",
        ageGroup: "U-16",
        bookedSessions: 12,
        attendedSessions: 5,
        complimentarySessions: 3,
        joinDate: new Date("2024-02-05"),
      },
      {
        id: "player-10",
        name: "Mason Thomas",
        ageGroup: "U-16",
        bookedSessions: 12,
        attendedSessions: 9,
        complimentarySessions: 1,
        joinDate: new Date("2024-01-30"),
      },
    ],
    sessions: [
      {
        id: "session-1",
        date: new Date().toISOString().split("T")[0],
        timeSlot: "morning",
        ageGroup: "U-12",
        coachId: "coach-1",
      },
      {
        id: "session-2",
        date: new Date().toISOString().split("T")[0],
        timeSlot: "evening",
        ageGroup: "U-12",
        coachId: "coach-1",
      },
      {
        id: "session-3",
        date: new Date().toISOString().split("T")[0],
        timeSlot: "morning",
        ageGroup: "U-16",
        coachId: "coach-2",
      },
      {
        id: "session-4",
        date: new Date().toISOString().split("T")[0],
        timeSlot: "evening",
        ageGroup: "U-16",
        coachId: "coach-2",
      },
    ],
    attendance: [],
  }

  async query(sql: string, params: any[] = []): Promise<{ rows: any[] }> {
    // Simulate database query delay
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Mock query implementation
    if (sql.includes("SELECT * FROM coaches WHERE username")) {
      const username = params[0]
      const coach = this.data.coaches.find((c) => c.username === username)
      return { rows: coach ? [coach] : [] }
    }

    if (sql.includes("SELECT * FROM coaches WHERE id")) {
      const id = params[0]
      const coach = this.data.coaches.find((c) => c.id === id)
      return { rows: coach ? [coach] : [] }
    }

    return { rows: [] }
  }

  async connect() {
    return {
      query: this.query.bind(this),
      release: () => {},
    }
  }

  // Mock data access methods
  getCoaches() {
    return this.data.coaches
  }

  getPlayers() {
    return this.data.players
  }

  getSessions() {
    return this.data.sessions
  }

  getAttendance() {
    return this.data.attendance
  }

  addAttendance(record: any) {
    this.data.attendance.push({
      ...record,
      id: `attendance-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      version: 1,
    })
  }

  updateAttendance(id: string, data: any) {
    const index = this.data.attendance.findIndex((a) => a.id === id)
    if (index !== -1) {
      this.data.attendance[index] = {
        ...this.data.attendance[index],
        ...data,
        version: this.data.attendance[index].version + 1,
      }
    }
  }
}

export const mockDb = new MockDatabaseConnection()

// Connection pool simulation
export class ConnectionPool {
  private connections: MockDatabaseConnection[] = []
  private maxConnections = 10

  constructor() {
    // Initialize pool with mock connections
    for (let i = 0; i < this.maxConnections; i++) {
      this.connections.push(new MockDatabaseConnection())
    }
  }

  async connect() {
    // Simulate connection acquisition
    await new Promise((resolve) => setTimeout(resolve, 5))
    return this.connections[0] // Return first available connection
  }

  async query(sql: string, params: any[] = []) {
    const connection = await this.connect()
    return connection.query(sql, params)
  }
}

export const dbPool = new ConnectionPool()
