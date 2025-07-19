"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Download, Loader2 } from "lucide-react"
import { csvExportService } from "@/lib/services/csv-export-service"

interface Player {
  id: string
  name: string
  ageGroup: string
  bookedSessions: number
  attendedSessions: number
  complimentarySessions: number
  joinDate: Date
}

interface Coach {
  id: string
  username: string
  name: string
  ageGroup: string
  createdAt: Date
}

interface CSVExportButtonProps {
  coach: Coach
  players: Player[]
  className?: string
}

export function CSVExportButton({ coach, players, className }: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Generate CSV content using client-side logic
      const csvContent = csvExportService.generateAttendanceCSV({
        coach,
        players,
        sessions: [], // Sessions not needed for player report
        reportDate: new Date(),
      })

      // Generate filename with current date
      const filename = `attendance-report-${coach.ageGroup}-${new Date().toISOString().split("T")[0]}.csv`

      // Download CSV file
      csvExportService.downloadCSV(csvContent, filename)

      toast({
        title: "Success",
        description: "Attendance report downloaded successfully",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Error",
        description: "Failed to export attendance data",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || players.length === 0}
      className={className}
    >
      {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  )
}
