import { BusinessError, ConcurrencyError } from "../errors/custom-errors"
import type { AttendanceRecord, BulkAttendanceResult } from "../types/attendance"

interface MockPool {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>
  connect: () => Promise<{
    query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>
    release: () => void
  }>
}

export class PostgresAttendanceRepository {
  constructor(private dbPool: MockPool) {}

  async findBySessionAndPlayer(
    sessionId: string,
    playerId: string,
    options?: { forUpdate?: boolean },
  ): Promise<AttendanceRecord | null> {
    const query = `
      SELECT * FROM attendance 
      WHERE session_id = $1 AND player_id = $2
      ${options?.forUpdate ? "FOR UPDATE" : ""}
    `

    const result = await this.dbPool.query(query, [sessionId, playerId])
    return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null
  }

  async create(data: Omit<AttendanceRecord, "id" | "version">): Promise<AttendanceRecord> {
    // Validate complimentary session limit before creating
    if (data.status === "present_complimentary") {
      const complimentaryCount = await this.getMonthlyComplimentaryCount(
        data.playerId,
        new Date().getMonth() + 1,
        new Date().getFullYear(),
      )

      if (complimentaryCount >= 3) {
        throw new BusinessError("Player has exceeded monthly complimentary session limit (3)")
      }
    }

    const query = `
      INSERT INTO attendance (session_id, player_id, status, timestamp)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const result = await this.dbPool.query(query, [data.sessionId, data.playerId, data.status, data.timestamp])

    return this.mapToEntity(result.rows[0])
  }

  async updateWithVersion(
    id: string,
    data: Partial<AttendanceRecord>,
    expectedVersion: number,
  ): Promise<AttendanceRecord> {
    const query = `
      UPDATE attendance 
      SET status = $2, photo_url = $3, updated_at = NOW(), version = version + 1
      WHERE id = $1 AND version = $4
      RETURNING *
    `

    const result = await this.dbPool.query(query, [id, data.status, data.photoUrl, expectedVersion])

    if (result.rows.length === 0) {
      throw new ConcurrencyError("Record was modified by another user")
    }

    return this.mapToEntity(result.rows[0])
  }

  async getMonthlyComplimentaryCount(playerId: string, month: number, year: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      WHERE a.player_id = $1 
        AND a.status = 'present_complimentary'
        AND EXTRACT(MONTH FROM s.date) = $2
        AND EXTRACT(YEAR FROM s.date) = $3
    `

    const result = await this.dbPool.query(query, [playerId, month, year])
    return Number.parseInt(result.rows[0]?.count || "0")
  }

  async bulkCreate(records: Omit<AttendanceRecord, "id" | "version">[]): Promise<BulkAttendanceResult> {
    const successfulRecords: AttendanceRecord[] = []
    const errors: string[] = []

    // Process in batches to prevent memory issues
    const batchSize = 50
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)

      for (const record of batch) {
        try {
          const created = await this.create(record)
          successfulRecords.push(created)
        } catch (error: any) {
          errors.push(`Player ${record.playerId}: ${error.message}`)
        }
      }
    }

    return {
      successCount: successfulRecords.length,
      records: successfulRecords,
      errors,
      timestamp: new Date(),
    }
  }

  private mapToEntity(row: any): AttendanceRecord {
    return {
      id: row.id,
      sessionId: row.session_id,
      playerId: row.player_id,
      status: row.status,
      timestamp: new Date(row.timestamp),
      photoUrl: row.photo_url,
      version: row.version || 1,
    }
  }
}
