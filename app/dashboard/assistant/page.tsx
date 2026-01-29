"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Loader2, Bot, Send, History, Plus, Trash2, AlertCircle, PanelLeftClose, PanelLeft,
  Sparkles, Building2, GraduationCap, Briefcase, Edit3, RotateCcw, Copy, Check, ChevronDown,
  ChevronUp, FileText, BookOpen, Target, TrendingUp, MessageSquare, X, Search, Zap, Lightbulb
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"

interface Source {
  title?: string
  url?: string
  snippet?: string
  type?: string
  score?: number
}

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  created_at: string
  sources?: Source[]
  isEditing?: boolean
  originalContent?: string
  context?: any
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
  const userType = "student"

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")

  // Student-specific context
  const [showContextPanel, setShowContextPanel] = useState(false)

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (userId) {
      loadConversations()
      // We don't fetch a separate profile API like professionals do, data is in cookie/context

      if (messages.length === 0) {
        const welcomeMessage = `👋 **Welcome back, ${studentData?.first_name || 'Student'}!**

I'm your **personalized AI learning assistant**. I have access to your complete academic profile, syllabus, skills, and career goals. I can help you with:

📚 **Study Planning** — Get customized study schedules based on your syllabus
🎯 **Career Guidance** — Connect your subjects with career opportunities
🛤️ **Learning Roadmaps** — Build paths aligned with your semester structure
💡 **Skill Development** — Identify gaps and get recommendations

**Try asking me:**
- "How should I prepare for a career in AI?"
- "Create a study plan for my current semester"
- "What certifications would boost my profile?"
- "Analyze my skills and suggest improvements"

What would you like to explore today?`

        setMessages([{
          id: Date.now(),
          role: 'assistant',
          content: welcomeMessage,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }])
      }
    }
  }, [userId])

  const loadConversations = async () => {
    if (!userId) return
    try {
      setIsLoadingConversations(true)
      const response = await fetch(`/api/chat/conversations?userId=${userId}&userType=${userType}`)
      if (!response.ok) throw new Error('Failed to load conversations')
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
      if (!response.ok) throw new Error('Failed to load conversation')
      const data = await response.json()
      setMessages(data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: msg.sources || [],
        context: msg.context
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
      role: 'assistant',
      content: `👋 **Ready for a new conversation!**\n\nHow can I assist you with your studies or career today?`,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
    inputRef.current?.focus()
  }

  const deleteConversation = async (conversationId: number, e?: React.MouseEvent) => {
    if (!userId) return
    if (e) e.stopPropagation()
    if (!confirm('Delete this conversation?')) return

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType }),
      })
      if (!response.ok) throw new Error('Failed to delete conversation')
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      if (currentConversationId === conversationId) startNewConversation()
    } catch (err: any) {
      console.error('Error deleting conversation:', err)
      setError(err.message || 'Failed to delete conversation')
    }
  }

  const handleSendMessage = async (customMessage?: string) => {
    const msgToSend = customMessage || message.trim()
    if (!msgToSend || isLoading || !userId) return

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: msgToSend,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgToSend,
          conversationId: currentConversationId,
          userId,
          userType
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [],
        context: data.context
      }
      setMessages(prev => [...prev, assistantMessage])

      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId)
        await loadConversations()
      }
    } catch (err: any) {
      console.error('Chat error:', err)
      setError(err.message || 'Failed to send message')
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '❌ I encountered an error processing your request. Please try again.',
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Edit message functionality
  const handleEditMessage = (messageId: number) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isEditing: true, originalContent: msg.content }
        : msg
    ))
  }

  const handleCancelEdit = (messageId: number) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isEditing: false, content: msg.originalContent || msg.content }
        : msg
    ))
  }

  const handleResendEdited = async (messageId: number, newContent: string) => {
    const msgIndex = messages.findIndex(m => m.id === messageId)
    if (msgIndex === -1) return
    setMessages(prev => prev.slice(0, msgIndex))
    await handleSendMessage(newContent)
  }

  // Copy message content
  const handleCopyMessage = async (messageId: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  // Toggle sources visibility
  const toggleSources = (messageId: number) => {
    setExpandedSources(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  // Format message content with modern markdown-like styling
  const formatMessageContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, i) => {
      const trimmedLine = line.trim();

      // Handle Headers (up to 6 levels)
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.*)/);
      if (headerMatch) {
        const depth = headerMatch[1].length;
        const text = headerMatch[2];

        switch (depth) {
          case 1: return <h1 key={i} className="font-extrabold text-2xl mt-6 mb-4 text-white">{text}</h1>;
          case 2: return <h2 key={i} className="font-bold text-xl mt-5 mb-3 text-white border-b border-zinc-800 pb-2">{text}</h2>;
          case 3: return <h3 key={i} className="font-bold text-lg mt-4 mb-2 text-yellow-500">{text}</h3>;
          case 4: return <h4 key={i} className="font-bold text-base mt-3 mb-1 text-zinc-100 italic">{text}</h4>;
          default: return <h5 key={i} className="font-semibold text-sm mt-3 mb-1 text-zinc-300">{text}</h5>;
        }
      }

      // Handle List Items
      const listMatch = trimmedLine.match(/^(\d+\.|[-•*+]|[\u{1F300}-\u{1F9FF}])\s*(.*)/u);
      if (listMatch) {
        const bullet = listMatch[1];
        const isNumbered = /^\d+\./.test(bullet);
        const content = listMatch[2];
        const parts = content.split('**');

        return (
          <div key={i} className="flex items-start gap-3 ml-2 mb-2">
            <span className={`text-zinc-400 font-medium flex-shrink-0 ${isNumbered ? 'min-w-[1.2rem]' : 'min-w-[1rem]'}`}>{bullet}</span>
            <p className="leading-relaxed text-zinc-200">
              {parts.map((part, j) => j % 2 === 0 ? part : <strong key={j} className="text-white font-semibold">{part}</strong>)}
            </p>
          </div>
        );
      }

      // Handle Bold text and standard paragraphs
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split('**')
        return (
          <p key={i} className="mb-2 leading-relaxed text-zinc-200">
            {parts.map((part, j) => j % 2 === 0 ? part : <strong key={j} className="text-white font-semibold">{part}</strong>)}
          </p>
        )
      }

      if (trimmedLine === '') {
        return <div key={i} className="h-3"></div>
      }

      return <p key={i} className="mb-2 leading-relaxed text-zinc-200">{line}</p>
    })
  }

  // Quick suggestions
  const quickSuggestions = [
    { icon: Building2, label: "Career Prep", prompt: "Help me prepare for interviews in my field" },
    { icon: GraduationCap, label: "Study Plan", prompt: "Create a study plan for my current semester" },
    { icon: TrendingUp, label: "Career Path", prompt: "What career paths match my skills?" },
    { icon: Target, label: "Skill Gap", prompt: "Identify skill gaps for my target role" },
  ]

  if (!userId) {
    return (
      <DashboardLayout currentPage="assistant">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Card className="p-6 max-w-md bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-lg font-medium text-white">{error || 'Loading...'}</p>
              <Button onClick={() => window.location.href = '/login'} className="bg-yellow-500 text-black hover:bg-yellow-400">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout currentPage="assistant">
      {/* 
        Adjusted height to calc(100vh - 8rem) to account for top navbar (~4rem) and padding/margins.
        This ensures the internal ScrollArea has a fixed constraint to scroll against.
      */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] bg-background border rounded-xl overflow-hidden shadow-sm relative isolate">

        {/* Collapsible Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-0 opacity-0 lg:hidden' : 'w-full lg:w-80'} transition-all duration-300 bg-card border-r flex flex-col overflow-hidden absolute inset-0 z-40 lg:relative lg:inset-auto lg:z-auto`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-sm">Conversations</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startNewConversation}
                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2 border-b bg-card">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-muted/50 border-input text-xs focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-2 space-y-1">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <History className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Start a new chat!</p>
                </div>
              ) : (
                conversations
                  .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`group p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all border ${currentConversationId === conv.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-muted/50 hover:border-border'
                        }`}
                    >
                      <div className="flex flex-col gap-2">
                        <p className={`text-sm font-semibold line-clamp-2 leading-snug transition-colors ${currentConversationId === conv.id ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                          {conv.title}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                            <History className="w-3 h-3" />
                            {new Date(conv.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => deleteConversation(conv.id, e)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Bottom Sidebar Action */}
          <div className="p-4 border-t bg-muted/20">
            <Button
              onClick={startNewConversation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2 h-10"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </Button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="h-8 w-8 p-0 lg:hidden text-muted-foreground hover:text-foreground"
                    >
                      {sidebarCollapsed ? (
                        <PanelLeft className="w-4 h-4" />
                      ) : (
                        <PanelLeftClose className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm md:text-base">AI Learning Assistant</h2>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Powered by GPT-4 + Your Syllabus</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                <Sparkles className="w-3 h-3 mr-1" />
                GPT-4
              </Badge>
              <Badge variant="outline" className="text-xs">
                <GraduationCap className="w-3 h-3 mr-1" />
                Student
              </Badge>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar scroll-smooth p-4">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] group`}>
                    {/* Message Content */}
                    <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-muted/50 border text-foreground rounded-bl-sm'
                      }`}>

                      {msg.isEditing ? (
                        <div className="space-y-3">
                          <Textarea
                            defaultValue={msg.content}
                            className="w-full min-h-[100px] bg-background border-input"
                            id={`edit-${msg.id}`}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelEdit(msg.id)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                const textarea = document.getElementById(`edit-${msg.id}`) as HTMLTextAreaElement
                                if (textarea) {
                                  handleResendEdited(msg.id, textarea.value)
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Resend
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none">
                          {msg.role === 'assistant' ? formatMessageContent(msg.content) : (
                            <p className="leading-relaxed">{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Actions & Sources */}
                    {!msg.isEditing && (
                      <div className="flex items-center justify-between mt-1 px-1">
                        <span className="text-[10px] text-muted-foreground">
                          {msg.created_at}
                        </span>

                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          {msg.role === 'user' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditMessage(msg.id)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit & Resend</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                >
                                  {copiedMessageId === msg.id ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-4 rounded-2xl bg-muted/50 border rounded-bl-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-muted-foreground text-xs font-medium">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-card">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Quick Suggestions - Only show when no messages or empty chat */}
              {messages.length <= 1 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  {quickSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(s.prompt)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all text-center group"
                    >
                      <div className="p-2 rounded-full bg-background group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 text-blue-600 transition-colors">
                        <s.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative flex gap-2 items-end bg-muted/30 p-2 rounded-xl border focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                <Textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Ask focused questions about your studies..."
                  className="min-h-[50px] max-h-[200px] border-0 focus-visible:ring-0 resize-none bg-transparent placeholder:text-muted-foreground py-3"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!message.trim() || isLoading}
                  className="mb-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground px-1">
                <p>AI can make mistakes. Verify important info.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}