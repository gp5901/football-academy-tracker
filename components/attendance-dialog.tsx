"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, Check, X, Clock, AlertCircle } from "lucide-react"

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

interface AttendanceDialogProps {
  isOpen: boolean
  onClose: () => void
  session: Session
  players: Player[]
  onAttendanceUpdate: () => void
}

type AttendanceStatus = "present_regular" | "present_complimentary" | "absent" | null

export function AttendanceDialog({ isOpen, onClose, session, players, onAttendanceUpdate }: AttendanceDialogProps) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [photo, setPhoto] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleAttendanceChange = (playerId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: status,
    }))
  }

  const handlePhotoCapture = () => {
    // Simulate camera capture
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext("2d")

    if (ctx) {
      // Create a simple placeholder image
      ctx.fillStyle = "#f0f0f0"
      ctx.fillRect(0, 0, 400, 300)
      ctx.fillStyle = "#666"
      ctx.font = "20px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Session Photo", 200, 150)
      ctx.fillText(new Date().toLocaleString(), 200, 180)

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      setPhoto(dataUrl)

      toast({
        title: "Photo captured",
        description: "Session photo has been captured successfully",
      })
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhoto(e.target?.result as string)
        toast({
          title: "Photo uploaded",
          description: "Session photo has been uploaded successfully",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Submit attendance data
      const attendanceData = Object.entries(attendance).map(([playerId, status]) => ({
        sessionId: session.id,
        playerId,
        status,
      }))

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendance: attendanceData,
          photo: photo,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Attendance has been recorded successfully",
        })
        onAttendanceUpdate()
        onClose()
        // Reset form
        setAttendance({})
        setPhoto(null)
      } else {
        throw new Error("Failed to submit attendance")
      }
    } catch (error) {
      console.error("Attendance submission error:", error)
      toast({
        title: "Error",
        description: "Failed to record attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAttendanceStats = () => {
    const statuses = Object.values(attendance)
    return {
      present: statuses.filter((s) => s === "present_regular" || s === "present_complimentary").length,
      absent: statuses.filter((s) => s === "absent").length,
      unmarked: players.length - statuses.filter((s) => s !== null).length,
    }
  }

  const stats = getAttendanceStats()
  const canSubmit = Object.keys(attendance).length === players.length

  if (!session) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mark Attendance - {session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} Session
          </DialogTitle>
          <DialogDescription>
            {session.ageGroup || "Unknown Age Group"} • {new Date(session.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Session Photo</h3>
              <div className="flex gap-2 mb-3">
                <Button variant="outline" onClick={handlePhotoCapture}>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>

              {photo && (
                <div className="mt-3">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt="Session photo"
                    className="max-w-full h-32 object-cover rounded-lg border"
                  />
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <div className="text-sm text-muted-foreground">Present</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.unmarked}</div>
                <div className="text-sm text-muted-foreground">Unmarked</div>
              </CardContent>
            </Card>
          </div>

          {/* Player List */}
          <div>
            <h3 className="font-medium mb-3">Players ({players.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {players.map((player) => {
                const playerAttendance = attendance[player.id]
                const attendanceRate =
                  player.bookedSessions > 0 ? Math.round((player.attendedSessions / player.bookedSessions) * 100) : 0
                const isLowAttendance = attendanceRate < 70
                const canUseComplimentary = player.complimentarySessions < 3

                return (
                  <Card key={player.id} className={`${isLowAttendance ? "border-orange-200 bg-orange-50" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{player.name}</h4>
                            {isLowAttendance && <AlertCircle className="h-4 w-4 text-orange-500" />}
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            <span>
                              Attended: {player.attendedSessions}/{player.bookedSessions}
                            </span>
                            <span>Rate: {attendanceRate}%</span>
                            <span>Complimentary: {player.complimentarySessions}/3</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant={playerAttendance === "present_regular" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleAttendanceChange(player.id, "present_regular")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Present
                          </Button>

                          <Button
                            variant={playerAttendance === "present_complimentary" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleAttendanceChange(player.id, "present_complimentary")}
                            disabled={!canUseComplimentary}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Complimentary
                          </Button>

                          <Button
                            variant={playerAttendance === "absent" ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleAttendanceChange(player.id, "absent")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Submit Section */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {canSubmit ? "All players marked" : `${stats.unmarked} players remaining`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Attendance"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
