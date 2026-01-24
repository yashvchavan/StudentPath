"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminProfileProvider } from "@/contexts/AdminProfileContext"

// Helper function to safely parse JSON
function safeJsonParse(str: string): any {
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}

function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isValidating, setIsValidating] = useState(true)
    const [isValid, setIsValid] = useState(false)

    useEffect(() => {
        const validateCollegeAccess = () => {
            try {
                // Check for collegeData cookie first
                const collegeDataCookie = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("collegeData="))

                if (collegeDataCookie) {
                    const collegeData = safeJsonParse(collegeDataCookie.split("=")[1])
                    if (collegeData && (collegeData.token || collegeData.id)) {
                        console.log("Valid college session found")
                        setIsValid(true)
                        setIsValidating(false)
                        return
                    }
                }

                // Check localStorage as backup
                const localCollegeData = localStorage.getItem('collegeData')
                if (localCollegeData) {
                    const collegeData = safeJsonParse(localCollegeData)
                    if (collegeData && (collegeData.token || collegeData.id)) {
                        console.log("Valid college session found in localStorage")
                        setIsValid(true)
                        setIsValidating(false)
                        return
                    }
                }

                // Check if studentData cookie exists with wrong userType
                const studentDataCookie = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("studentData="))

                if (studentDataCookie) {
                    const studentData = safeJsonParse(decodeURIComponent(studentDataCookie.split("=")[1]))
                    if (studentData) {
                        // Redirect to appropriate dashboard based on userType
                        if (studentData.userType === 'student' || studentData.student_id) {
                            console.log("Student trying to access admin, redirecting to dashboard")
                            router.push('/dashboard')
                            return
                        } else if (studentData.userType === 'professional') {
                            console.log("Professional trying to access admin, redirecting to professional dashboard")
                            router.push('/professional-dashboard')
                            return
                        }
                    }
                }

                // No valid session, redirect to college login
                console.log("No valid college session, redirecting to login")
                router.push('/college-login')
            } catch (error) {
                console.error("Error validating college access:", error)
                router.push('/college-login')
            }
        }

        validateCollegeAccess()
    }, [router])

    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Validating access...</p>
                </div>
            </div>
        )
    }

    if (!isValid) {
        return null // Will redirect in useEffect
    }

    return <>{children}</>
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AdminAuthWrapper>
            <AdminProfileProvider>{children}</AdminProfileProvider>
        </AdminAuthWrapper>
    )
}
