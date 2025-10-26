"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Bell, Shield, Palette, Globe, Save, Camera, Loader2, Check, AlertCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"


interface Profile {
  student_id: number
  name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  college: string
  college_id: number | null
  program: string
  semester: number
  bio: string
  profile_picture: string | null
}

interface Settings {
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    assignmentReminders: boolean
    goalUpdates: boolean
    weeklyReports: boolean
    courseUpdates: boolean
  }
  privacy: {
    profileVisibility: boolean
    progressSharing: boolean
    analyticsOptIn: boolean
  }
  preferences: {
    theme: string
    language: string
    timezone: string
  }
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile>({
    student_id: 0,
    name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    college: "",
    college_id: null,
    program: "",
    semester: 1,
    bio: "",
    profile_picture: null,
  })

  const [settings, setSettings] = useState<Settings>({
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      assignmentReminders: true,
      goalUpdates: true,
      weeklyReports: false,
      courseUpdates: true,
    },
    privacy: {
      profileVisibility: true,
      progressSharing: false,
      analyticsOptIn: true,
    },
    preferences: {
      theme: "system",
      language: "en",
      timezone: "Asia/Kolkata",
    }
  })

  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [])

  // Sync theme with settings
  useEffect(() => {
    if (mounted && settings.preferences.theme) {
      setTheme(settings.preferences.theme)
    }
  }, [settings.preferences.theme, mounted])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/settings", {
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load settings")
      }

      const data = await response.json()

      if (data.success) {
        setProfile(data.profile)
        setSettings(data.settings)
      }
    } catch (err: any) {
      console.error("Error loading settings:", err)
      setError(err.message || "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          profile: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            phone: profile.phone,
            program: profile.program,
            semester: profile.semester,
            bio: profile.bio,
          },
          settings: {
            notifications: settings.notifications,
            privacy: settings.privacy,
            preferences: {
              ...settings.preferences,
              theme: theme || "system"
            }
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      const data = await response.json()

      if (data.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err: any) {
      console.error("Error saving settings:", err)
      setError(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed")
      return
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 2MB")
      return
    }

    try {
      setUploadingAvatar(true)
      setError(null)

      const formData = new FormData()
      formData.append("avatar", file)

      const response = await fetch("/api/settings/upload-avatar", {
        method: "POST",
        body: formData,
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload avatar")
      }

      const data = await response.json()

      if (data.success) {
        setProfile(prev => ({ ...prev, profile_picture: data.url }))
      }
    } catch (err: any) {
      console.error("Error uploading avatar:", err)
      setError(err.message || "Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    return "U"
  }

  if (!mounted || loading) {
    return (
      <DashboardLayout currentPage="settings">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout currentPage="settings">
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account and application preferences</p>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-600 dark:text-green-400">Settings saved successfully!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <Card className="lg:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.profile_picture || undefined} alt={profile.name} />
                  <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Change Photo
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college">College/University</Label>
                  <Input
                    id="college"
                    value={profile.college}
                    disabled
                    className="bg-muted border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Input
                    id="program"
                    value={profile.program}
                    onChange={(e) => setProfile({ ...profile, program: e.target.value })}
                    placeholder="e.g., Computer Science Engineering"
                    className="border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Current Semester</Label>
                  <Select
                    value={profile.semester.toString()}
                    onValueChange={(value) => setProfile({ ...profile, semester: parseInt(value) })}
                  >
                    <SelectTrigger id="semester" className="border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="w-full p-3 border border-input rounded-md resize-none h-24 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-muted-foreground">
                  Brief description for your profile. Maximum 500 characters.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailNotifications: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, pushNotifications: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="assignment-reminders">Assignment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminded about upcoming deadlines</p>
                </div>
                <Switch
                  id="assignment-reminders"
                  checked={settings.notifications.assignmentReminders}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, assignmentReminders: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="goal-updates">Goal Progress Updates</Label>
                  <p className="text-sm text-muted-foreground">Updates on your learning goals</p>
                </div>
                <Switch
                  id="goal-updates"
                  checked={settings.notifications.goalUpdates}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, goalUpdates: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-reports">Weekly Progress Reports</Label>
                  <p className="text-sm text-muted-foreground">Weekly summary of your activities</p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={settings.notifications.weeklyReports}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, weeklyReports: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="course-updates">Course Updates</Label>
                  <p className="text-sm text-muted-foreground">New materials and announcements</p>
                </div>
                <Switch
                  id="course-updates"
                  checked={settings.notifications.courseUpdates}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, courseUpdates: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Control your privacy and data sharing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-visibility">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible to other students</p>
                </div>
                <Switch
                  id="profile-visibility"
                  checked={settings.privacy.profileVisibility}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, profileVisibility: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="progress-sharing">Share Progress</Label>
                  <p className="text-sm text-muted-foreground">Allow others to see your learning progress</p>
                </div>
                <Switch
                  id="progress-sharing"
                  checked={settings.privacy.progressSharing}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, progressSharing: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics">Analytics & Insights</Label>
                  <p className="text-sm text-muted-foreground">Help improve the platform with usage data</p>
                </div>
                <Switch
                  id="analytics"
                  checked={settings.privacy.analyticsOptIn}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, analyticsOptIn: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" className="border-input">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme or use system setting to match your device
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.preferences.language}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, language: value }
                    })
                  }
                >
                  <SelectTrigger id="language" className="border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="es">Español (Spanish)</SelectItem>
                    <SelectItem value="fr">Français (French)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.preferences.timezone}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, timezone: value }
                    })
                  }
                >
                  <SelectTrigger id="timezone" className="border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">IST (Asia/Kolkata)</SelectItem>
                    <SelectItem value="America/New_York">EST (New York)</SelectItem>
                    <SelectItem value="America/Los_Angeles">PST (Los Angeles)</SelectItem>
                    <SelectItem value="Europe/London">GMT (London)</SelectItem>
                    <SelectItem value="Asia/Tokyo">JST (Tokyo)</SelectItem>
                    <SelectItem value="Australia/Sydney">AEDT (Sydney)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="lg:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    const confirmEmail = prompt("⚠️ To confirm, please type your registered email:")

                    if (!confirmEmail) {
                      alert("Deletion cancelled.")
                      return
                    }

                    const confirmAction = confirm(
                      "Are you absolutely sure? This will permanently delete your account."
                    )

                    if (!confirmAction) return

                    try {
                      const res = await fetch("/api/settings/delete-account", {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ confirmEmail }),
                      })

                      const data = await res.json()

                      if (!res.ok) {
                        alert(`❌ Error: ${data.error || data.message || "Something went wrong"}`)
                        return
                      }

                      alert("✅ Account deleted successfully. You will now be logged out.")
                      window.location.href = "/login" // Redirect to login or landing page
                    } catch (error: any) {
                      console.error("Error deleting account:", error)
                      alert("❌ Failed to delete account. Please try again.")
                    }
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}