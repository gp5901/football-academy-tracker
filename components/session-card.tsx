"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AttendanceDialog } from "./attendance-dialog"
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (!session) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Session data unavailable</p>
        </CardContent>
      </Card>
    )
  }

  // Safely handle players array
  const safePlayersArray = players || []
  const attendanceCount = safePlayersArray.filter((p) => p.attendedSessions > 0).length
  const lowAttendancePlayers = safePlayersArray.filter((p) => {
    const rate = p.bookedSessions > 0 ? (p.attendedSessions / p.bookedSessions) * 100 : 0
    return rate < 70
  }).length

  const formatTime = (timeSlot: string) => {
    return timeSlot === "morning" ? "9:00 AM - 11:00 AM" : "4:00 PM - 6:00 PM"
  }

  const getTimeSlotIcon = (timeSlot: string) => {
    return timeSlot === "morning" ? "🌅" : "🌆"
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{getTimeSlotIcon(session.timeSlot)}</span>
              {session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} Session
            </CardTitle>
            <Badge variant={session.timeSlot === "morning" ? "default" : "secondary"}>
              {session.ageGroup || "Unknown Age Group"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(session.timeSlot)}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {safePlayersArray.length} players
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Session Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{attendanceCount}</div>
              <div className="text-xs text-green-700">Regular Attendees</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{lowAttendancePlayers}</div>
              <div className="text-xs text-orange-700">Low Attendance</div>
            </div>
          </div>

          {/* Warning for low attendance */}
          {lowAttendancePlayers > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {lowAttendancePlayers} player(s) have attendance below 70%
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => setIsDialogOpen(true)} className="flex-1" disabled={safePlayersArray.length === 0}>
              <Camera className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </div>

          {safePlayersArray.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No players registered for this session</p>
          )}
        </CardContent>
      </Card>

      <AttendanceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        session={session}
        players={safePlayersArray}
        onAttendanceUpdate={onAttendanceUpdate}
      />
    </>
  )
}
