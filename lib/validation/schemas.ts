import { z } from "zod"

export const attendanceInputSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
  playerId: z.string().uuid("Invalid player ID format"),
  status: z.enum(["present_regular", "present_complimentary", "absent"], {
    errorMap: () => ({ message: "Status must be present_regular, present_complimentary, or absent" }),
  }),
})

export const bulkAttendanceSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
  attendanceData: z
    .array(
      z.tuple([
        z.string().uuid("Invalid player ID format"),
        z.enum(["present_regular", "present_complimentary", "absent"]),
      ]),
    )
    .min(1, "At least one attendance record is required"),
})

export const attendanceRequestSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
  attendance: z
    .record(z.string().uuid(), z.enum(["present_regular", "present_complimentary", "absent"]))
    .refine((data) => Object.keys(data).length > 0, "At least one player attendance must be provided"),
  photo: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.match(/^data:image\/(png|jpeg|jpg);base64,/),
      "Invalid image format - must be PNG or JPEG",
    ),
})

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export const exportRequestSchema = z.object({
  format: z.enum(["csv", "json"]).default("csv"),
  dateRange: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional(),
})
