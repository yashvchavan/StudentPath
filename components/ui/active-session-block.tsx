"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, GraduationCap, Briefcase, Building, LogOut, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserRole = 'student' | 'professional' | 'college' | null;

interface ActiveSession {
    role: UserRole;
    name?: string;
    email?: string;
}

// Parse cookies and detect active session
function getActiveSession(): ActiveSession | null {
    if (typeof window === 'undefined') return null;

    try {
        // Check for professional session (from new professionalData cookie)
        const professionalDataMatch = document.cookie.match(/professionalData=([^;]+)/);
        if (professionalDataMatch) {
            const decoded = decodeURIComponent(professionalDataMatch[1]);
            const data = JSON.parse(decoded);

            if (data.isAuthenticated && data.timestamp) {
                const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;
                if (!isExpired) {
                    return {
                        role: 'professional',
                        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || undefined,
                        email: data.email
                    };
                }
            }
        } else {
            // Only check for student/professional session (from studentData cookie - legacy or student) if no professionalData
            const studentDataMatch = document.cookie.match(/studentData=([^;]+)/);
            if (studentDataMatch) {
                const decoded = decodeURIComponent(studentDataMatch[1]);
                const data = JSON.parse(decoded);

                if (data.isAuthenticated && data.timestamp) {
                    // Check if not expired (24 hours)
                    const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;
                    if (!isExpired) {
                        // Determine if student or professional - STRICT check
                        // If it's a legacy cookie and says professional, we trust it IF professionalData cookie was absent
                        if (data.userType === 'professional') {
                            return {
                                role: 'professional',
                                name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || undefined,
                                email: data.email
                            };
                        }
                        // Otherwise assume student
                        if (data.userType === 'student' || data.student_id) {
                            return {
                                role: 'student',
                                name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || undefined,
                                email: data.email
                            };
                        }
                    }
                }
            }
        }

        // Check for college session (from collegeData cookie)
        const collegeDataMatch = document.cookie.match(/collegeData=([^;]+)/);
        if (collegeDataMatch) {
            const decoded = decodeURIComponent(collegeDataMatch[1]);
            const data = JSON.parse(decoded);

            if ((data.token || data.id) && data.type === 'college') {
                // Check expiration if timestamp exists
                if (data.timestamp) {
                    const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;
                    if (isExpired) return null;
                }
                return {
                    role: 'college',
                    name: data.name,
                    email: data.email
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error parsing session data:', error);
        return null;
    }
}

// Get role display info
function getRoleInfo(role: UserRole) {
    switch (role) {
        case 'student':
            return {
                label: 'Student',
                icon: GraduationCap,
                dashboardUrl: '/dashboard',
                color: 'from-indigo-500 to-purple-600',
                borderColor: 'border-indigo-500/30',
                bgGradient: 'from-indigo-500/10 to-purple-500/5',
                textColor: 'text-indigo-400'
            };
        case 'professional':
            return {
                label: 'Professional',
                icon: Briefcase,
                dashboardUrl: '/professional-dashboard',
                color: 'from-yellow-500 to-orange-600',
                borderColor: 'border-yellow-500/30',
                bgGradient: 'from-yellow-500/10 to-orange-500/5',
                textColor: 'text-yellow-400'
            };
        case 'college':
            return {
                label: 'College Admin',
                icon: Building,
                dashboardUrl: '/admin',
                color: 'from-green-500 to-emerald-600',
                borderColor: 'border-green-500/30',
                bgGradient: 'from-green-500/10 to-emerald-500/5',
                textColor: 'text-green-400'
            };
        default:
            return null;
    }
}

interface ActiveSessionBlockProps {
    intendedRole: 'student' | 'professional' | 'college';
    pageName?: string; // e.g., "Student Login", "Professional Registration"
}

export function ActiveSessionBlock({ intendedRole, pageName }: ActiveSessionBlockProps) {
    const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const session = getActiveSession();
        setActiveSession(session);
        setIsLoading(false);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);

        // Clear all auth cookies
        document.cookie = "professionalData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
        document.cookie = "studentData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
        document.cookie = "collegeData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";

        // Clear localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('collegeData');
            localStorage.removeItem('studentData');
            localStorage.removeItem('professionalData');
        }

        // Small delay to ensure cookies are cleared
        await new Promise(resolve => setTimeout(resolve, 100));

        // Reload the page to show the login form
        window.location.reload();
    };

    // If still loading, return null
    if (isLoading) {
        return null;
    }

    // If no active session, or same role as intended, allow access
    if (!activeSession || activeSession.role === intendedRole) {
        return null;
    }

    // Active session with different role - BLOCK access!
    const roleInfo = getRoleInfo(activeSession.role);
    if (!roleInfo) return null;

    const RoleIcon = roleInfo.icon;

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            {/* Animated background */}
            <div className="fixed inset-0 z-0">
                <div className={`absolute inset-0 bg-gradient-to-br ${roleInfo.bgGradient} opacity-50`} />
                <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/50 to-black" />
            </div>

            <Card className={`relative z-10 max-w-md w-full shadow-2xl backdrop-blur-xl border bg-gradient-to-br ${roleInfo.bgGradient} ${roleInfo.borderColor}`}>
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                        <div className={`w-20 h-20 bg-gradient-to-br ${roleInfo.color} rounded-2xl flex items-center justify-center shadow-2xl`}>
                            <RoleIcon className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-400 font-medium text-sm">Active Session Detected</span>
                    </div>

                    <CardTitle className="text-2xl font-bold text-white mb-2">
                        Already Logged In
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-base">
                        You are currently logged in as a <strong className={roleInfo.textColor}>{roleInfo.label}</strong>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Session Info */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${roleInfo.color} rounded-xl flex items-center justify-center`}>
                                <RoleIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold truncate">
                                    {activeSession.name || roleInfo.label}
                                </p>
                                {activeSession.email && (
                                    <p className="text-gray-400 text-sm truncate">{activeSession.email}</p>
                                )}
                                <p className={`text-xs ${roleInfo.textColor}`}>
                                    Logged in as {roleInfo.label}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="text-center">
                        <p className="text-gray-300 text-sm leading-relaxed">
                            To access the <strong className="text-white">{pageName || 'login page'}</strong>, please logout from your current session first.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={`w-full font-semibold py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-300 shadow-lg`}
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            {isLoggingOut ? 'Logging out...' : 'Logout & Continue'}
                        </Button>

                        <Button
                            onClick={() => router.push(roleInfo.dashboardUrl)}
                            variant="outline"
                            className={`w-full font-semibold py-3 rounded-xl bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-300`}
                        >
                            <RoleIcon className="w-5 h-5 mr-2" />
                            Go to {roleInfo.label} Dashboard
                        </Button>
                    </div>

                    {/* Info text */}
                    <p className="text-center text-gray-500 text-xs">
                        For security, only one active role is allowed per browser session.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

// Hook to check if session is blocked
export function useSessionBlock(intendedRole: 'student' | 'professional' | 'college') {
    const [isBlocked, setIsBlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeRole, setActiveRole] = useState<UserRole>(null);

    useEffect(() => {
        const session = getActiveSession();
        if (session && session.role !== intendedRole) {
            setIsBlocked(true);
            setActiveRole(session.role);
        } else {
            setIsBlocked(false);
            setActiveRole(null);
        }
        setIsLoading(false);
    }, [intendedRole]);

    return { isBlocked, isLoading, activeRole };
}

export default ActiveSessionBlock;
