"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp, TrendingDown, Download } from "lucide-react"

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
  const [sortBy, setSortBy] = useState<"name" | "attendance" | "complimentary">("name")

  if (!players || players.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No player data available</p>
        </CardContent>
      </Card>
    )
  }

  const getAttendanceRate = (player: Player) => {
    return player.bookedSessions > 0 ? (player.attendedSessions / player.bookedSessions) * 100 : 0
  }

  const sortedPlayers = [...players].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "attendance":
        return getAttendanceRate(b) - getAttendanceRate(a)
      case "complimentary":
        return b.complimentarySessions - a.complimentarySessions
      default:
        return 0
    }
  })

  const exportPlayerStats = () => {
    const csvContent = [
      ["Name", "Age Group", "Booked Sessions", "Attended Sessions", "Attendance Rate", "Complimentary Sessions"].join(
        ",",
      ),
      ...players.map((player) =>
        [
          player.name,
          player.ageGroup,
          player.bookedSessions,
          player.attendedSessions,
          `${getAttendanceRate(player).toFixed(1)}%`,
          player.complimentarySessions,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `player-stats-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Player Statistics</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPlayerStats}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={sortBy === "name" ? "default" : "outline"} size="sm" onClick={() => setSortBy("name")}>
            Name
          </Button>
          <Button
            variant={sortBy === "attendance" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("attendance")}
          >
            Attendance
          </Button>
          <Button
            variant={sortBy === "complimentary" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("complimentary")}
          >
            Complimentary
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedPlayers.map((player) => {
            const attendanceRate = getAttendanceRate(player)
            const isLowAttendance = attendanceRate < 70
            const isHighAttendance = attendanceRate >= 90

            return (
              <Card key={player.id} className={`${isLowAttendance ? "border-red-200 bg-red-50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{player.name}</h3>
                      {isLowAttendance && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Low Attendance
                        </Badge>
                      )}
                      {isHighAttendance && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Excellent
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{attendanceRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">
                        {player.attendedSessions}/{player.bookedSessions} sessions
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Attendance Progress</span>
                      <span>
                        {player.attendedSessions}/{player.bookedSessions}
                      </span>
                    </div>
                    <Progress value={attendanceRate} className="h-2" />
                  </div>

                  <div className="flex justify-between items-center mt-3 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">Complimentary: {player.complimentarySessions}/3</span>
                      <span className="text-muted-foreground">
                        Remaining: {player.bookedSessions - player.attendedSessions}
                      </span>
                    </div>
                    {attendanceRate < 70 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-xs">Needs attention</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
