"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, Check, X, Gift, Save } from "lucide-react"

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

type AttendanceStatus = "present_regular" | "present_complimentary" | "absent"

export function AttendanceDialog({ isOpen, onClose, session, players, onAttendanceUpdate }: AttendanceDialogProps) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [photo, setPhoto] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Safely handle players array
  const safePlayersArray = players || []

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
      ctx.font = "20px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Group Photo Taken", 200, 150)
      ctx.fillText(new Date().toLocaleString(), 200, 180)
      setPhoto(canvas.toDataURL())
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a photo smaller than 5MB",
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
    setIsSubmitting(true)

    try {
      const attendanceData = Object.entries(attendance).map(([playerId, status]) => ({
        playerId,
        status,
      }))

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: session.id,
          attendanceData,
          photo,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Attendance recorded successfully",
        })
        onAttendanceUpdate()
        onClose()
        resetForm()
      } else {
        throw new Error(result.error || "Failed to record attendance")
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

  const resetForm = () => {
    setAttendance({})
    setPhoto(null)
  }

  const getAttendanceCount = () => {
    const statuses = Object.values(attendance)
    return {
      present: statuses.filter((s) => s === "present_regular").length,
      complimentary: statuses.filter((s) => s === "present_complimentary").length,
      absent: statuses.filter((s) => s === "absent").length,
    }
  }

  const counts = getAttendanceCount()
  const totalMarked = Object.keys(attendance).length
  const totalPlayers = safePlayersArray.length

  const canUseComplimentary = (player: Player) => {
    return player.complimentarySessions < 3
  }

  if (totalPlayers === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Players Registered</DialogTitle>
            <DialogDescription>There are no players registered for this session.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Mark Attendance - {session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} Session
          </DialogTitle>
          <DialogDescription>
            {session.ageGroup} • {new Date(session.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Progress</h3>
                <Badge variant={totalMarked === totalPlayers ? "default" : "secondary"}>
                  {totalMarked}/{totalPlayers} marked
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalPlayers > 0 ? (totalMarked / totalPlayers) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Photo Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Group Photo</h3>
              {photo ? (
                <div className="space-y-3">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt="Group photo"
                    className="w-full max-w-md h-48 object-cover rounded-lg mx-auto"
                  />
                  <Button variant="outline" onClick={() => setPhoto(null)} className="w-full">
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handlePhotoCapture} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <div className="flex gap-4 text-sm">
            <Badge variant="default">Present: {counts.present}</Badge>
            <Badge variant="secondary">Complimentary: {counts.complimentary}</Badge>
            <Badge variant="destructive">Absent: {counts.absent}</Badge>
          </div>

          {/* Player List */}
          <div className="grid gap-3">
            {safePlayersArray.map((player) => {
              const attendanceRate =
                player.attendedSessions > 0 ? (player.attendedSessions / player.bookedSessions) * 100 : 0
              const isLowAttendance = attendanceRate < 70

              return (
                <Card key={player.id} className={isLowAttendance ? "border-amber-300" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{player.name}</h4>
                          {isLowAttendance && (
                            <Badge variant="destructive" className="text-xs">
                              Low Attendance
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sessions: {player.attendedSessions}/{player.bookedSessions} • Complimentary:{" "}
                          {player.complimentarySessions}/3 • Rate: {Math.round(attendanceRate)}%
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={attendance[player.id] === "present_regular" ? "default" : "outline"}
                          onClick={() => handleAttendanceChange(player.id, "present_regular")}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[player.id] === "present_complimentary" ? "secondary" : "outline"}
                          onClick={() => handleAttendanceChange(player.id, "present_complimentary")}
                          disabled={!canUseComplimentary(player)}
                          title={!canUseComplimentary(player) ? "Complimentary sessions exhausted" : ""}
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Comp
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[player.id] === "absent" ? "destructive" : "outline"}
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

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || totalMarked === 0} className="flex-1">
              {isSubmitting ? (
                "Recording..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Record Attendance ({totalMarked}/{totalPlayers})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
