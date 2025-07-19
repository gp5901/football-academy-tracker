"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SessionCard } from "@/components/session-card"
import { PlayerStats } from "@/components/player-stats"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Calendar, Users, TrendingUp, Download } from "lucide-react"

interface Coach {
  id: string
  username: string
  ageGroup: string
}

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

interface DashboardData {
  coach: Coach
  todaySessions: Session[]
  players: Player[]
  stats: {
    totalPlayers: number
    averageAttendance: number
    lowAttendancePlayers: number
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard")
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      } else if (response.status === 401) {
        router.push("/login")
      } else {
        throw new Error("Failed to fetch dashboard data")
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  const handleAttendanceUpdate = () => {
    fetchDashboardData()
    toast({
      title: "Success",
      description: "Attendance updated successfully",
    })
  }

  const exportAttendanceData = async () => {
    try {
      const response = await fetch("/api/attendance/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Attendance data exported successfully",
        })
      } else {
        throw new Error("Failed to export data")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Error",
        description: "Failed to export attendance data",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  const getPlayersForSession = (session: Session): Player[] => {
    return data.players.filter((player) => player.ageGroup === session.ageGroup) || []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Football Academy Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, Coach {data.coach.username}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{data.coach.ageGroup}</Badge>
              <Button variant="outline" size="sm" onClick={exportAttendanceData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalPlayers}</div>
              <p className="text-xs text-muted-foreground">In your age group</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.averageAttendance}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.stats.lowAttendancePlayers}</div>
              <p className="text-xs text-muted-foreground">Players below 70%</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Sessions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Sessions</h2>
          {data.todaySessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.todaySessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  players={getPlayersForSession(session)}
                  onAttendanceUpdate={handleAttendanceUpdate}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions today</h3>
                <p className="text-gray-600">You don't have any training sessions scheduled for today.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Player Statistics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Player Statistics</h2>
          <PlayerStats players={data.players} />
        </div>
      </main>
    </div>
  )
}
