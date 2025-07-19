"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AttendanceDialog } from "@/components/attendance-dialog"
import { Clock, Users, Camera, AlertTriangle } from "lucide-react"

interface Session {
  id: string
  date: string
  timeSlot: "morning" | "evening"
  ageGroup: string
}

interface Player {
  id: string
  name: string
  ageGroup: string
  bookedSessions: number
  attendedSessions: number
  complimentarySessions: number
}

interface SessionCardProps {
  session: Session
  players: Player[]
  onAttendanceUpdate: () => void
}

export function SessionCard({ session, players, onAttendanceUpdate }: SessionCardProps) {
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)

  // Safely handle players array
  const safePlayersArray = players || []

  if (!session) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-red-600">Session data unavailable</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate session statistics
  const totalPlayers = safePlayersArray.length
  const attendanceCount = safePlayersArray.filter((p) => p.attendedSessions > 0).length
  const lowAttendancePlayers = safePlayersArray.filter((p) => {
    const rate = p.bookedSessions > 0 ? (p.attendedSessions / p.bookedSessions) * 100 : 0
    return rate < 70
  }).length

  const getTimeDisplay = (timeSlot: string) => {
    return timeSlot === "morning" ? "9:00 AM - 11:00 AM" : "4:00 PM - 6:00 PM"
  }

  const getTimeSlotColor = (timeSlot: string) => {
    return timeSlot === "morning" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} Session
            </CardTitle>
            <Badge className={getTimeSlotColor(session.timeSlot)}>{getTimeDisplay(session.timeSlot)}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {session.ageGroup || "Unknown Age Group"} • {new Date(session.date).toLocaleDateString()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{totalPlayers}</div>
              <div className="text-xs text-muted-foreground">Total Players</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{attendanceCount}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">{lowAttendancePlayers}</div>
              <div className="text-xs text-muted-foreground">Low Attendance</div>
            </div>
          </div>

          {/* Alerts */}
          {lowAttendancePlayers > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                {lowAttendancePlayers} player{lowAttendancePlayers > 1 ? "s" : ""} need
                {lowAttendancePlayers === 1 ? "s" : ""} attention
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => setIsAttendanceOpen(true)} className="flex-1" disabled={totalPlayers === 0}>
              <Users className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
            <Button variant="outline" size="icon" disabled>
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {totalPlayers === 0 && (
            <p className="text-sm text-muted-foreground text-center">No players registered for this session</p>
          )}
        </CardContent>
      </Card>

      <AttendanceDialog
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        session={session}
        players={safePlayersArray}
        onAttendanceUpdate={onAttendanceUpdate}
      />
    </>
  )
}
