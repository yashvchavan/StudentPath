"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminProfileProvider } from "@/contexts/AdminProfileContext"
import { useAuth } from "@/hooks/use-auth"

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
    const { isAuthenticated, isLoading, role } = useAuth()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated && role === 'college') {
                setIsAuthorized(true)
            } else if (isAuthenticated) {
                // Logged in but not college - redirect to appropriate dashboard
                console.log(`User is ${role}, redirecting from admin`)
                if (role === 'student') router.push('/dashboard')
                else if (role === 'professional') router.push('/professional-dashboard')
            } else {
                // Not logged in
                console.log("No valid session, redirecting to college login")
                router.push('/college-login')
            }
        }
    }, [isAuthenticated, isLoading, role, router])

    if (isLoading || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Validating access...</p>
                </div>
            </div>
        )
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
