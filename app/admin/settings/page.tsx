"use client"

import { useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save } from "lucide-react"

export default function AdminSettingsPage() {
  const [collegeName, setCollegeName] = useState("IIT Delhi")
  const [supportEmail, setSupportEmail] = useState("support@iitdelhi.ac.in")

  const handleSave = () => {
    alert(`Settings saved:\nCollege: ${collegeName}\nEmail: ${supportEmail}`)
  }

  return (
    <AdminShell title="College Settings" description="Branding, domains, and preferences.">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-muted-foreground">College Name</span>
            <Input
              placeholder="IIT Delhi"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="bg-background border-gray-300 focus:border-primary focus:ring-primary"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-muted-foreground">Support Email</span>
            <Input
              placeholder="support@iitdelhi.ac.in"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="bg-background border-gray-300 focus:border-primary focus:ring-primary"
            />
          </label>

          <Button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 mt-2 bg-primary text-white hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary/80"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
