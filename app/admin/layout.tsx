"use client"

import { AdminProfileProvider } from "@/contexts/AdminProfileContext"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AdminProfileProvider>{children}</AdminProfileProvider>
}
