// Mock database connection for development
// In production, this would use a real PostgreSQL connection pool

interface MockDbConnection {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>
  release: () => void
}

interface MockPool {
  connect: () => Promise<MockDbConnection>
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>
  end: () => Promise<void>
  on: (event: string, callback: (err: Error) => void) => void
}

// Mock data storage
const mockData = {
  coaches: [
    {
      id: "550e8400-e29b-41d4-a716-446655440011",
      username: "john_doe",
      password_hash: "$2b$10$hash1",
      name: "John Doe",
      age_group_id: "550e8400-e29b-41d4-a716-446655440001",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440012",
      username: "jane_smith",
      password_hash: "$2b$10$hash2",
      name: "Jane Smith",
      age_group_id: "550e8400-e29b-41d4-a716-446655440002",
    },
  ],
  players: [
    {
      id: "1",
      name: "Alex Johnson",
      age_group_id: "550e8400-e29b-41d4-a716-446655440001",
      monthly_sessions_booked: 12,
    },
    { id: "2", name: "Sam Wilson", age_group_id: "550e8400-e29b-41d4-a716-446655440001", monthly_sessions_booked: 12 },
    {
      id: "3",
      name: "Jordan Brown",
      age_group_id: "550e8400-e29b-41d4-a716-446655440002",
      monthly_sessions_booked: 12,
    },
    { id: "4", name: "Casey Davis", age_group_id: "550e8400-e29b-41d4-a716-446655440002", monthly_sessions_booked: 12 },
  ],
  sessions: [
    {
      id: "session-1",
      date: new Date().toISOString().split("T")[0],
      time_slot: "morning",
      age_group_id: "550e8400-e29b-41d4-a716-446655440001",
      coach_id: "550e8400-e29b-41d4-a716-446655440011",
    },
    {
      id: "session-2",
      date: new Date().toISOString().split("T")[0],
      time_slot: "evening",
      age_group_id: "550e8400-e29b-41d4-a716-446655440002",
      coach_id: "550e8400-e29b-41d4-a716-446655440012",
    },
  ],
  attendance: [] as any[],
}

class MockDbPool implements MockPool {
  async connect(): Promise<MockDbConnection> {
    return {
      query: this.query.bind(this),
      release: () => {},
    }
  }

  async query(sql: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    // Simple mock query implementation
    if (sql.includes("SELECT") && sql.includes("coaches")) {
      const rows = mockData.coaches.filter((coach) => {
        if (params.length > 0) {
          return coach.username === params[0] || coach.id === params[0]
        }
        return true
      })
      return { rows, rowCount: rows.length }
    }

    if (sql.includes("SELECT") && sql.includes("players")) {
      const rows = mockData.players.filter((player) => {
        if (params.length > 0) {
          return player.age_group_id === params[0]
        }
        return true
      })
      return { rows, rowCount: rows.length }
    }

    if (sql.includes("SELECT") && sql.includes("sessions")) {
      const rows = mockData.sessions.filter((session) => {
        if (params.length > 0) {
          return session.age_group_id === params[0] || session.coach_id === params[0]
        }
        return true
      })
      return { rows, rowCount: rows.length }
    }

    if (sql.includes("INSERT") && sql.includes("attendance")) {
      const newRecord = {
        id: Date.now().toString(),
        session_id: params[0],
        player_id: params[1],
        status: params[2],
        timestamp: new Date().toISOString(),
        version: 1,
      }
      mockData.attendance.push(newRecord)
      return { rows: [newRecord], rowCount: 1 }
    }

    if (sql.includes("SELECT") && sql.includes("attendance")) {
      return { rows: mockData.attendance, rowCount: mockData.attendance.length }
    }

    return { rows: [], rowCount: 0 }
  }

  async end(): Promise<void> {
    // Mock cleanup
  }

  on(event: string, callback: (err: Error) => void): void {
    // Mock event handling
  }
}

// Singleton connection pool
let pool: MockPool | null = null

export function getDbPool(): MockPool {
  if (!pool) {
    pool = new MockDbPool()
  }
  return pool
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
