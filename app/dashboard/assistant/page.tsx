"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bot, Send, Lightbulb, BookOpen, Target, Sparkles, Loader2, AlertCircle, Plus, Trash2, MoreVertical, History, GraduationCap
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface Conversation {
  id: number
  title: string
  created_at: string
  updated_at: string
}

interface Course {
  id: number
  course_name: string
  year: string
  syllab_doc: string
}

interface StudentData {
  student_id?: number
  id?: number
  first_name: string
  last_name: string
  email: string
  token: string
  isAuthenticated: boolean
  isAdmin: boolean
}

// Helper function to get student data from cookies
function getStudentDataFromCookie(): StudentData | null {
  if (typeof window === 'undefined') return null

  const cookies = document.cookie.split(';')
  const studentCookie = cookies.find(cookie => cookie.trim().startsWith('studentData='))

  if (!studentCookie) return null

  try {
    const cookieValue = studentCookie.split('=')[1]
    const decodedValue = decodeURIComponent(cookieValue)
    return JSON.parse(decodedValue)
  } catch (error) {
    console.error('Error parsing student cookie:', error)
    return null
  }
}

export default function AIAssistantPage() {
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [userType, setUserType] = useState<"student" | "professional">("student")

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Syllabus extraction states
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const [extractYear, setExtractYear] = useState("")
  const [extractSemester, setExtractSemester] = useState("")
  const [extracting, setExtracting] = useState(false)
  const [syllabusInfo, setSyllabusInfo] = useState<string>("")
  const [showSyllabusPanel, setShowSyllabusPanel] = useState(false)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load user data from cookie on mount
  useEffect(() => {
    const data = getStudentDataFromCookie()

    if (!data || !data.isAuthenticated) {
      setError("Not authenticated. Please login.")
      return
    }

    setStudentData(data)
    // Use student_id for students, id for professionals
    const id = data.student_id || data.id
    if (id) {
      setUserId(id)
      console.log("Logged in user ID:", id)
    } else {
      setError("User ID not found in session")
    }
  }, [])

  // Load conversations and courses after userId is set
  useEffect(() => {
    if (userId) {
      loadConversations()
      fetchCourses()
      fetchSyllabusInfo()

      // Show welcome message for new users
      if (messages.length === 0) {
        setMessages([{
          id: Date.now(),
          role: "assistant",
          content: `Hi ${studentData?.first_name || "there"} — I'm your AI learning assistant. How can I help you today?`,
          created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }])
      }
    }
  }, [userId])

  // Fetch available courses
  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses", { credentials: "include" })
      const data = await res.json()
      if (data.courses) setCourses(data.courses)
    } catch (err) {
      console.error("Error fetching courses:", err)
    }
  }

  // Fetch existing syllabus info
  const fetchSyllabusInfo = async () => {
    try {
      const res = await fetch("/api/extract-syllabus", {
        method: "GET",
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.user_info) {
          setSyllabusInfo(data.user_info)
        }
      }
    } catch (err) {
      console.error("Error fetching syllabus info:", err)
    }
  }

  // Extract syllabus
  const handleExtractSyllabus = async () => {
    if (!selectedCourse || !extractYear || !extractSemester) {
      alert("Please select course, year, and semester")
      return
    }

    setExtracting(true)
    try {
      const res = await fetch("/api/extract-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: selectedCourse,
          year: extractYear,
          semester: extractSemester,
        }),
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSyllabusInfo(data.user_info)
        alert(`✅ Syllabus extracted successfully!\n\nSubjects found: ${data.subjects_till_semester?.length || 0}\nSemesters parsed: ${data.total_semesters_parsed}`)
        setShowSyllabusPanel(false)
      } else {
        alert(`Error: ${data.error || "Failed to extract syllabus"}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to extract syllabus. Make sure Flask server is running.")
    } finally {
      setExtracting(false)
    }
  }

  const loadConversations = async () => {
    if (!userId) return

    try {
      setIsLoadingConversations(true)
      const response = await fetch(`/api/chat/conversations?userId=${userId}&userType=${userType}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load conversations')
      }
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err: any) {
      console.error('Error loading conversations:', err)
      setError(err.message || 'Failed to load conversations')
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const loadConversation = async (conversationId: number) => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/chat/conversations/${conversationId}?userId=${userId}&userType=${userType}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load conversation')
      }
      const data = await response.json()
      setMessages(data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })))
      setCurrentConversationId(conversationId)
    } catch (err: any) {
      console.error('Error loading conversation:', err)
      setError(err.message || 'Failed to load conversation')
    } finally {
      setIsLoading(false)
    }
  }

  const startNewConversation = () => {
    setCurrentConversationId(null)
    setError(null)
    setMessages([{
      id: Date.now(),
      role: "assistant",
      content: `Hi ${studentData?.first_name || "there"} — I'm your AI learning assistant. How can I help you today?`,
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }])
  }

  const deleteConversation = async (conversationId: number, e?: React.MouseEvent) => {
    if (!userId) return
    if (e) e.stopPropagation()
    if (!confirm('Are you sure you want to delete this conversation?')) return

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete conversation')
      }

      setConversations(prev => prev.filter(c => c.id !== conversationId))
      if (currentConversationId === conversationId) {
        startNewConversation()
      }
    } catch (err: any) {
      console.error('Error deleting conversation:', err)
      setError(err.message || 'Failed to delete conversation')
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || !userId) return

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: message.trim(),
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages(prev => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: currentConversationId,
          userId,
          userType,
          syllabusContext: syllabusInfo, // Include syllabus info in context
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.message,
        created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages(prev => [...prev, assistantMessage])

      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId)
        await loadConversations()
      }
    } catch (err: any) {
      console.error("Chat error:", err)
      setError(err.message || "Failed to send message. Please try again.")
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "I encountered an error processing your request. Please try again or rephrase your question.",
        created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessageContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="font-bold text-lg mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>
      }
      if (line.includes('**')) {
        const parts = line.split('**')
        return <p key={i} className="mb-2 text-base leading-7">{parts.map((part, j) => j % 2 === 0 ? part : <strong key={j}>{part}</strong>)}</p>
      }
      if (/^\s*[-•]/.test(line)) {
        return <li key={i} className="ml-5 mb-1.5 text-base leading-7">{line.replace(/^[-•]\s*/, '')}</li>
      }
      if (/^\d+\./.test(line.trim())) {
        return <li key={i} className="ml-5 mb-1.5 text-base leading-7 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>
      }
      if (line.includes('http')) {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const parts = line.split(urlRegex)
        return <p key={i} className="mb-2 text-base leading-7">{parts.map((part, j) =>
          urlRegex.test(part)
            ? <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline break-all">{part}</a>
            : part
        )}</p>
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2"></div>
      }
      return <p key={i} className="mb-2 text-base leading-7">{line}</p>
    })
  }

  // Show loading or error state if user not authenticated
  if (!userId) {
    return (
      <DashboardLayout currentPage="assistant">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Card className="p-6 max-w-md">
            <CardContent className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-lg font-medium">{error || "Loading user data..."}</p>
              {error && (
                <Button onClick={() => window.location.href = '/login'}>
                  Go to Login
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout currentPage="assistant">
      <div className="w-full mx-auto p-3 md:p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">

        {/* Syllabus Context Info Banner */}
        {syllabusInfo && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Your Syllabus Context</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSyllabusPanel(true)}
                >
                  Update Syllabus
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{syllabusInfo}</p>
            </CardContent>
          </Card>
        )}

        {/* Syllabus Extraction Panel */}
        {showSyllabusPanel && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Extract Your Syllabus</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSyllabusPanel(false)}
                >
                  ✕
                </Button>
              </div>
              <CardDescription>
                Select your course and current semester to extract relevant subjects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Course</label>
                  <Select onValueChange={(val) => setSelectedCourse(parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.course_name} ({course.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Current Year</label>
                  <Select onValueChange={setExtractYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First">First Year</SelectItem>
                      <SelectItem value="Second">Second Year</SelectItem>
                      <SelectItem value="Third">Third Year</SelectItem>
                      <SelectItem value="Fourth">Fourth Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Current Semester</label>
                  <Select onValueChange={setExtractSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {["I", "II", "III", "IV", "V", "VI", "VII", "VIII"].map((sem) => (
                        <SelectItem key={sem} value={sem}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleExtractSyllabus}
                disabled={extracting || !selectedCourse || !extractYear || !extractSemester}
                className="w-full"
              >
                {extracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting Syllabus...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Extract Syllabus
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {!syllabusInfo && !showSyllabusPanel && (
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium">Extract your syllabus for personalized guidance</p>
                  <p className="text-sm text-muted-foreground">Get recommendations based on your current subjects</p>
                </div>
              </div>
              <Button onClick={() => setShowSyllabusPanel(true)}>
                Setup Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
              className="h-7 text-xs"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar - Conversations */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-140px)] flex flex-col shadow-lg border-0">
              <CardHeader className="pb-3 px-4 py-3 bg-gradient-to-b from-background to-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Chats
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startNewConversation}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-3">
                    {isLoadingConversations ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-8 px-2">
                        <p className="text-sm text-muted-foreground mb-1">No conversations yet</p>
                        <p className="text-xs text-muted-foreground">Start chatting!</p>
                      </div>
                    ) : (
                      <>
                        {conversations.map((conv) => (
                          <div
                            key={conv.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Open conversation ${conv.title}`}
                            onClick={() => loadConversation(conv.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') loadConversation(conv.id)
                              if (e.key === 'Delete') deleteConversation(conv.id)
                            }}
                            className={`p-3.5 rounded-xl cursor-pointer transition-all group hover:bg-muted/60 flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${currentConversationId === conv.id ? 'bg-primary/5 border-l-4 border-primary shadow-sm' : ''
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/30 rounded-full flex items-center justify-center text-sm font-medium text-primary flex-shrink-0 shadow-sm">
                                {conv.title ? conv.title.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-medium break-words whitespace-normal">{conv.title}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {new Date(conv.updated_at).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => deleteConversation(conv.id, e)}
                                className="h-8 w-auto p-2 rounded hover:bg-destructive/10"
                                title="Delete conversation"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>

          {/* Center - Chat Area */}
          <div className="lg:col-span-9">
            <Card className="h-[calc(100vh-140px)] flex flex-col">
              <CardHeader className="px-3 py-2 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Chat
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                  <div className="p-3 space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[90%] p-6 rounded-2xl shadow-md backdrop-blur-sm ${msg.role === "user"
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                              : "bg-gradient-to-br from-muted to-muted/80"
                            }`}
                        >
                          <div className="whitespace-pre-wrap break-words text-base leading-7">
                            {msg.role === "assistant" ? formatMessageContent(msg.content) : <p className="text-base leading-7">{msg.content}</p>}
                          </div>
                          <p
                            className={`text-sm mt-3 ${msg.role === "user"
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                              }`}
                          >
                            {msg.created_at}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] p-4 rounded-xl bg-gradient-to-br from-muted to-muted/80 shadow-md backdrop-blur-sm flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-primary/80" />
                          <span className="text-base font-medium text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              <div className="p-4 border-t bg-gradient-to-b from-background to-muted/20">
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask me anything about your studies..."
                    className="shadow-sm"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    disabled={isLoading || !message.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}