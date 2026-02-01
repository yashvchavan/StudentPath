"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type AdminProfile = {
    id?: number | string
    name?: string | null
    email?: string | null
    token?: string | null
    logo_url?: string | null
}

type AdminProfileContextType = {
    adminProfile: AdminProfile | null
    setAdminProfile: (profile: AdminProfile | null) => void
    isLoading: boolean
}

const AdminProfileContext = createContext<AdminProfileContextType | undefined>(undefined)

const STORAGE_KEY = "admin_profile_cache"
const FETCH_FLAG_KEY = "admin_profile_fetching"

export function AdminProfileProvider({ children }: { children: ReactNode }) {
    // Start with null to match server-side rendering
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    // Function to fetch profile from API
    const fetchProfileFromAPI = async () => {
        // Check if another instance is already fetching
        if (typeof window !== "undefined") {
            const isFetching = sessionStorage.getItem(FETCH_FLAG_KEY)
            if (isFetching === "true") {
                console.log("⏳ Another instance is fetching, waiting...")
                // Poll for the result
                const checkInterval = setInterval(() => {
                    const cached = localStorage.getItem(STORAGE_KEY)
                    if (cached) {
                        try {
                            const profile = JSON.parse(cached)
                            console.log("✅ Received profile from other instance")
                            setAdminProfile(profile)
                            setIsLoading(false)
                            clearInterval(checkInterval)
                        } catch (err) {
                            console.error("Failed to parse profile:", err)
                        }
                    }
                }, 100)

                // Clear interval after 5 seconds
                setTimeout(() => clearInterval(checkInterval), 5000)
                return
            }
        }

        // Start fetching
        if (typeof window !== "undefined") {
            sessionStorage.setItem(FETCH_FLAG_KEY, "true")
        }

        console.log("🔄 Fetching admin profile from API...")

        try {
            const res = await fetch("/api/auth/me")
            if (!res.ok) {
                setIsLoading(false)
                return
            }
            const data = await res.json()
            console.log("✅ Admin profile fetched from API:", data)

            if (data?.authenticated && data.user && data.user.role === 'college') {
                const profile = data.user
                setAdminProfile(profile)

                // Save to localStorage
                if (typeof window !== "undefined") {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
                }
            }
        } catch (err) {
            console.error("❌ Failed to fetch admin profile:", err)
        } finally {
            setIsLoading(false)
            if (typeof window !== "undefined") {
                sessionStorage.removeItem(FETCH_FLAG_KEY)
            }
        }
    }

    // Load from localStorage after mount to avoid hydration mismatch
    useEffect(() => {
        setIsMounted(true)

        if (typeof window !== "undefined") {
            try {
                const cached = localStorage.getItem(STORAGE_KEY)
                if (cached) {
                    const profile = JSON.parse(cached)
                    console.log("✅ Loaded admin profile from localStorage")
                    setAdminProfile(profile)
                    setIsLoading(false)
                    return
                }
            } catch (err) {
                console.error("Failed to parse cached profile:", err)
                localStorage.removeItem(STORAGE_KEY)
            }
        }

        // If no cache, proceed to fetch
        fetchProfileFromAPI()
    }, [])

    // Custom setter that also updates localStorage
    const updateAdminProfile = (profile: AdminProfile | null) => {
        setAdminProfile(profile)
        if (typeof window !== "undefined") {
            if (profile) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
            } else {
                localStorage.removeItem(STORAGE_KEY)
            }
        }
    }

    return (
        <AdminProfileContext.Provider value={{ adminProfile, setAdminProfile: updateAdminProfile, isLoading }}>
            {children}
        </AdminProfileContext.Provider>
    )
}

export function useAdminProfile() {
    const context = useContext(AdminProfileContext)
    if (context === undefined) {
        throw new Error("useAdminProfile must be used within AdminProfileProvider")
    }
    return context
}

// Export function to clear cache (useful for logout)
export function clearAdminProfileCache() {
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(FETCH_FLAG_KEY)
    }
}
