"use client"

import { useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, FileText, Trash2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Fake notification templates and history
const fakeTemplates = [
  { id: 1, subject: "Maintenance Notice", message: "System will be down tonight 11 PM - 1 AM." },
  { id: 2, subject: "New Feature Alert", message: "Check out our new dashboard analytics!" },
]

const fakeNotifications = [
  { id: 1, subject: "Maintenance Notice", message: "System will be down tonight 11 PM - 1 AM.", sentAt: "2025-09-15", status: "Sent" },
  { id: 2, subject: "Welcome Message", message: "Welcome to the new admin dashboard.", sentAt: "2025-09-10", status: "Sent" },
  { id: 3, subject: "Feature Update", message: "New analytics charts available.", sentAt: "2025-09-18", status: "Scheduled" },
]

export default function AdminNotificationsPage() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [notifications, setNotifications] = useState(fakeNotifications)
  const [templates, setTemplates] = useState(fakeTemplates)

  const handleSend = () => {
    if (!subject || !message) {
      alert("Subject and message are required.")
      return
    }
    const newNotification = {
      id: notifications.length + 1,
      subject,
      message,
      sentAt: new Date().toISOString().split("T")[0],
      status: "Sent",
    }
    setNotifications([newNotification, ...notifications])
    setSubject("")
    setMessage("")
    alert("Notification sent (demo).")
  }

  const handleSaveTemplate = () => {
    if (!subject || !message) {
      alert("Subject and message are required.")
      return
    }
    const newTemplate = { id: templates.length + 1, subject, message }
    setTemplates([newTemplate, ...templates])
    alert("Template saved (demo).")
  }

  const handleDeleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  return (
    <AdminShell title="Notification Center" description="Broadcast updates and manage templates.">
      
      {/* Notification Form */}
      <Card className="mb-6 max-w-2xl">
        <CardHeader>
          <CardTitle>New Notification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className="min-h-32 rounded-md border bg-background p-3 text-sm"
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleSend} className="flex items-center gap-1">
              <Send className="w-4 h-4" /> Send
            </Button>
            <Button variant="outline" className="flex items-center gap-1" onClick={handleSaveTemplate}>
              <FileText className="w-4 h-4" /> Save as Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card className="mb-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Sent / Scheduled Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Subject</th>
                  <th className="text-left p-2">Message</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(n => (
                  <tr key={n.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 font-medium">{n.subject}</td>
                    <td className="p-2 truncate max-w-xs">{n.message}</td>
                    <td className="p-2">{n.sentAt}</td>
                    <td className="p-2">
                      <Badge variant={n.status === "Sent" ? "default" : "secondary"}>{n.status}</Badge>
                    </td>
                    <td className="p-2 flex gap-2">
                      <Button size="sm" variant="outline">View</Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900" onClick={() => handleDeleteNotification(n.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Saved Templates</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {templates.map(t => (
            <div key={t.id} className="p-2 border rounded-md flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800">
              <div>
                <div className="font-medium">{t.subject}</div>
                <div className="text-sm text-muted-foreground truncate max-w-xs">{t.message}</div>
              </div>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>

    </AdminShell>
  )
}
