import type { PostgresAttendanceRepository } from "../repositories/attendance-repository"
import type { PhotoStorageService } from "./photo-storage-service"
import { BusinessError } from "../errors/custom-errors"
import { attendanceInputSchema } from "../validation/schemas"
import type { AttendanceRecord, AttendanceStatus, BulkAttendanceResult } from "../types/attendance"

interface MockPool {
  connect: () => Promise<{
    query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>
    release: () => void
  }>
}

export class AttendanceService {
  constructor(
    private attendanceRepo: PostgresAttendanceRepository,
    private dbPool: MockPool,
    private photoStorage: PhotoStorageService,
  ) {}

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
      // Begin transaction
      await client.query("BEGIN")

      // Check for existing record with optimistic locking
      const existingRecord = await this.attendanceRepo.findBySessionAndPlayer(sessionId, playerId, { forUpdate: true })

      // Handle photo upload asynchronously
      let photoUrl = null
      if (photoBuffer) {
        try {
          photoUrl = await this.photoStorage.uploadAsync(photoBuffer)
        } catch (error) {
          console.warn("Photo upload failed, continuing with attendance recording:", error)
        }
      }

      let result: AttendanceRecord
      if (existingRecord) {
        // Idempotent update
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
      client.release()
    }
  }

  async recordBulkAttendance(
    sessionId: string,
    attendanceData: Map<string, AttendanceStatus>,
    photo?: Buffer,
  ): Promise<BulkAttendanceResult> {
    // Convert Map to array of records
    const records = Array.from(attendanceData.entries()).map(([playerId, status]) => ({
      sessionId,
      playerId,
      status,
      timestamp: new Date(),
      photoUrl: null as string | null,
    }))

    // Handle photo upload if provided
    if (photo) {
      try {
        const photoUrl = await this.photoStorage.uploadAsync(photo)
        records.forEach((record) => {
          record.photoUrl = photoUrl
        })
      } catch (error) {
        console.warn("Photo upload failed, continuing with attendance recording:", error)
      }
    }

    // Use repository's bulk create method
    return await this.attendanceRepo.bulkCreate(records)
  }

  async getPlayerMonthlyStats(playerId: string, month: number, year: number) {
    const complimentaryCount = await this.attendanceRepo.getMonthlyComplimentaryCount(playerId, month, year)

    return {
      complimentarySessions: complimentaryCount,
      remainingComplimentary: Math.max(0, 3 - complimentaryCount),
    }
  }
}
