"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bot, Send, Lightbulb, BookOpen, Target, Sparkles, Loader2, AlertCircle, Plus, Trash2, History, GraduationCap, MessageSquare, Brain, Zap
} from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  created_at: string
  context?: {
    hasSyllabusData?: boolean
    syllabusConfidence?: string
    program?: string
    semester?: number
  }
}

interface Conversation {
  id: number
  title: string
  created_at: string
  updated_at: string
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
    const id = data.student_id || data.id
    if (id) {
      setUserId(id)
    } else {
      setError("User ID not found in session")
    }
  }, [])

  // Load conversations after userId is set
  useEffect(() => {
    if (userId) {
      loadConversations()

      // Show welcome message
      if (messages.length === 0) {
        setMessages([{
          id: Date.now(),
          role: "assistant",
          content: `Hi ${studentData?.first_name || "there"}! 👋 I'm your **personalized AI learning assistant**.\n\nI have access to your complete academic profile, syllabus, skills, and career goals. I can help you with:\n\n📚 **Study Planning** - Get customized study schedules based on your syllabus\n🎯 **Career Guidance** - Connect your subjects with career opportunities\n🛤️ **Learning Roadmaps** - Build paths aligned with your semester structure\n💡 **Skill Development** - Identify gaps and get recommendations\n📊 **Subject Help** - Questions about your current and upcoming subjects\n\nTry asking me things like:\n- "What subjects should I focus on for web development?"\n- "Create a study plan for this semester"\n- "How does my current syllabus connect to AI careers?"\n\nWhat would you like to explore?`,
          created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }])
      }
    }
  }, [userId])

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
        created_at: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
      content: `Hi ${studentData?.first_name || "there"}! 👋 I'm your **personalized AI learning assistant**.\n\nI have access to your complete academic profile, syllabus, skills, and career goals. How can I help you today?`,
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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

  // Send message to unified chat API
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || !userId) return

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: message.trim(),
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
        context: data.context
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
        content: `I encountered an error: ${err.message || "Unknown error"}. Please try again or rephrase your question.`,
        created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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

        {/* Header Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="font-semibold text-lg">Personalized Learning Assistant</h2>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Zap className="w-3 h-3" />
                  Powered by your syllabus, profile & career goals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <Card className="h-[calc(100vh-280px)] flex flex-col shadow-lg border-0">
              <CardHeader className="pb-3 px-4 py-3 bg-gradient-to-b from-background to-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Conversations
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startNewConversation}
                    className="h-7 w-7 p-0"
                    title="New conversation"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    {isLoadingConversations ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-8 px-2">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No conversations yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Start chatting!</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => loadConversation(conv.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') loadConversation(conv.id)
                          }}
                          className={`p-3 rounded-xl cursor-pointer transition-all group hover:bg-muted/60 flex items-center justify-between gap-2 ${currentConversationId === conv.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                            }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conv.updated_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => deleteConversation(conv.id, e)}
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>

          {/* Center - Chat Area */}
          <div className="lg:col-span-9">
            <Card className="h-[calc(100vh-280px)] flex flex-col shadow-lg">
              <CardHeader className="px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Chat
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Syllabus-Aware
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      GPT-4 Turbo
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                  <div className="p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] p-5 rounded-2xl shadow-md ${msg.role === "user"
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                              : "bg-gradient-to-br from-muted to-muted/80"
                            }`}
                        >
                          {/* Context indicator for assistant messages */}
                          {msg.role === "assistant" && msg.context && (
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {msg.context.hasSyllabusData && (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-500/20">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Syllabus Data
                                </Badge>
                              )}
                              {msg.context.program && (
                                <Badge variant="outline" className="text-xs">
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  {msg.context.program}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="whitespace-pre-wrap break-words text-base leading-7">
                            {msg.role === "assistant" ? formatMessageContent(msg.content) : (
                              <p className="text-base leading-7">{msg.content}</p>
                            )}
                          </div>

                          <p className={`text-xs mt-3 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                            {msg.created_at}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] p-4 rounded-xl bg-gradient-to-br from-muted to-muted/80 shadow-md flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Analyzing your profile & syllabus...
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-gradient-to-b from-background to-muted/20">
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask about your studies, career, subjects, or learning paths..."
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
                    className="shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setMessage("What subjects should I focus on for web development?")}
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Web Dev Path
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setMessage("Create a study plan based on my current semester")}
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Study Plan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setMessage("How do my syllabus subjects connect to AI careers?")}
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    AI Career
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setMessage("What skills should I develop alongside my syllabus?")}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Skills Gap
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