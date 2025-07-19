"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Camera, CheckCircle } from "lucide-react"

interface Player {
  id: string
  name: string
  monthlySessionsBooked: number
  attendanceRate: number
  regularSessions: number
  complimentarySessions: number
}

interface Session {
  id: string
  date: string
  timeSlot: "morning" | "evening"
  ageGroupId: string
  players: Player[]
  photoUrl?: string
  attendanceMarked?: boolean
}

interface SessionCardProps {
  session: Session
  onMarkAttendance: (session: Session) => void
}

export function SessionCard({ session, onMarkAttendance }: SessionCardProps) {
  const formatTime = (timeSlot: string) => {
    return timeSlot === "morning" ? "9:00 AM - 11:00 AM" : "4:00 PM - 6:00 PM"
  }

  const attendanceCount = session.players.filter((p) => p.regularSessions > 0).length
  const lowAttendancePlayers = session.players.filter((p) => p.attendanceRate < 70).length

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} Session
          </CardTitle>
          <div className="flex items-center gap-2">
            {session.attendanceMarked && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {session.photoUrl && (
              <Badge variant="outline">
                <Camera className="h-3 w-3 mr-1" />
                Photo
              </Badge>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {session.ageGroupId?.toUpperCase() || "Unknown Age Group"} • {formatTime(session.timeSlot)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{session.players.length} players registered</span>
          </div>
          {lowAttendancePlayers > 0 && (
            <Badge variant="destructive" className="text-xs">
              {lowAttendancePlayers} low attendance
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Expected Attendance</div>
            <div className="font-medium">{Math.round(session.players.length * 0.85)}</div>
          </div>
          <div>
            <div className="text-gray-600">Avg. Attendance Rate</div>
            <div className="font-medium">
              {Math.round(session.players.reduce((acc, p) => acc + p.attendanceRate, 0) / session.players.length)}%
            </div>
          </div>
        </div>

        <Button
          onClick={() => onMarkAttendance(session)}
          className="w-full"
          variant={session.attendanceMarked ? "outline" : "default"}
        >
          {session.attendanceMarked ? "Update Attendance" : "Mark Attendance"}
        </Button>
      </CardContent>
    </Card>
  )
}
