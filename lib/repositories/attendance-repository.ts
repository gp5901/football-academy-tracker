import type { Pool } from "pg"
import type { AttendanceRecord, AttendanceStatus } from "../types/attendance"
import { ConcurrencyError } from "../errors/custom-errors"

export interface AttendanceRepository {
  create(data: Omit<AttendanceRecord, "id" | "version" | "createdAt" | "updatedAt">): Promise<AttendanceRecord>
  findBySessionAndPlayer(
    sessionId: string,
    playerId: string,
    options?: { forUpdate?: boolean },
  ): Promise<AttendanceRecord | null>
  updateWithVersion(id: string, data: Partial<AttendanceRecord>, expectedVersion: number): Promise<AttendanceRecord>
  getMonthlyComplimentaryCount(playerId: string, month: number, year: number): Promise<number>
  getBulkBySession(sessionId: string): Promise<AttendanceRecord[]>
}

export class PostgresAttendanceRepository implements AttendanceRepository {
  constructor(private dbPool: Pool) {}

  async create(data: Omit<AttendanceRecord, "id" | "version" | "createdAt" | "updatedAt">): Promise<AttendanceRecord> {
    const query = `
      INSERT INTO attendance (session_id, player_id, status, photo_url, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const values = [data.sessionId, data.playerId, data.status, data.photoUrl || null, data.timestamp]

    const result = await this.dbPool.query(query, values)
    return this.mapToEntity(result.rows[0])
  }

  async findBySessionAndPlayer(
    sessionId: string,
    playerId: string,
    options?: { forUpdate?: boolean },
  ): Promise<AttendanceRecord | null> {
    const lockClause = options?.forUpdate ? "FOR UPDATE" : ""
    const query = `
      SELECT * FROM attendance 
      WHERE session_id = $1 AND player_id = $2 
      ${lockClause}
    `

    const result = await this.dbPool.query(query, [sessionId, playerId])
    return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null
  }

  async updateWithVersion(
    id: string,
    data: Partial<AttendanceRecord>,
    expectedVersion: number,
  ): Promise<AttendanceRecord> {
    const query = `
      UPDATE attendance 
      SET status = COALESCE($2, status), 
          photo_url = COALESCE($3, photo_url), 
          updated_at = NOW(), 
          version = version + 1
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
    return Number.parseInt(result.rows[0].count)
  }

  async getBulkBySession(sessionId: string): Promise<AttendanceRecord[]> {
    const query = `
      SELECT * FROM attendance 
      WHERE session_id = $1 
      ORDER BY created_at DESC
    `

    const result = await this.dbPool.query(query, [sessionId])
    return result.rows.map((row) => this.mapToEntity(row))
  }

  private mapToEntity(row: any): AttendanceRecord {
    return {
      id: row.id,
      sessionId: row.session_id,
      playerId: row.player_id,
      status: row.status as AttendanceStatus,
      photoUrl: row.photo_url,
      version: row.version,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
