"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Check, X, Gift, Camera, Upload } from "lucide-react"

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
    // Simulate photo capture
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

      const dataUrl = canvas.toDataURL("image/png")
      setPhoto(dataUrl)
      toast({
        title: "Photo Captured",
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
          title: "Photo Uploaded",
          description: "Session photo has been uploaded successfully",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: session.id,
          attendance,
          photo,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Attendance recorded successfully",
        })
        onAttendanceUpdate()
        onClose()
        setAttendance({})
        setPhoto(null)
      } else {
        throw new Error("Failed to record attendance")
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

  const getAttendanceCount = () => {
    const counts = Object.values(attendance).reduce(
      (acc, status) => {
        if (status === "present_regular") acc.regular++
        if (status === "present_complimentary") acc.complimentary++
        if (status === "absent") acc.absent++
        return acc
      },
      { regular: 0, complimentary: 0, absent: 0 },
    )
    return counts
  }

  const counts = getAttendanceCount()
  const totalMarked = counts.regular + counts.complimentary + counts.absent

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Session Photo</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePhotoCapture}>
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </label>
                  </Button>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>
              {photo ? (
                <div className="relative">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt="Session photo"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setPhoto(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No photo captured yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{players.length}</div>
                <div className="text-sm text-muted-foreground">Total Players</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{counts.regular}</div>
                <div className="text-sm text-muted-foreground">Present (Regular)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{counts.complimentary}</div>
                <div className="text-sm text-muted-foreground">Present (Complimentary)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{counts.absent}</div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </CardContent>
            </Card>
          </div>

          {/* Player List */}
          <div className="space-y-3">
            <h3 className="font-medium">Players ({players.length})</h3>
            {players.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No players registered for this session</p>
            ) : (
              players.map((player) => {
                const playerAttendance = attendance[player.id]
                const attendanceRate =
                  player.bookedSessions > 0 ? (player.attendedSessions / player.bookedSessions) * 100 : 0
                const canUseComplimentary = player.complimentarySessions < 3

                return (
                  <Card key={player.id} className={playerAttendance ? "border-blue-200 bg-blue-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{player.name}</h4>
                            {attendanceRate < 70 && (
                              <Badge variant="destructive" className="text-xs">
                                Low Attendance
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sessions: {player.attendedSessions}/{player.bookedSessions} • Complimentary:{" "}
                            {player.complimentarySessions}/3 • Rate: {attendanceRate.toFixed(1)}%
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
                            <Gift className="h-4 w-4 mr-1" />
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
              })
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {totalMarked} of {players.length} players marked
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || totalMarked === 0}>
                {isSubmitting ? "Recording..." : "Record Attendance"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
