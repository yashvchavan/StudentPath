import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "StudentPath — Where Knowledge Meets Success",
  description:
    "AI-powered educational platform with personalized career paths, skill intelligence, and expert guidance. Join thousands of students transforming their academic journey.",
  keywords: ["education", "AI career planning", "student platform", "career guidance", "skill development"],
  authors: [{ name: "StudentPath Team" }],
  openGraph: {
    title: "StudentPath — Where Knowledge Meets Success",
    description:
      "AI-powered educational platform for students, colleges, and professionals. Personalized career paths, skill analytics, and expert mentorship.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          storageKey="studentpath-theme"
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
