"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { User, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface Player {
  id: string
  name: string
  ageGroup: string
  bookedSessions: number
  attendedSessions: number
  complimentarySessions: number
  joinDate: Date
}

interface PlayerStatsProps {
  players: Player[]
}

export function PlayerStats({ players }: PlayerStatsProps) {
  if (!players || players.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
          <p className="text-gray-600">No players are registered for your age group.</p>
        </CardContent>
      </Card>
    )
  }

  const getAttendanceStatus = (attendanceRate: number) => {
    if (attendanceRate >= 80) return { label: "Good", color: "bg-green-100 text-green-800", icon: TrendingUp }
    if (attendanceRate >= 60) return { label: "Warning", color: "bg-yellow-100 text-yellow-800", icon: Minus }
    return { label: "Critical", color: "bg-red-100 text-red-800", icon: TrendingDown }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player) => {
        const attendanceRate = player.bookedSessions > 0 ? (player.attendedSessions / player.bookedSessions) * 100 : 0
        const status = getAttendanceStatus(attendanceRate)
        const StatusIcon = status.icon

        return (
          <Card key={player.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">{player.name}</CardTitle>
                <Badge className={status.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Attendance Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Attendance Rate</span>
                  <span className="font-medium">{Math.round(attendanceRate)}%</span>
                </div>
                <Progress value={attendanceRate} className="h-2" />
              </div>

              {/* Session Statistics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Attended</p>
                  <p className="text-lg font-semibold text-green-600">{player.attendedSessions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Booked</p>
                  <p className="text-lg font-semibold">{player.bookedSessions}</p>
                </div>
              </div>

              {/* Complimentary Sessions */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Complimentary Sessions</span>
                  <span className="font-medium">{player.complimentarySessions}/3</span>
                </div>
                <Progress value={(player.complimentarySessions / 3) * 100} className="h-1" />
              </div>

              {/* Join Date */}
              <div className="text-xs text-muted-foreground">
                Joined: {new Date(player.joinDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
