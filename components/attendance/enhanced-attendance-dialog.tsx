"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Camera, Upload, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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
}

interface AttendanceRecord {
  playerId: string
  status: "present_regular" | "present_complimentary" | "absent"
}

interface EnhancedAttendanceDialogProps {
  session: Session | null
  isOpen: boolean
  onClose: () => void
  onAttendanceUpdate: (sessionId: string, attendance: AttendanceRecord[]) => Promise<void>
}

export function EnhancedAttendanceDialog({
  session,
  isOpen,
  onClose,
  onAttendanceUpdate,
}: EnhancedAttendanceDialogProps) {
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoTaken, setPhotoTaken] = useState(false)

  if (!session) return null

  const handleAttendanceChange = (playerId: string, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: status,
    }))
  }

  const handleBulkAttendance = (status: string) => {
    const bulkUpdate: Record<string, string> = {}
    session.players.forEach((player) => {
      // Only update if not already marked
      if (!attendance[player.id]) {
        bulkUpdate[player.id] = status
      }
    })
    setAttendance((prev) => ({ ...prev, ...bulkUpdate }))
    toast({
      title: "Bulk Update Applied",
      description: `Marked ${Object.keys(bulkUpdate).length} players as ${status.replace("_", " ")}`,
    })
  }

  const handlePhotoCapture = () => {
    // Simulate photo capture
    setPhotoTaken(true)
    toast({
      title: "Photo Captured",
      description: "Session photo has been taken successfully",
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const attendanceRecords: AttendanceRecord[] = Object.entries(attendance).map(([playerId, status]) => ({
        playerId,
        status: status as AttendanceRecord["status"],
      }))

      await onAttendanceUpdate(session.id, attendanceRecords)

      toast({
        title: "Attendance Updated",
        description: `Successfully updated attendance for ${attendanceRecords.length} players`,
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present_regular":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "present_complimentary":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present_regular":
        return "bg-green-100 text-green-800 border-green-200"
      case "present_complimentary":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "absent":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const canUseComplimentary = (player: Player) => {
    return player.complimentarySessions < 3
  }

  const attendedCount = Object.values(attendance).filter(
    (status) => status === "present_regular" || status === "present_complimentary",
  ).length

  const absentCount = Object.values(attendance).filter((status) => status === "absent").length
  const pendingCount = session.players.length - Object.keys(attendance).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Attendance - {session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)}
          </DialogTitle>
          <DialogDescription>
            {session.ageGroupId?.toUpperCase() || "Unknown Age Group"} • {new Date(session.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        {/* Session Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{attendedCount}</div>
              <div className="text-sm text-gray-600">Present</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{session.players.length}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <span className="font-medium">Session Photo</span>
                {photoTaken && <Badge variant="secondary">Photo Taken</Badge>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePhotoCapture} disabled={photoTaken}>
                  <Camera className="h-4 w-4 mr-2" />
                  {photoTaken ? "Photo Taken" : "Take Photo"}
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => handleBulkAttendance("present_regular")}>
            Mark All Present
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAttendance("absent")}>
            Mark All Absent
          </Button>
        </div>

        {/* Players List */}
        <div className="space-y-3">
          {session.players.map((player) => (
            <Card key={player.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{player.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Rate: {player.attendanceRate}%</span>
                        <span>
                          Regular: {player.regularSessions}/{player.monthlySessionsBooked}
                        </span>
                        <span>Complimentary: {player.complimentarySessions}/3</span>
                      </div>
                    </div>
                    {player.attendanceRate < 70 && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" title="Low attendance" />
                    )}
                  </div>
                  <Progress value={player.attendanceRate} className="mt-2 h-2" />
                </div>

                <div className="flex items-center gap-2">
                  {attendance[player.id] && (
                    <Badge className={getStatusColor(attendance[player.id])}>
                      {getStatusIcon(attendance[player.id])}
                      <span className="ml-1">
                        {attendance[player.id]
                          .replace("_", " ")
                          .replace("present", "Present")
                          .replace("absent", "Absent")}
                      </span>
                    </Badge>
                  )}

                  <div className="flex gap-1">
                    <Button
                      variant={attendance[player.id] === "present_regular" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAttendanceChange(player.id, "present_regular")}
                    >
                      Present
                    </Button>
                    <Button
                      variant={attendance[player.id] === "present_complimentary" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAttendanceChange(player.id, "present_complimentary")}
                      disabled={!canUseComplimentary(player)}
                      title={!canUseComplimentary(player) ? "Complimentary sessions exhausted" : ""}
                    >
                      Comp
                    </Button>
                    <Button
                      variant={attendance[player.id] === "absent" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleAttendanceChange(player.id, "absent")}
                    >
                      Absent
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || Object.keys(attendance).length === 0}>
            {isSubmitting ? "Updating..." : `Update Attendance (${Object.keys(attendance).length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
