"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, Check, X, Clock, Loader2 } from "lucide-react"

interface Player {
  id: string
  name: string
  ageGroup: string
  bookedSessions: number
  attendedSessions: number
  complimentarySessions: number
}

interface Session {
  id: string
  date: string
  timeSlot: "morning" | "evening"
  ageGroup: string
}

interface AttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session
  players: Player[]
  onAttendanceUpdate: () => void
}

type AttendanceStatus = "present_regular" | "present_complimentary" | "absent" | null

export function AttendanceDialog({ open, onOpenChange, session, players, onAttendanceUpdate }: AttendanceDialogProps) {
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
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#f0f0f0"
      ctx.fillRect(0, 0, 400, 300)
      ctx.fillStyle = "#333"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Session Photo", 200, 150)
      ctx.fillText(new Date().toLocaleString(), 200, 180)
      setPhoto(canvas.toDataURL("image/jpeg", 0.8))
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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

      // Filter out null values and only include players with attendance marked
      const attendanceData = Object.entries(attendance).reduce(
        (acc, [playerId, status]) => {
          if (status !== null) {
            acc[playerId] = status
          }
          return acc
        },
        {} as Record<string, Exclude<AttendanceStatus, null>>,
      )

      if (Object.keys(attendanceData).length === 0) {
        toast({
          title: "No Attendance Marked",
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
          attendance: attendanceData,
          photo,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Attendance recorded for ${result.recordedCount} players`,
        })
        onAttendanceUpdate()
        onOpenChange(false)
        // Reset form
        setAttendance({})
        setPhoto(null)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to record attendance")
      }
    } catch (error) {
      console.error("Attendance submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record attendance",
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
        return <Check className="h-3 w-3" />
      case "present_complimentary":
        return <Clock className="h-3 w-3" />
      case "absent":
        return <X className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            {session.ageGroup} • {session.timeSlot} • {new Date(session.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Session Photo</h3>
              <div className="flex gap-3 mb-3">
                <Button variant="outline" size="sm" onClick={handlePhotoCapture}>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <label>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </Button>
              </div>
              {photo && (
                <div className="mt-3">
                  <img src={photo || "/placeholder.svg"} alt="Session photo" className="max-w-xs rounded-lg border" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Section */}
          <div>
            <h3 className="font-medium mb-4">Player Attendance ({players.length} players)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player) => (
                <Card key={player.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{player.name}</h4>
                      <p className="text-sm text-gray-600">
                        {player.attendedSessions}/{player.bookedSessions} sessions • {player.complimentarySessions}/3
                        complimentary
                      </p>
                    </div>
                    {attendance[player.id] && (
                      <Badge className={getStatusColor(attendance[player.id])}>
                        {getStatusIcon(attendance[player.id])}
                        <span className="ml-1">
                          {attendance[player.id] === "present_regular"
                            ? "Present"
                            : attendance[player.id] === "present_complimentary"
                              ? "Complimentary"
                              : "Absent"}
                        </span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={attendance[player.id] === "present_regular" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAttendanceChange(player.id, "present_regular")}
                      className="flex-1"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Present
                    </Button>
                    <Button
                      variant={attendance[player.id] === "present_complimentary" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAttendanceChange(player.id, "present_complimentary")}
                      disabled={player.complimentarySessions >= 3}
                      className="flex-1"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Comp.
                    </Button>
                    <Button
                      variant={attendance[player.id] === "absent" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleAttendanceChange(player.id, "absent")}
                      className="flex-1"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Absent
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Submit Section */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Attendance"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
