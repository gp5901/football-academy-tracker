"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, Check, X, Gift } from "lucide-react"

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

type AttendanceStatus = "present" | "complimentary" | "absent" | null

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
    // In a real app, this would open the camera
    // For demo purposes, we'll simulate taking a photo
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
          title: "Attendance recorded",
          description: "Player attendance has been successfully recorded.",
        })
        onAttendanceUpdate()
        onClose()
        setAttendance({})
        setPhoto(null)
      } else {
        throw new Error("Failed to record attendance")
      }
    } catch (error) {
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
    const statuses = Object.values(attendance)
    return {
      present: statuses.filter((s) => s === "present").length,
      complimentary: statuses.filter((s) => s === "complimentary").length,
      absent: statuses.filter((s) => s === "absent").length,
    }
  }

  const counts = getAttendanceCount()

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
            {players.map((player) => (
              <Card key={player.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{player.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Sessions: {player.attendedSessions}/{player.bookedSessions} • Complimentary:{" "}
                        {player.complimentarySessions}/3
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={attendance[player.id] === "present" ? "default" : "outline"}
                        onClick={() => handleAttendanceChange(player.id, "present")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={attendance[player.id] === "complimentary" ? "secondary" : "outline"}
                        onClick={() => handleAttendanceChange(player.id, "complimentary")}
                        disabled={player.complimentarySessions >= 3}
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
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(attendance).length === 0}
              className="flex-1"
            >
              {isSubmitting ? "Recording..." : "Record Attendance"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
