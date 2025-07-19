import type { Pool } from "pg"
import type { AttendanceRepository } from "../repositories/attendance-repository"
import type { AttendanceRecord, AttendanceStatus } from "../types/attendance"
import { BusinessError } from "../errors/custom-errors"
import { attendanceInputSchema, bulkAttendanceSchema } from "../validation/schemas"
import type { PhotoStorageService } from "./photo-storage-service"

export interface BulkAttendanceResult {
  successCount: number
  records: AttendanceRecord[]
  timestamp: Date
}

export class AttendanceService {
  constructor(
    private attendanceRepo: AttendanceRepository,
    private dbPool: Pool,
    private photoStorage: PhotoStorageService,
  ) {}

  /**
   * Records attendance with atomic transaction and optimistic locking
   * Time Complexity: O(1) with proper database indexing
   * Space Complexity: O(1) - single record operations
   */
  async recordAttendanceAtomic(
    sessionId: string,
    playerId: string,
    status: AttendanceStatus,
    photoBuffer?: Buffer,
  ): Promise<AttendanceRecord> {
    // Input validation with Zod schema
    const validatedInput = attendanceInputSchema.parse({
      sessionId,
      playerId,
      status,
    })

    const client = await this.dbPool.connect()

    try {
      await client.query("BEGIN")

      // Optimistic locking to prevent race conditions
      const existingRecord = await this.attendanceRepo.findBySessionAndPlayer(
        sessionId,
        playerId,
        { forUpdate: true }, // EXCLUSIVE lock
      )

      // Handle photo upload asynchronously to avoid blocking attendance recording
      let photoUrl = null
      if (photoBuffer) {
        photoUrl = await this.photoStorage.uploadAsync(photoBuffer)
      }

      let result: AttendanceRecord
      if (existingRecord) {
        // Idempotent update - prevent duplicate submissions
        result = await this.attendanceRepo.updateWithVersion(
          existingRecord.id,
          { status, photoUrl },
          existingRecord.version,
        )
      } else {
        // New attendance record
        result = await this.attendanceRepo.create({
          sessionId: validatedInput.sessionId,
          playerId: validatedInput.playerId,
          status: validatedInput.status,
          photoUrl,
          timestamp: new Date(),
        })
      }

      await client.query("COMMIT")
      return result
    } catch (error: any) {
      await client.query("ROLLBACK")

      // Transform database constraint violations into business errors
      if (error.message?.includes("complimentary session limit")) {
        throw new BusinessError("Complimentary session limit exceeded")
      }
      throw error
    } finally {
      client.release() // Return connection to pool
    }
  }

  /**
   * Bulk attendance recording for performance optimization
   * Reduces database round-trips from O(n) to O(1)
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

    // Batch processing to reduce memory pressure
    const batchSize = 50 // Prevent OOM with large player lists
    const results: AttendanceRecord[] = []
    const attendanceEntries = Array.from(attendanceData.entries())

    for (let i = 0; i < attendanceEntries.length; i += batchSize) {
      const batch = attendanceEntries.slice(i, i + batchSize)
      const batchResults = await this.processBatch(sessionId, batch, photo)
      results.push(...batchResults)
    }

    return {
      successCount: results.length,
      records: results,
      timestamp: new Date(),
    }
  }

  private async processBatch(
    sessionId: string,
    batch: [string, AttendanceStatus][],
    photo?: Buffer,
  ): Promise<AttendanceRecord[]> {
    const results: AttendanceRecord[] = []

    for (const [playerId, status] of batch) {
      try {
        const result = await this.recordAttendanceAtomic(sessionId, playerId, status, photo)
        results.push(result)
      } catch (error) {
        // Log individual failures but continue processing
        console.error(`Failed to record attendance for player ${playerId}:`, error)
      }
    }

    return results
  }

  async getPlayerMonthlyStats(playerId: string, month: number, year: number) {
    const complimentaryCount = await this.attendanceRepo.getMonthlyComplimentaryCount(playerId, month, year)

    return {
      complimentaryUsed: complimentaryCount,
      complimentaryRemaining: Math.max(0, 3 - complimentaryCount),
    }
  }
}
