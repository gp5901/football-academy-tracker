import { z } from "zod"

// Comprehensive input validation schemas
export const attendanceInputSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
  playerId: z.string().uuid("Invalid player ID format"),
  status: z.enum(["present_regular", "present_complimentary", "absent"]),
})

export const bulkAttendanceSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
  attendance: z
    .record(z.string().uuid("Invalid player ID format"), z.enum(["present_regular", "present_complimentary", "absent"]))
    .refine((data) => Object.keys(data).length > 0, "At least one player attendance must be provided"),
  photo: z
    .string()
    .optional()
    .transform((val) => {
      if (val && !val.match(/^data:image\/(png|jpeg|jpg);base64,/)) {
        throw new Error("Invalid image format")
      }
      return val
    }),
})

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const exportSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  format: z.enum(["csv", "json"]).default("csv"),
})
