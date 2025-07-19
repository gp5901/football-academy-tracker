"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, TrendingDown } from "lucide-react"

interface Player {
  id: string
  name: string
  ageGroup: string
  bookedSessions: number
  attendedSessions: number
  complimentarySessions: number
}

interface PlayerStatsProps {
  players: Player[]
}

export function PlayerStats({ players }: PlayerStatsProps) {
  const exportToCSV = () => {
    const headers = [
      "Name",
      "Age Group",
      "Booked Sessions",
      "Attended Sessions",
      "Attendance Rate",
      "Complimentary Sessions",
    ]
    const csvData = players.map((player) => [
      player.name,
      player.ageGroup,
      player.bookedSessions.toString(),
      player.attendedSessions.toString(),
      `${Math.round((player.attendedSessions / player.bookedSessions) * 100)}%`,
      player.complimentarySessions.toString(),
    ])

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `player-attendance-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Player Statistics</h2>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4">
        {players.map((player) => {
          const attendanceRate = Math.round((player.attendedSessions / player.bookedSessions) * 100)
          const isLowAttendance = attendanceRate < 70

          return (
            <Card key={player.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{player.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {isLowAttendance ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    <Badge variant={isLowAttendance ? "destructive" : "default"}>{attendanceRate}%</Badge>
                  </div>
                </div>
                <CardDescription>{player.ageGroup} Age Group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Booked</p>
                    <p className="font-semibold">{player.bookedSessions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Attended</p>
                    <p className="font-semibold">{player.attendedSessions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-semibold">{player.bookedSessions - player.attendedSessions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Complimentary</p>
                    <p className="font-semibold">{player.complimentarySessions}/3</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Attendance Progress</span>
                    <span>{attendanceRate}%</span>
                  </div>
                  <Progress value={attendanceRate} className="h-2" />
                </div>

                {isLowAttendance && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      ⚠️ Low attendance alert - Consider reaching out to this player
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
