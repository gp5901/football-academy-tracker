"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AttendanceDialog } from "./attendance-dialog"
import { Clock, Users, Camera } from "lucide-react"

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

  const timeSlotDisplay = session.timeSlot === "morning" ? "9:00 AM - 11:00 AM" : "4:00 PM - 6:00 PM"

  // Safely handle players array
  const safePlayersArray = players || []
  const playersCount = safePlayersArray.length
  const lowAttendancePlayers = safePlayersArray.filter((p) => {
    const attendanceRate = p.attendedSessions > 0 ? (p.attendedSessions / p.bookedSessions) * 100 : 0
    return attendanceRate < 70
  }).length

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} Training
            </CardTitle>
            <Badge variant={session.timeSlot === "morning" ? "default" : "secondary"}>{session.ageGroup}</Badge>
          </div>
          <CardDescription className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {timeSlotDisplay}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {playersCount} players
            </span>
            {lowAttendancePlayers > 0 && (
              <Badge variant="destructive" className="text-xs">
                {lowAttendancePlayers} low attendance
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {playersCount > 0 && (
              <div className="text-sm text-gray-600">
                Expected attendance: {Math.round(playersCount * 0.85)} players
              </div>
            )}
            <Button onClick={() => setIsDialogOpen(true)} className="w-full" size="sm" disabled={playersCount === 0}>
              <Camera className="h-4 w-4 mr-2" />
              {playersCount === 0 ? "No Players Registered" : "Mark Attendance"}
            </Button>
          </div>
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
