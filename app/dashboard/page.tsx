"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionCard } from "@/components/session-card"
import { PlayerStats } from "@/components/player-stats"
import { LogOut, Sun, Moon, Users, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Coach {
  id: string
  name: string
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

export default function DashboardPage() {
  const [coach, setCoach] = useState<Coach | null>(null)
  const [todaySessions, setTodaySessions] = useState<Session[]>([])
  const [players, setPlayers] = useState<Player[]>([])
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
        const data = await response.json()
        setCoach(data.coach)
        setTodaySessions(data.sessions)
        setPlayers(data.players)
      } else {
        router.push("/login")
      }
    } catch (error) {
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
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const morningSessions = todaySessions.filter((s) => s.timeSlot === "morning")
  const eveningSessions = todaySessions.filter((s) => s.timeSlot === "evening")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Player Attendance Tracker</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {coach?.name} • {coach?.ageGroup} Age Group
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySessions.length}</div>
              <p className="text-xs text-muted-foreground">
                {morningSessions.length} morning, {eveningSessions.length} evening
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{players.length}</div>
              <p className="text-xs text-muted-foreground">In {coach?.ageGroup} age group</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <Badge variant="secondary">85%</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">This month's average</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sessions">Today's Sessions</TabsTrigger>
            <TabsTrigger value="players">Player Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    Morning Sessions
                  </CardTitle>
                  <CardDescription>{morningSessions.length} session(s) scheduled</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {morningSessions.length > 0 ? (
                    morningSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        players={players}
                        onAttendanceUpdate={fetchDashboardData}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No morning sessions scheduled</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-blue-500" />
                    Evening Sessions
                  </CardTitle>
                  <CardDescription>{eveningSessions.length} session(s) scheduled</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eveningSessions.length > 0 ? (
                    eveningSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        players={players}
                        onAttendanceUpdate={fetchDashboardData}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No evening sessions scheduled</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="players">
            <PlayerStats players={players} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
