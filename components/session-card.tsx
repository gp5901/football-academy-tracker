"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AttendanceDialog } from "./attendance-dialog"
import { Clock, Users, Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface Player {
  id: string
  name: string
  ageGroup: string
  bookedSessions: number
  attendedSessions: number
  complimentarySessions: number
  joinDate: Date
}

interface Session {
  id: string
  date: string
  timeSlot: "morning" | "evening"
  ageGroup: string
}

interface SessionCardProps {
  session: Session
  players: Player[]
  onAttendanceUpdate: () => void
}

export function SessionCard({ session, players, onAttendanceUpdate }: SessionCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Safe array handling
  const safePlayersArray = players || []

  // Calculate session statistics
  const totalPlayers = safePlayersArray.length
  const attendanceCount = safePlayersArray.filter((p) => p.attendedSessions > 0).length
  const lowAttendancePlayers = safePlayersArray.filter((p) => {
    const rate = p.bookedSessions > 0 ? (p.attendedSessions / p.bookedSessions) * 100 : 0
    return rate < 70
  }).length

  const handleMarkAttendance = () => {
    setIsDialogOpen(true)
  }

  const handleAttendanceComplete = () => {
    setIsDialogOpen(false)
    onAttendanceUpdate()
  }

  const getTimeSlotDisplay = (timeSlot: string) => {
    return timeSlot === "morning" ? "Morning Session" : "Evening Session"
  }

  const getTimeSlotBadge = (timeSlot: string) => {
    return timeSlot === "morning" ? "default" : "secondary"
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{getTimeSlotDisplay(session.timeSlot)}</CardTitle>
            <Badge variant={getTimeSlotBadge(session.timeSlot)}>{session.ageGroup || "Unknown"}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date(session.date).toLocaleDateString()}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Session Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-2xl font-bold text-blue-600">{totalPlayers}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Players</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-2xl font-bold text-green-600">{attendanceCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Regular Attendees</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-2xl font-bold text-red-600">{lowAttendancePlayers}</span>
              </div>
              <p className="text-xs text-muted-foreground">Low Attendance</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleMarkAttendance} className="flex-1" disabled={totalPlayers === 0}>
              <Users className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
            <Button variant="outline" size="icon" disabled>
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Player Preview */}
          {totalPlayers > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Players ({totalPlayers})</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {safePlayersArray.slice(0, 3).map((player) => (
                  <div key={player.id} className="flex items-center justify-between text-sm">
                    <span>{player.name}</span>
                    <div className="flex items-center gap-1">
                      {player.attendedSessions > 0 ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {player.attendedSessions}/{player.bookedSessions}
                      </span>
                    </div>
                  </div>
                ))}
                {totalPlayers > 3 && <p className="text-xs text-muted-foreground">+{totalPlayers - 3} more players</p>}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No players registered</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AttendanceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        session={session}
        players={safePlayersArray}
        onComplete={handleAttendanceComplete}
      />
    </>
  )
}
