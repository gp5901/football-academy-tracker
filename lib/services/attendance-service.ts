import { mockDb } from "../database/connection"
import { BusinessError, ValidationError } from "../errors/custom-errors"
import { attendanceInputSchema, bulkAttendanceSchema } from "../validation/schemas"
import type { AttendanceRecord, BulkAttendanceResult, AttendanceStatus } from "../types/attendance"

export class AttendanceService {
  constructor() {}

  /**
   * Records attendance with business rule validation
   */
  async recordAttendanceAtomic(
    sessionId: string,
    playerId: string,
    status: AttendanceStatus,
    photoBuffer?: Buffer,
  ): Promise<AttendanceRecord> {
    // Input validation
    const validatedInput = attendanceInputSchema.parse({
      sessionId,
      playerId,
      status,
    })

    try {
      // Check complimentary session limit
      if (status === "present_complimentary") {
        const complimentaryCount = await this.getMonthlyComplimentaryCount(playerId)
        if (complimentaryCount >= 3) {
          throw new BusinessError("Player has exceeded monthly complimentary session limit (3)")
        }
      }

      // Check for existing record (idempotency)
      const existingRecord = this.findExistingAttendance(sessionId, playerId)

      if (existingRecord) {
        // Update existing record
        mockDb.updateAttendance(existingRecord.id, { status })
        return {
          ...existingRecord,
          status,
          version: existingRecord.version + 1,
        }
      } else {
        // Create new record
        const newRecord = {
          sessionId: validatedInput.sessionId,
          playerId: validatedInput.playerId,
          status: validatedInput.status,
          photoUrl: photoBuffer ? "mock-photo-url" : undefined,
        }

        mockDb.addAttendance(newRecord)

        return {
          id: `attendance-${Date.now()}`,
          ...newRecord,
          timestamp: new Date(),
          version: 1,
        }
      }
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error
      }
      throw new Error(`Failed to record attendance: ${error.message}`)
    }
  }

  /**
   * Bulk attendance recording for performance optimization
   */
  async recordBulkAttendance(
    sessionId: string,
    attendanceData: Map<string, AttendanceStatus>,
    photo?: Buffer,
  ): Promise<BulkAttendanceResult> {
    const validatedData = bulkAttendanceSchema.parse({
      sessionId,
      attendanceData: Array.from(attendanceData.entries()),
    })

    const results: AttendanceRecord[] = []
    const errors: Array<{ playerId: string; error: string }> = []

    // Process in batches to prevent memory issues
    const batchSize = 50
    const entries = Array.from(attendanceData.entries())

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize)

      for (const [playerId, status] of batch) {
        try {
          const result = await this.recordAttendanceAtomic(sessionId, playerId, status, photo)
          results.push(result)
        } catch (error) {
          errors.push({
            playerId,
            error: error.message,
          })
        }
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
  private async getMonthlyComplimentaryCount(playerId: string): Promise<number> {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const attendance = mockDb.getAttendance()
    const sessions = mockDb.getSessions()

    return attendance.filter((a) => {
      if (a.playerId !== playerId || a.status !== "present_complimentary") {
        return false
      }

      const session = sessions.find((s) => s.id === a.sessionId)
      if (!session) return false

      const sessionDate = new Date(session.date)
      return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear
    }).length
  }

  /**
   * Find existing attendance record
   */
  private findExistingAttendance(sessionId: string, playerId: string) {
    const attendance = mockDb.getAttendance()
    return attendance.find((a) => a.sessionId === sessionId && a.playerId === playerId)
  }

  /**
   * Get player attendance statistics
   */
  async getPlayerStats(playerId: string) {
    const attendance = mockDb.getAttendance().filter((a) => a.playerId === playerId)
    const player = mockDb.getPlayers().find((p) => p.id === playerId)

    if (!player) {
      throw new ValidationError("Player not found")
    }

    const totalAttended = attendance.filter((a) => a.status !== "absent").length
    const complimentaryUsed = attendance.filter((a) => a.status === "present_complimentary").length

    return {
      totalSessions: player.bookedSessions,
      attendedSessions: totalAttended,
      complimentarySessions: complimentaryUsed,
      attendanceRate: player.bookedSessions > 0 ? Math.round((totalAttended / player.bookedSessions) * 100) : 0,
      status:
        totalAttended / player.bookedSessions >= 0.8
          ? "good"
          : totalAttended / player.bookedSessions >= 0.6
            ? "warning"
            : "critical",
    }
  }
}

export const attendanceService = new AttendanceService()
