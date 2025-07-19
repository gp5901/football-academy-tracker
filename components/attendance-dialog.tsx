"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, Save, Loader2 } from "lucide-react"

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

interface AttendanceDialogProps {
  isOpen: boolean
  onClose: () => void
  session: Session
  players: Player[]
  onComplete: () => void
}

type AttendanceStatus = "present_regular" | "present_complimentary" | "absent"

export function AttendanceDialog({ isOpen, onClose, session, players, onComplete }: AttendanceDialogProps) {
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
    const mockPhotoData =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    setPhoto(mockPhotoData)
    toast({
      title: "Photo captured",
      description: "Session photo has been captured successfully",
    })
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
    try {
      setIsSubmitting(true)

      // Validate that at least one attendance is marked
      if (Object.keys(attendance).length === 0) {
        toast({
          title: "No attendance marked",
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
          attendance,
          photo,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Attendance recorded for ${result.recordedCount} players`,
        })
        onComplete()
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

  const getAttendanceColor = (status: AttendanceStatus) => {
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

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case "present_regular":
        return "Present"
      case "present_complimentary":
        return "Present (Comp)"
      case "absent":
        return "Absent"
      default:
        return "Not marked"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            {session.ageGroup} • {new Date(session.date).toLocaleDateString()} • {session.timeSlot}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Session Photo</h3>
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
              <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>
            {photo && (
              <div className="mt-2">
                <img
                  src={photo || "/placeholder.svg"}
                  alt="Session"
                  className="w-20 h-20 object-cover rounded border"
                />
              </div>
            )}
          </div>

          {/* Players List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Players ({players.length})</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Sessions: {player.attendedSessions}/{player.bookedSessions} • Complimentary:{" "}
                      {player.complimentarySessions}/3
                    </div>
                  </div>
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
                      disabled={player.complimentarySessions >= 3}
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
              ))}
            </div>
          </div>

          {/* Summary */}
          {Object.keys(attendance).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Summary</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(attendance).map(([playerId, status]) => {
                  const player = players.find((p) => p.id === playerId)
                  return (
                    <Badge key={playerId} className={getAttendanceColor(status)}>
                      {player?.name}: {getStatusLabel(status)}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || Object.keys(attendance).length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
