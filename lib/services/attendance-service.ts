import { mockDb } from "../database/connection"
import { BusinessError, ValidationError } from "../errors/custom-errors"
import type { AttendanceRecord, AttendanceStatus, BulkAttendanceResult } from "../types/attendance"

export class AttendanceService {
  /**
   * Record attendance for a single player
   */
  async recordAttendance(
    sessionId: string,
    playerId: string,
    status: AttendanceStatus,
    photoUrl?: string,
  ): Promise<AttendanceRecord> {
    // Validate complimentary session limit
    if (status === "present_complimentary") {
      const complimentaryCount = this.getMonthlyComplimentaryCount(playerId)
      if (complimentaryCount >= 3) {
        throw new BusinessError("Player has exceeded monthly complimentary session limit (3)")
      }
    }

    // Check for existing record (idempotency)
    const existingRecords = mockDb.getAttendanceRecords()
    const existingRecord = existingRecords.find((r) => r.sessionId === sessionId && r.playerId === playerId)

    if (existingRecord) {
      // Update existing record
      const updated = mockDb.updateAttendanceRecord(existingRecord.id, { status, photoUrl })
      if (!updated) {
        throw new ValidationError("Failed to update attendance record")
      }
      return updated
    }

    // Create new record
    return mockDb.addAttendanceRecord({
      sessionId,
      playerId,
      status,
      timestamp: new Date(),
      photoUrl,
    })
  }

  /**
   * Record bulk attendance for multiple players
   */
  async recordBulkAttendance(
    sessionId: string,
    attendanceData: Map<string, AttendanceStatus>,
    photo?: string,
  ): Promise<BulkAttendanceResult> {
    const results: AttendanceRecord[] = []
    const errors: Array<{ playerId: string; error: string }> = []

    for (const [playerId, status] of attendanceData.entries()) {
      try {
        const record = await this.recordAttendance(sessionId, playerId, status, photo)
        results.push(record)
      } catch (error) {
        errors.push({
          playerId,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return {
      successCount: results.length,
      records: results,
      timestamp: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Get monthly complimentary session count for a player
   */
  private getMonthlyComplimentaryCount(playerId: string): number {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return mockDb.getAttendanceRecords().filter((record) => {
      const recordDate = new Date(record.timestamp)
      return (
        record.playerId === playerId &&
        record.status === "present_complimentary" &&
        recordDate.getMonth() === currentMonth &&
        recordDate.getFullYear() === currentYear
      )
    }).length
  }

  /**
   * Get attendance statistics for a player
   */
  getPlayerStats(playerId: string) {
    const records = mockDb.getAttendanceRecords().filter((r) => r.playerId === playerId)
    const player = mockDb.getPlayers().find((p) => p.id === playerId)

    if (!player) {
      throw new ValidationError("Player not found")
    }

    const regularSessions = records.filter((r) => r.status === "present_regular").length
    const complimentarySessions = records.filter((r) => r.status === "present_complimentary").length
    const totalAttended = regularSessions + complimentarySessions

    return {
      playerId,
      regularSessions,
      complimentarySessions,
      totalBooked: player.bookedSessions,
      remainingComplimentary: Math.max(0, 3 - complimentarySessions),
      attendanceRate: player.bookedSessions > 0 ? (totalAttended / player.bookedSessions) * 100 : 0,
    }
  }
}

export const attendanceService = new AttendanceService()
