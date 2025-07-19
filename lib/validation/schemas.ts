import { z } from "zod"

export const attendanceRequestSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  attendance: z.record(
    z.string().min(1, "Player ID is required"),
    z.enum(["present_regular", "present_complimentary", "absent"], {
      errorMap: () => ({ message: "Invalid attendance status" }),
    }),
  ),
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
