"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Loader2, Bot, Send, History, Plus, Trash2, AlertCircle, PanelLeftClose, PanelLeft,
  Sparkles, Building2, GraduationCap, Briefcase, Edit3, RotateCcw, Copy, Check, ChevronDown,
  ChevronUp, FileText, BookOpen, Target, TrendingUp, MessageSquare, X, Search
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
}

interface Conversation {
  id: number
  title: string
  created_at: string
  updated_at: string
}

interface ProfessionalData {
  id?: number
  first_name?: string
  last_name?: string
  email?: string
  company?: string
  designation?: string
  isAuthenticated?: boolean
  userType?: string
}

interface ProfessionalProfile {
  id: number
  first_name?: string
  last_name?: string
  email?: string
  company?: string
  designation?: string
  industry?: string
  experience?: string
  skills?: string[]
  career_goals?: string
}

// Get professional data from professionalData cookie (or fallback to studentData for legacy)
function getProfessionalDataFromCookie(): ProfessionalData | null {
  if (typeof window === 'undefined') return null
  const cookies = document.cookie.split(';')

  // Try professionalData first
  let pCookie = cookies.find(cookie => cookie.trim().startsWith('professionalData='))

  // Fallback to studentData with userType check
  if (!pCookie) {
    pCookie = cookies.find(cookie => cookie.trim().startsWith('studentData='))
  }

  if (!pCookie) return null

  try {
    const decoded = decodeURIComponent(pCookie.split('=')[1])
    const data = JSON.parse(decoded)

    // Verify it's a professional user
    if (data.userType && data.userType !== 'professional') {
      return null
    }

    return data
  } catch (e) {
    console.error('Error parsing cookie', e)
    return null
  }
}

export default function ProfessionalAssistantPage() {
  const [profData, setProfData] = useState<ProfessionalData | null>(null)
  const [userId, setUserId] = useState<number | null>(null)

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

  // Professional-specific context
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null)
  const [showContextPanel, setShowContextPanel] = useState(false)

  useEffect(() => {
    const d = getProfessionalDataFromCookie()
    if (!d || !d.isAuthenticated) {
      setError('Not authenticated. Please login.')
      return
    }
    setProfData(d)
    const id = d.id
    if (id) setUserId(id)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (userId) {
      loadConversations()
      fetchProfessionalProfile()

      if (messages.length === 0) {
        const welcomeMessage = `👋 **Welcome back, ${profData?.first_name || 'Professional'}!**

I'm your AI-powered career assistant with access to your complete professional profile. I can help you with:

🏢 **Company Preparation** — Interview prep, company research, culture fit analysis
📚 **Skill Development** — Learning paths, certifications, upskilling recommendations
💼 **Career Strategy** — Role transitions, salary insights, resume optimization
🎯 **Goal Planning** — Career milestones, skill gap analysis, industry trends

**Try asking me:**
- "How should I prepare for a senior role at Google?"
- "What certifications would boost my profile?"
- "Create a 6-month learning plan for transitioning to AI/ML"
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

  const fetchProfessionalProfile = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/professionals/profile?professionalId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      if (data && data.success && data.data) {
        setProfessionalProfile(data.data)
      }
    } catch (e) {
      console.error('Failed to fetch professional profile', e)
    }
  }

  const loadConversations = async () => {
    if (!userId) return
    try {
      setIsLoadingConversations(true)
      const response = await fetch(`/api/professionals/chat/conversations`)
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
      const response = await fetch(`/api/professionals/chat/conversations/${conversationId}`)
      if (!response.ok) throw new Error('Failed to load conversation')
      const data = await response.json()
      setMessages(data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: msg.sources || []
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
      content: `👋 **Ready for a new conversation!**\n\nHow can I assist you with your career today?`,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
    inputRef.current?.focus()
  }

  const deleteConversation = async (conversationId: number, e?: React.MouseEvent) => {
    if (!userId) return
    if (e) e.stopPropagation()
    if (!confirm('Delete this conversation?')) return

    try {
      const response = await fetch(`/api/professionals/chat/conversations/${conversationId}`, {
        method: 'DELETE',
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
      // Use professional-specific chat API
      const response = await fetch('/api/professionals/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgToSend,
          conversationId: currentConversationId,
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
        sources: data.sources || []
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

      // Handle List Items (Universal Bullet & Numbered)
      // Regex detects digits follow by dot OR common emojis/bullets
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
    { icon: Building2, label: "Company Prep", prompt: "Help me prepare for interviews at top tech companies" },
    { icon: GraduationCap, label: "Learning Path", prompt: "Create a personalized learning roadmap based on my skills" },
    { icon: TrendingUp, label: "Career Growth", prompt: "Analyze my career trajectory and suggest next steps" },
    { icon: Target, label: "Skill Gap", prompt: "Identify skill gaps for my target role and how to fill them" },
  ]

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="p-6 max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-lg font-medium text-white">{error || 'Loading...'}</p>
            <Button onClick={() => window.location.href = '/professional-login'} className="bg-yellow-500 text-black hover:bg-yellow-400">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col lg:flex-row h-full bg-zinc-950 overflow-hidden relative">

        {/* Collapsible Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-0 opacity-0 lg:hidden' : 'w-full lg:w-80'} transition-all duration-300 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden absolute inset-0 z-50 lg:relative lg:inset-auto`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-white text-sm">Conversations</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startNewConversation}
                  className="h-8 w-8 p-0 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-zinc-800/50 border-zinc-700 text-xs focus:ring-yellow-500/20 focus:border-yellow-500/50"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <History className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
                  <p className="text-sm text-zinc-500">No conversations yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Start a new chat!</p>
                </div>
              ) : (
                conversations
                  .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`group p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all border ${currentConversationId === conv.id
                        ? 'bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/5'
                        : 'bg-zinc-800/20 border-transparent hover:bg-zinc-800/60 hover:border-zinc-700'
                        }`}
                    >
                      <div className="flex flex-col gap-2">
                        <p className={`text-sm font-semibold line-clamp-2 leading-snug transition-colors ${currentConversationId === conv.id ? 'text-yellow-500' : 'text-zinc-100'}`}>
                          {conv.title}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
                            <History className="w-3 h-3" />
                            {new Date(conv.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => deleteConversation(conv.id, e)}
                            className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>

          {/* Bottom Sidebar Action */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <Button
              onClick={startNewConversation}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 gap-2 h-10"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </Button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="h-8 w-8 p-0 hover:bg-zinc-800 text-zinc-400 hover:text-white"
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

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <Bot className="w-4 h-4 md:w-5 md:h-5 text-black" />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm md:text-base">AI Career Assistant</h2>
                  <p className="text-[10px] md:text-xs text-zinc-500">Powered by GPT-4 + Your Profile</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-500">
                <Sparkles className="w-3 h-3 mr-1" />
                GPT-4
              </Badge>
              {professionalProfile?.company && (
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                  <Building2 className="w-3 h-3 mr-1" />
                  {professionalProfile.company}
                </Badge>
              )}
            </div>
          </div>

          {/* Context Panel (Collapsible) */}
          {showContextPanel && professionalProfile && (
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-yellow-500" />
                    Your Profile (Used for personalization)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">Role:</span>
                      <p className="text-white font-medium truncate">{professionalProfile.designation || '—'}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">Company:</span>
                      <p className="text-white font-medium truncate">{professionalProfile.company || '—'}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">Experience:</span>
                      <p className="text-white font-medium truncate">{professionalProfile.experience || '—'}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-zinc-500">Industry:</span>
                      <p className="text-white font-medium truncate">{professionalProfile.industry || '—'}</p>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowContextPanel(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar scroll-smooth">
            <div className="p-4 space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] group`}>
                    {/* Message Content */}
                    <div className={`p-4 rounded-2xl ${msg.role === 'user'
                      ? 'bg-yellow-500 text-black rounded-br-md'
                      : 'bg-zinc-800/80 text-white rounded-bl-md'
                      }`}>

                      {msg.isEditing ? (
                        <div className="space-y-3">
                          <Textarea
                            defaultValue={msg.content}
                            className="w-full min-h-[100px] bg-zinc-900 border-zinc-700 text-white"
                            id={`edit-${msg.id}`}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelEdit(msg.id)}
                              className="text-zinc-400"
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
                              className="bg-yellow-500 text-black hover:bg-yellow-400"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Resend
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {msg.role === 'assistant' ? formatMessageContent(msg.content) : (
                            <p className="leading-relaxed">{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Actions & Sources */}
                    {!msg.isEditing && (
                      <div className="flex items-center justify-between mt-2 px-1">
                        <span className={`text-xs ${msg.role === 'user' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                          {msg.created_at}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.role === 'user' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditMessage(msg.id)}
                                  className="h-7 w-7 p-0 text-zinc-500 hover:text-white hover:bg-zinc-800"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit & Resend</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                className="h-7 w-7 p-0 text-zinc-500 hover:text-white hover:bg-zinc-800"
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

                          {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleSources(msg.id)}
                                  className="h-7 px-2 text-zinc-500 hover:text-white hover:bg-zinc-800"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  <span className="text-xs">{msg.sources.length}</span>
                                  {expandedSources.has(msg.id) ? (
                                    <ChevronUp className="w-3 h-3 ml-1" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Sources</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expanded Sources */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && expandedSources.has(msg.id) && (
                      <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                        <h5 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          Sources Used
                        </h5>
                        <div className="space-y-2">
                          {msg.sources.map((source, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${source.type === 'profile' ? 'bg-yellow-500/20 text-yellow-500' :
                                source.type === 'educational' ? 'bg-blue-500/20 text-blue-500' :
                                  source.type === 'market' ? 'bg-green-500/20 text-green-500' :
                                    source.type === 'career' ? 'bg-purple-500/20 text-purple-500' :
                                      'bg-orange-500/20 text-orange-500'
                                }`}>
                                {source.type === 'profile' ? <Briefcase className="w-3 h-3" /> :
                                  source.type === 'educational' ? <GraduationCap className="w-3 h-3" /> :
                                    source.type === 'market' ? <TrendingUp className="w-3 h-3" /> :
                                      source.type === 'career' ? <Target className="w-3 h-3" /> :
                                        <Building2 className="w-3 h-3" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium">{source.title}</p>
                                <p className="text-zinc-500">{source.snippet}</p>
                              </div>
                              {source.score && (
                                <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                                  {(source.score * 100).toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-4 rounded-2xl bg-zinc-800/80 rounded-bl-md">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-zinc-400">Analyzing your profile...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <div className="max-w-4xl mx-auto">
              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-2 mb-3">
                {quickSuggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(suggestion.prompt)}
                    className="text-xs border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-yellow-500/50"
                  >
                    <suggestion.icon className="w-3 h-3 mr-1.5" />
                    {suggestion.label}
                  </Button>
                ))}
              </div>

              {/* Input Box */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    ref={inputRef}
                    placeholder="Ask about career growth, interview prep, learning paths..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={isLoading}
                    className="min-h-[52px] max-h-[120px] md:max-h-[200px] resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-500/50 focus:ring-yellow-500/20 pr-12 text-sm md:text-base"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !message.trim()}
                  className="h-[52px] w-[52px] bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>

              <div className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
