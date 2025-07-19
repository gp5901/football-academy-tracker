import { mockDb } from "../database/connection"
import { BusinessError, ValidationError } from "../errors/custom-errors"
import type { AttendanceRecord, AttendanceStatus, BulkAttendanceResult } from "../types/attendance"
import { attendanceRecordSchema, bulkAttendanceSchema } from "../validation/schemas"

export class AttendanceService {
  /**
   * Records attendance with business rule validation
   */
  async recordAttendance(
    sessionId: string,
    playerId: string,
    status: AttendanceStatus,
    photoUrl?: string,
  ): Promise<AttendanceRecord> {
    // Validate input
    const validatedData = attendanceRecordSchema.parse({
      sessionId,
      playerId,
      status,
      photoUrl,
    })

    // Check complimentary session limit
    if (status === "present_complimentary") {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const existingComplimentary = mockDb.getAttendanceRecords().filter((record) => {
        const recordDate = new Date(record.timestamp)
        return (
          record.playerId === playerId &&
          record.status === "present_complimentary" &&
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear
        )
      }).length

      if (existingComplimentary >= 3) {
        throw new BusinessError("Player has exceeded monthly complimentary session limit (3)")
      }
    }

    // Check for existing record (idempotency)
    const existingRecord = mockDb
      .getAttendanceRecords()
      .find((record) => record.sessionId === sessionId && record.playerId === playerId)

    if (existingRecord) {
      // Update existing record
      const updated = mockDb.updateAttendanceRecord(existingRecord.id, {
        status: validatedData.status,
        photoUrl: validatedData.photoUrl,
        timestamp: new Date(),
      })
      if (!updated) {
        throw new Error("Failed to update attendance record")
      }
      return updated
    }

    // Create new record
    return mockDb.addAttendanceRecord({
      sessionId: validatedData.sessionId,
      playerId: validatedData.playerId,
      status: validatedData.status,
      photoUrl: validatedData.photoUrl,
      timestamp: new Date(),
    })
  }

  /**
   * Records bulk attendance for multiple players
   */
  async recordBulkAttendance(
    sessionId: string,
    attendanceData: Map<string, AttendanceStatus>,
    photoUrl?: string,
  ): Promise<BulkAttendanceResult> {
    const validatedData = bulkAttendanceSchema.parse({
      sessionId,
      attendance: Object.fromEntries(attendanceData),
      photo: photoUrl,
    })

    const results: AttendanceRecord[] = []
    const errors: string[] = []

    for (const [playerId, status] of attendanceData) {
      try {
        const record = await this.recordAttendance(sessionId, playerId, status, photoUrl)
        results.push(record)
      } catch (error) {
        errors.push(`Player ${playerId}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new ValidationError(`All attendance records failed: ${errors.join(", ")}`)
    }

    return {
      successCount: results.length,
      records: results,
      timestamp: new Date(),
    }
  }
}

export const attendanceService = new AttendanceService()
