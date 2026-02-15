"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    MapPin,
    Mail,
    Phone,
    Calendar,
    GraduationCap,
    BookOpen,
    Target,
    Globe,
    Briefcase,
    Award,
    Clock,
    User
} from "lucide-react"

interface StudentProfile {
    student_id: number
    name: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    college?: string
    college_details?: any
    program?: string
    department?: string
    current_year?: number
    semester?: number
    current_gpa?: number
    enrollment_year?: number
    gender?: string
    date_of_birth?: string
    country?: string
    bio?: string
    profile_picture?: string | null
    academic_interests?: string
    technical_skills?: string
    soft_skills?: string
    language_skills?: string
    primary_goal?: string
    secondary_goal?: string
    timeline?: string
    location_preference?: string
    industry_focus?: string
    intensity_level?: string
    role?: string
    status?: string
    is_active?: number
    created_at?: string
    updated_at?: string
}

interface ProfileModalProps {
    student: StudentProfile | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProfileModal({ student, open, onOpenChange }: ProfileModalProps) {
    if (!student) return null

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Not specified"
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const parseSkills = (skills?: string) => {
        if (!skills) return []
        try {
            // Handle if it's a JSON string or comma-separated
            if (skills.startsWith("{") || skills.startsWith("[")) {
                const parsed = JSON.parse(skills)
                if (Array.isArray(parsed)) return parsed
                if (typeof parsed === 'object') return Object.keys(parsed)
                return []
            }
            return skills.split(",").map(s => s.trim()).filter(Boolean)
        } catch (e) {
            return skills.split(",").map(s => s.trim()).filter(Boolean)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-background">
                <DialogTitle className="sr-only">Student Profile</DialogTitle>
                <ScrollArea className="max-h-[90vh]">
                    {/* Header Section with Cover-like background */}
                    <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/5">
                        <div className="absolute -bottom-12 left-8 flex items-end gap-4">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                                <AvatarImage src={student.profile_picture || ""} alt={student.name} />
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {getInitials(student.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="mb-2">
                                <h2 className="text-2xl font-bold text-foreground">{student.name}</h2>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary" className="capitalize">
                                        {student.role || "Student"}
                                    </Badge>
                                    <Badge variant={student.status?.toLowerCase() === 'active' ? "default" : "outline"}>
                                        {student.status || "Active"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 px-8 pb-8 space-y-8">
                        {/* Personal Information */}
                        <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                                <User className="w-5 h-5" /> Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> Email
                                    </p>
                                    <p className="font-medium">{student.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> Phone
                                    </p>
                                    <p className="font-medium">{student.phone || "Not specified"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Date of Birth
                                    </p>
                                    <p className="font-medium">{formatDate(student.date_of_birth)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="w-4 h-4" /> Gender
                                    </p>
                                    <p className="font-medium capitalize">{student.gender || "Not specified"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Country
                                    </p>
                                    <p className="font-medium">{student.country || "Not specified"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Location Preference
                                    </p>
                                    <p className="font-medium">{student.location_preference || "Flexible"}</p>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Academic Information */}
                        <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                                <GraduationCap className="w-5 h-5" /> Academic Profile
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-4 rounded-lg">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">College / University</p>
                                    <p className="font-medium text-lg">{student.college}</p>
                                    {student.college_details && (
                                        <p className="text-xs text-muted-foreground">{student.college_details.location}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Program</p>
                                        <p className="font-medium">{student.program || "Not specified"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Department</p>
                                        <p className="font-medium">{student.department || "Not specified"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Current Status</p>
                                        <p className="font-medium">
                                            Year {student.current_year} • Semester {student.semester}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">GPA</p>
                                        <p className="font-medium text-primary text-lg">
                                            {student.current_gpa ? Number(student.current_gpa).toFixed(2) : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Career Goals & Interests */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                                    <Target className="w-5 h-5" /> Career Goals
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-3 bg-card border rounded-md shadow-sm">
                                        <p className="text-sm text-muted-foreground mb-1">Primary Goal</p>
                                        <p className="font-medium">{student.primary_goal || "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-card border rounded-md shadow-sm">
                                        <p className="text-sm text-muted-foreground mb-1">Secondary Goal</p>
                                        <p className="font-medium">{student.secondary_goal || "Not set"}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Timeline
                                            </p>
                                            <p className="font-medium">{student.timeline || "Not specified"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Award className="w-3 h-3" /> Intensity
                                            </p>
                                            <p className="font-medium capitalize">{student.intensity_level || "Normal"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                                    <Briefcase className="w-5 h-5" /> Skills & Focus
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Industry Focus</p>
                                        <div className="flex flex-wrap gap-2">
                                            {parseSkills(student.industry_focus).map((skill, i) => (
                                                <Badge key={i} variant="outline" className="bg-primary/5">
                                                    {skill}
                                                </Badge>
                                            ))}
                                            {parseSkills(student.industry_focus).length === 0 && <span className="text-muted-foreground text-sm">None selected</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Technical Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {parseSkills(student.technical_skills).map((skill, i) => (
                                                <Badge key={i} variant="secondary">
                                                    {skill}
                                                </Badge>
                                            ))}
                                            {parseSkills(student.technical_skills).length === 0 && <span className="text-muted-foreground text-sm">None listed</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Soft Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {parseSkills(student.soft_skills).map((skill, i) => (
                                                <Badge key={i} variant="outline">
                                                    {skill}
                                                </Badge>
                                            ))}
                                            {parseSkills(student.soft_skills).length === 0 && <span className="text-muted-foreground text-sm">None listed</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Academic Interests */}
                        <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                                <BookOpen className="w-5 h-5" /> Academic Interests
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {student.academic_interests || "No academic interests specified."}
                            </p>
                        </section>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
