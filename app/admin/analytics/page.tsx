"use client"

import { useState, useEffect } from "react"
import AdminShell from "@/components/admin-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Download, Calendar, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

// Fake data for demo
const fakeStats = {
  totalStudents: 1200,
  activeStudents: 950,
  newEnrollments: 120,
  graduationRate: 87
}

const fakeTrendData = [
  { month: "Jan", value: 50 },
  { month: "Feb", value: 70 },
  { month: "Mar", value: 90 },
  { month: "Apr", value: 110 },
  { month: "May", value: 95 },
  { month: "Jun", value: 120 },
  { month: "Jul", value: 130 },
]

export default function AdminAnalyticsPage() {
  const [trendData, setTrendData] = useState(fakeTrendData)

  // Simulate live update
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendData(prev =>
        prev.map(item => ({ ...item, value: item.value + Math.floor(Math.random() * 10 - 5) }))
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AdminShell title="Analytics & Reports" description="Usage, performance, and outcomes." showRange>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fakeStats.totalStudents}</div>
            <Progress value={(fakeStats.totalStudents / 1500) * 100} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fakeStats.activeStudents}</div>
            <Progress value={(fakeStats.activeStudents / 1500) * 100} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">New Enrollments</CardTitle>
            <Calendar className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fakeStats.newEnrollments}</div>
            <Progress value={(fakeStats.newEnrollments / 200) * 100} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Graduation Rate</CardTitle>
            <Badge variant="secondary">{fakeStats.graduationRate}%</Badge>
          </CardHeader>
          <CardContent>
            <Progress value={fakeStats.graduationRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Trend & Exports */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Enrollment Trends
            </CardTitle>
            <Badge variant="outline" className="cursor-default">Monthly</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-end h-48">
              {trendData.map(item => (
                <div key={item.month} className="flex-1 flex flex-col justify-end items-center">
                  <div className="bg-blue-500 w-4 rounded-t-md" style={{ height: `${item.value}px` }}></div>
                  <span className="text-xs mt-1">{item.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Exports</CardTitle>
            <Download className="w-5 h-5 cursor-pointer" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Export reports in CSV or PDF for management or audit purposes.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center justify-center gap-1">
                <Download className="w-4 h-4" /> CSV
              </button>
              <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 flex items-center justify-center gap-1">
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
