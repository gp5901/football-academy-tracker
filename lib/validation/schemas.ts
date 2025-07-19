import { z } from "zod"

export const attendanceStatusSchema = z.enum(["present_regular", "present_complimentary", "absent"])

export const attendanceRecordSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  playerId: z.string().uuid("Invalid player ID"),
  status: attendanceStatusSchema,
  photoUrl: z.string().url().optional(),
  timestamp: z.date().default(() => new Date()),
})

export const bulkAttendanceSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  attendance: z.record(z.string().uuid(), attendanceStatusSchema),
  photo: z.string().optional(),
})

export const exportRequestSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(["csv", "json"]).default("csv"),
})

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})
