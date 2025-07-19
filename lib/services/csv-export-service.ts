import type { Player, Coach, Session } from "../types/attendance"

export interface CSVExportData {
  coach: Coach
  players: Player[]
  sessions: Session[]
  reportDate: Date
}

export class CSVExportService {
  /**
   * Generate CSV content for attendance report
   */
  generateAttendanceCSV(data: CSVExportData): string {
    const lines: string[] = []

    // Report metadata
    lines.push("Football Academy Attendance Report")
    lines.push(`Generated on: ${data.reportDate.toLocaleDateString()}`)
    lines.push(`Coach: ${data.coach.name}`)
    lines.push(`Age Group: ${data.coach.ageGroup}`)
    lines.push(`Total Players: ${data.players.length}`)
    lines.push("") // Empty line

    // Headers
    const headers = [
      "Player Name",
      "Age Group",
      "Booked Sessions",
      "Attended Sessions",
      "Complimentary Sessions",
      "Attendance Rate (%)",
      "Status",
      "Join Date",
    ]
    lines.push(headers.join(","))

    // Player data rows
    data.players.forEach((player) => {
      const attendanceRate =
        player.bookedSessions > 0 ? Math.round((player.attendedSessions / player.bookedSessions) * 100) : 0

      const status = attendanceRate >= 80 ? "Good" : attendanceRate >= 60 ? "Warning" : "Critical"

      const row = [
        this.escapeCSVField(player.name),
        this.escapeCSVField(player.ageGroup),
        player.bookedSessions.toString(),
        player.attendedSessions.toString(),
        player.complimentarySessions.toString(),
        attendanceRate.toString(),
        status,
        player.joinDate.toLocaleDateString(),
      ]
      lines.push(row.join(","))
    })

    // Summary statistics
    lines.push("") // Empty line
    lines.push("Summary Statistics")

    const totalBooked = data.players.reduce((sum, p) => sum + p.bookedSessions, 0)
    const totalAttended = data.players.reduce((sum, p) => sum + p.attendedSessions, 0)
    const totalComplimentary = data.players.reduce((sum, p) => sum + p.complimentarySessions, 0)
    const averageAttendance = data.players.length > 0 ? Math.round((totalAttended / totalBooked) * 100) : 0

    const lowAttendancePlayers = data.players.filter((p) => {
      const rate = p.bookedSessions > 0 ? (p.attendedSessions / p.bookedSessions) * 100 : 0
      return rate < 70
    }).length

    lines.push(`Total Sessions Booked: ${totalBooked}`)
    lines.push(`Total Sessions Attended: ${totalAttended}`)
    lines.push(`Total Complimentary Sessions: ${totalComplimentary}`)
    lines.push(`Average Attendance Rate: ${averageAttendance}%`)
    lines.push(`Players with Low Attendance: ${lowAttendancePlayers}`)

    return lines.join("\n")
  }

  /**
   * Escape CSV field to handle commas, quotes, and newlines
   */
  private escapeCSVField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  /**
   * Create and download CSV file
   */
  downloadCSV(csvContent: string, filename: string): void {
    // Create blob with proper MIME type
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    })

    // Create download link
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)
  }
}

export const csvExportService = new CSVExportService()
