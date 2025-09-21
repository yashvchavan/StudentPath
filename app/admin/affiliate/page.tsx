"use client"

import { useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Users, RefreshCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

// Fake data for demo
const fakePartners = [
  { id: 1, name: "John Doe", email: "john@example.com", revenue: 12000, status: "active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", revenue: 8500, status: "inactive" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", revenue: 15230, status: "active" },
  { id: 4, name: "Sara Lee", email: "sara@example.com", revenue: 9400, status: "active" },
]

export default function AdminAffiliatePage() {
  const [partners, setPartners] = useState(fakePartners)

  const handleRefresh = () => {
    // Simulate data refresh
    const updated = partners.map(p => ({
      ...p,
      revenue: p.revenue + Math.floor(Math.random() * 1000 - 500),
    }))
    setPartners(updated)
  }

  const handleExport = () => {
    alert("Exporting partner data as CSV (demo placeholder)")
  }

  return (
    <AdminShell title="Affiliate Dashboard" description="Track partners, payouts, and referrals." showRange>
      
      {/* Top KPIs */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-secondary" /> ₹45,230
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active Partners</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" /> {partners.filter(p => p.status === "active").length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Payouts Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">₹8,400</CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-1">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </Button>
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-1">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center gap-1">
          + Add Partner
        </Button>
      </div>

      {/* Partner Table */}
      <Card>
        <CardHeader>
          <CardTitle>Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.email}</td>
                    <td className="p-2 text-right">₹{p.revenue}</td>
                    <td className="p-2">
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-2 flex gap-2">
                      <Button size="sm" variant="outline">View</Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900">Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
