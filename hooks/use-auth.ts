import { useState, useEffect } from 'react';

export type UserRole = 'student' | 'college' | 'professional' | null;

export interface User {
    id: number | string;
    role: UserRole;
    name: string;
    email: string;
    logo_url?: string;
    college_id?: number;
}

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    role: UserRole;
}

export function useAuth() {
    const [auth, setAuth] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        role: null
    });

    useEffect(() => {
        let mounted = true;

        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (mounted) {
                        if (data.authenticated && data.user) {
                            setAuth({
                                isAuthenticated: true,
                                isLoading: false,
                                user: data.user,
                                role: data.user.role
                            });
                        } else {
                            setAuth({
                                isAuthenticated: false,
                                isLoading: false,
                                user: null,
                                role: null
                            });
                        }
                    }
                } else {
                    if (mounted) {
                        setAuth({
                            isAuthenticated: false,
                            isLoading: false,
                            user: null,
                            role: null
                        });
                    }
                }
            } catch (error) {
                if (mounted) {
                    setAuth({
                        isAuthenticated: false,
                        isLoading: false,
                        user: null,
                        role: null
                    });
                }
            }
        }

        checkAuth();

        return () => { mounted = false; };
    }, []);

    return auth;
}
