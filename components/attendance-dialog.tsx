"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, Check, X, Clock, Users } from "lucide-react"

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
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext("2d")

    if (ctx) {
      // Create a simple placeholder image
      ctx.fillStyle = "#f0f0f0"
      ctx.fillRect(0, 0, 640, 480)
      ctx.fillStyle = "#666"
      ctx.font = "24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Session Photo", 320, 240)
      ctx.fillText(new Date().toLocaleString(), 320, 280)

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      setPhoto(dataUrl)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Error",
          description: "Photo size must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Filter out null values and ensure we have attendance data
      const validAttendance = Object.entries(attendance).reduce(
        (acc, [playerId, status]) => {
          if (status !== null) {
            acc[playerId] = status
          }
          return acc
        },
        {} as Record<string, Exclude<AttendanceStatus, null>>,
      )

      if (Object.keys(validAttendance).length === 0) {
        toast({
          title: "Error",
          description: "Please mark attendance for at least one player",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: session.id,
          attendance: validAttendance,
          photo: photo || undefined,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: `Attendance recorded for ${result.recordedCount} players`,
        })
        onAttendanceUpdate()
        onClose()

        // Reset form
        setAttendance({})
        setPhoto(null)
      } else {
        throw new Error(result.error || "Failed to record attendance")
      }
    } catch (error) {
      console.error("Attendance submission error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to record attendance",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: AttendanceStatus) => {
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

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "present_regular":
      case "present_complimentary":
        return <Check className="h-4 w-4" />
      case "absent":
        return <X className="h-4 w-4" />
      default:
        return null
    }
  }

  const timeSlotDisplay = session.timeSlot === "morning" ? "9:00 AM - 11:00 AM" : "4:00 PM - 6:00 PM"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mark Attendance - {session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} Session
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <span>
              {session.ageGroup || "Unknown Age Group"} • {new Date(session.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {players.length} players
            </span>
            <Badge variant="outline">{timeSlotDisplay}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Session Photo</h3>
              <div className="flex gap-4 items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePhotoCapture}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button type="button" variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Button>
                </div>

                {photo && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Photo captured
                  </div>
                )}
              </div>

              {photo && (
                <div className="mt-4">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt="Session photo"
                    className="max-w-xs h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players List */}
          <div>
            <h3 className="font-medium mb-4">Player Attendance ({players.length} players)</h3>
            <div className="grid gap-3">
              {players.map((player) => {
                const currentStatus = attendance[player.id]
                const attendanceRate =
                  player.bookedSessions > 0 ? Math.round((player.attendedSessions / player.bookedSessions) * 100) : 0

                return (
                  <Card key={player.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{player.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {attendanceRate}% attendance
                          </Badge>
                          {player.complimentarySessions >= 3 && (
                            <Badge variant="destructive" className="text-xs">
                              Max complimentary used
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {player.attendedSessions}/{player.bookedSessions} sessions •{player.complimentarySessions}{" "}
                          complimentary used
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={currentStatus === "present_regular" ? "default" : "outline"}
                          onClick={() => handleAttendanceChange(player.id, "present_regular")}
                          className={currentStatus === "present_regular" ? getStatusColor("present_regular") : ""}
                        >
                          {getStatusIcon("present_regular")}
                          Present
                        </Button>

                        <Button
                          size="sm"
                          variant={currentStatus === "present_complimentary" ? "default" : "outline"}
                          onClick={() => handleAttendanceChange(player.id, "present_complimentary")}
                          disabled={player.complimentarySessions >= 3}
                          className={
                            currentStatus === "present_complimentary" ? getStatusColor("present_complimentary") : ""
                          }
                        >
                          {getStatusIcon("present_complimentary")}
                          Complimentary
                        </Button>

                        <Button
                          size="sm"
                          variant={currentStatus === "absent" ? "destructive" : "outline"}
                          onClick={() => handleAttendanceChange(player.id, "absent")}
                          className={currentStatus === "absent" ? getStatusColor("absent") : ""}
                        >
                          {getStatusIcon("absent")}
                          Absent
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Attendance"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
