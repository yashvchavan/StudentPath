"use client"

import { useEffect, useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Save,
  Upload,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Award,
  Users,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface CollegeSettings {
  college_name: string
  email: string
  phone: string
  country: string
  state: string
  city: string
  address: string
  website: string
  established_year: number
  college_type: string
  accreditation: string
  contact_person: string
  contact_person_email: string
  contact_person_phone: string
  total_students: number
  logo_url: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<CollegeSettings>({
    college_name: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    address: "",
    website: "",
    established_year: new Date().getFullYear(),
    college_type: "",
    accreditation: "",
    contact_person: "",
    contact_person_email: "",
    contact_person_phone: "",
    total_students: 0,
    logo_url: ""
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        // Convert all null values to empty strings
        const cleanedSettings = {
          college_name: data.settings.college_name || "",
          email: data.settings.email || "",
          phone: data.settings.phone || "",
          country: data.settings.country || "",
          state: data.settings.state || "",
          city: data.settings.city || "",
          address: data.settings.address || "",
          website: data.settings.website || "",
          established_year: data.settings.established_year || new Date().getFullYear(),
          college_type: data.settings.college_type || "",
          accreditation: data.settings.accreditation || "",
          contact_person: data.settings.contact_person || "",
          contact_person_email: data.settings.contact_person_email || "",
          contact_person_phone: data.settings.contact_person_phone || "",
          total_students: data.settings.total_students || 0,
          logo_url: data.settings.logo_url || ""
        }
        setSettings(cleanedSettings)
        if (cleanedSettings.logo_url) {
          setLogoPreview(cleanedSettings.logo_url)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 2MB' })
      return
    }

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('logo', file)

    try {
      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const data = await res.json()
      if (data.success) {
        setLogoPreview(data.logoUrl)
        setSettings(prev => ({ ...prev, logo_url: data.logoUrl }))
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' })

        // Trigger a soft reload to update the sidebar
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload logo' })
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      setMessage({ type: 'error', text: 'Failed to upload logo' })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        // Refresh the page data to update sidebar
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminShell title="College Settings" description="Manage your institution's information and branding">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell title="College Settings" description="Manage your institution's information and branding">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Message Alert */}
        {message && (
          <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-red-50 border-red-200 dark:bg-red-950/20'}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* College Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              College Logo
            </CardTitle>
            <CardDescription>
              Upload your institution's logo. This will be displayed in the sidebar and throughout the portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="College Logo"
                      width={128}
                      height={128}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-400 transition-colors">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG or SVG (max. 2MB)
                      </p>
                    </div>
                  </div>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </Label>
                {uploadingLogo && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading logo...
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              General information about your institution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="college_name">College Name *</Label>
                <Input
                  id="college_name"
                  value={settings.college_name}
                  onChange={(e) => setSettings({ ...settings, college_name: e.target.value })}
                  placeholder="Enter college name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Official Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="pl-10"
                    placeholder="admin@college.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="pl-10"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    className="pl-10"
                    placeholder="https://www.college.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="established_year">Established Year</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="established_year"
                    type="number"
                    value={settings.established_year}
                    onChange={(e) => setSettings({ ...settings, established_year: parseInt(e.target.value) })}
                    className="pl-10"
                    placeholder="2000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="college_type">College Type</Label>
                <Select
                  value={settings.college_type}
                  onValueChange={(value) => setSettings({ ...settings, college_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="University">University</SelectItem>
                    <SelectItem value="Engineering College">Engineering College</SelectItem>
                    <SelectItem value="Medical College">Medical College</SelectItem>
                    <SelectItem value="Arts & Science">Arts & Science</SelectItem>
                    <SelectItem value="Management Institute">Management Institute</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accreditation">Accreditation</Label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="accreditation"
                    value={settings.accreditation}
                    onChange={(e) => setSettings({ ...settings, accreditation: e.target.value })}
                    className="pl-10"
                    placeholder="NAAC A+, NBA, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_students">Total Students</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="total_students"
                    type="number"
                    value={settings.total_students}
                    onChange={(e) => setSettings({ ...settings, total_students: parseInt(e.target.value) })}
                    className="pl-10"
                    placeholder="5000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location Information
            </CardTitle>
            <CardDescription>
              Physical address and location details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={settings.country}
                  onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                  placeholder="India"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  placeholder="Maharashtra"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  placeholder="Mumbai"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Enter complete address"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Primary Contact Person
            </CardTitle>
            <CardDescription>
              Main point of contact for administrative matters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Name</Label>
                <Input
                  id="contact_person"
                  value={settings.contact_person}
                  onChange={(e) => setSettings({ ...settings, contact_person: e.target.value })}
                  placeholder="Dr. John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_email">Email</Label>
                <Input
                  id="contact_person_email"
                  type="email"
                  value={settings.contact_person_email}
                  onChange={(e) => setSettings({ ...settings, contact_person_email: e.target.value })}
                  placeholder="john.doe@college.edu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_phone">Phone</Label>
                <Input
                  id="contact_person_phone"
                  value={settings.contact_person_phone}
                  onChange={(e) => setSettings({ ...settings, contact_person_phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => fetchSettings()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminShell>
  )
}
