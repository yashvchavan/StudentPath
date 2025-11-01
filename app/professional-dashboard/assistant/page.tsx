"use client"

// This page is rendered inside `app/professional-dashboard/layout.tsx`
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Bot, Send, History, Plus, Trash2, AlertCircle } from "lucide-react"
import { useState, useRef, useEffect } from "react"

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

interface ProfessionalData {
  id?: number
  first_name?: string
  last_name?: string
  isAuthenticated?: boolean
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

function getProfessionalDataFromCookie(): ProfessionalData | null {
  if (typeof window === 'undefined') return null
  const cookies = document.cookie.split(';')
  const pCookie = cookies.find(cookie => cookie.trim().startsWith('studentData='))
  if (!pCookie) return null
  try {
    const decoded = decodeURIComponent(pCookie.split('=')[1])
    return JSON.parse(decoded)
  } catch (e) {
    console.error('Error parsing cookie', e)
    return null
  }
}

export default function ProfessionalAssistantPage() {
  const [profData, setProfData] = useState<ProfessionalData | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [userType] = useState<'professional' | 'student'>('professional')

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Professional-specific context
  const [professionalContext, setProfessionalContext] = useState<string>("")
  const [contextLoaded, setContextLoaded] = useState(false)
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null)

  useEffect(() => {
    const d = getProfessionalDataFromCookie()
    if (!d || !d.isAuthenticated) {
      setError('Not authenticated. Please login.')
      return
    }
    setProfData(d)
    const id = (d as any).id || (d as any).student_id
    if (id) setUserId(id)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (userId) {
      loadConversations()
      fetchSavedContext()
      fetchProfessionalProfile()

      if (messages.length === 0) {
        setMessages([{
          id: Date.now(),
          role: 'assistant',
          content: `Hi ${profData?.first_name || 'there'} — I'm your AI career assistant. Tell me a little about your role and goals to get personalized advice.`,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }])
      }
    }
  }, [userId])

  const fetchSavedContext = async () => {
    try {
      const res = await fetch(`/api/chat/context?userId=${userId}&userType=${userType}`)
      if (res.ok) {
        const data = await res.json()
        if (data.context) {
          setProfessionalContext(data.context)
          setContextLoaded(true)
          return
        }
        // if no saved context, we will wait for profile fetch to build summary
      }
    } catch (e) {
      console.error('Failed to fetch saved context', e)
    } finally {
      // leave contextLoaded to be set after profile fetch if needed
    }
  }

  const fetchProfessionalProfile = async () => {
    try {
      const res = await fetch(`/api/professionals/profile?professionalId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      if (data && data.success && data.data) {
        setProfessionalProfile(data.data)
        // if there's no saved context, build a summary automatically
        if (!professionalContext || professionalContext.trim() === '') {
          const p = data.data as ProfessionalProfile
          const skills = Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills ? String(p.skills) : '')
          const parts = []
          if (p.designation) parts.push(`${p.designation}`)
          if (p.company) parts.push(`at ${p.company}`)
          if (p.experience) parts.push(`Experience: ${p.experience}`)
          if (skills) parts.push(`Skills: ${skills}`)
          if (p.career_goals) parts.push(`Goals: ${p.career_goals}`)
          const summary = `${p.first_name || ''} ${p.last_name || ''}`.trim() + (parts.length ? ' — ' + parts.join(' • ') : '')
          setProfessionalContext(summary)
        }
      }
    } catch (e) {
      console.error('Failed to fetch professional profile', e)
    } finally {
      setContextLoaded(true)
    }
  }

  const saveContext = async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/chat/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType, contextData: professionalContext }),
      })
      if (!res.ok) throw new Error('Failed to save context')
      alert('Context saved')
    } catch (e) {
      console.error(e)
      alert('Failed to save context')
    }
  }

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
      if (!response.ok) throw new Error('Failed to load conversation')
      const data = await response.json()
      setMessages(data.messages.map((msg: any) => ({ id: msg.id, role: msg.role, content: msg.content, created_at: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })))
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
      content: `Hi ${profData?.first_name || 'there'} — I'm your AI career assistant. Tell me a little about your role and goals to get personalized advice.`,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      if (!response.ok) throw new Error('Failed to delete conversation')
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      if (currentConversationId === conversationId) startNewConversation()
    } catch (err: any) {
      console.error('Error deleting conversation:', err)
      setError(err.message || 'Failed to delete conversation')
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || !userId) return

    const userMessage: Message = { id: Date.now(), role: 'user', content: message.trim(), created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, conversationId: currentConversationId, userId, userType, userContext: professionalContext }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }
      const data = await response.json()
      const assistantMessage: Message = { id: Date.now() + 1, role: 'assistant', content: data.message, created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      setMessages(prev => [...prev, assistantMessage])

      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId)
        await loadConversations()
      }
    } catch (err: any) {
      console.error('Chat error:', err)
      setError(err.message || 'Failed to send message. Please try again.')
      const errorMessage: Message = { id: Date.now() + 1, role: 'assistant', content: 'I encountered an error processing your request. Please try again or rephrase your question.', created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="p-6 max-w-md">
          <CardContent className="flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-lg font-medium">{error || 'Loading user data...'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto p-3 md:p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">

        {/* Professional Context Panel */}
        {contextLoaded && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Your Professional Context</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Professional summary (automatically pulled from your profile). This will be used as context for the assistant.</p>
              {professionalProfile ? (
                <div className="p-3 rounded-md bg-muted">
                  <div className="font-medium">{professionalProfile.first_name} {professionalProfile.last_name}</div>
                  <div className="text-sm text-gray-300">{professionalProfile.designation ?? '—'} {professionalProfile.company ? `• ${professionalProfile.company}` : ''}</div>
                  {professionalProfile.industry && <div className="text-sm text-gray-400 mt-1">Industry: {professionalProfile.industry}</div>}
                  {professionalProfile.experience && <div className="text-sm text-gray-400 mt-1">Experience: {professionalProfile.experience}</div>}
                  {professionalProfile.skills && professionalProfile.skills.length > 0 && (
                    <div className="text-sm text-gray-300 mt-2">Skills: {professionalProfile.skills.join(', ')}</div>
                  )}
                  {professionalProfile.career_goals && <div className="text-sm text-gray-300 mt-2">Goals: {professionalProfile.career_goals}</div>}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Loading profile summary...</div>
              )}

              <div className="flex gap-2 mt-3">
                <Button onClick={saveContext}>Use & Save as Context</Button>
                <Button variant="ghost" onClick={() => { setProfessionalContext(''); alert('Context cleared — assistant will use default prompts.'); }}>Clear</Button>
                <Button variant="link" onClick={() => window.location.href = '/professional-dashboard/settings'}>Edit profile</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-140px)] flex flex-col shadow-lg border-0">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2"><History className="w-4 h-4" /> <CardTitle className="text-base">Chats</CardTitle></div>
                <Button size="sm" variant="ghost" onClick={startNewConversation} className="h-7 w-7 p-0"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-3">
                    {isLoadingConversations ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-8 px-2"><p className="text-sm text-muted-foreground mb-1">No conversations yet</p><p className="text-xs text-muted-foreground">Start chatting!</p></div>
                    ) : (
                      conversations.map((conv) => (
                        <div key={conv.id} role="button" tabIndex={0} onClick={() => loadConversation(conv.id)} onKeyDown={(e) => { if (e.key === 'Enter') loadConversation(conv.id) }} className={`p-3.5 rounded-xl cursor-pointer ${currentConversationId === conv.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-muted/60'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-base font-medium">{conv.title}</p>
                              <p className="text-sm text-muted-foreground">{new Date(conv.updated_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Button size="sm" variant="ghost" onClick={(e) => deleteConversation(conv.id, e)} className="h-8 w-auto p-2"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-9">
            <Card className="h-[calc(100vh-140px)] flex flex-col">
              <div className="px-3 py-2 border-b flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /><CardTitle className="text-base">Career Assistant</CardTitle></div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] p-6 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                          <p className="text-sm mt-3 text-muted-foreground">{msg.created_at}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (<div className="flex justify-start"><div className="max-w-[85%] p-4 rounded-xl bg-muted flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /><span>Thinking...</span></div></div>)}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              <div className="p-4 border-t bg-gradient-to-b from-background to-muted/20">
                <div className="flex gap-3">
                  <Input placeholder="Ask me anything about your career, resume, or skills..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }} disabled={isLoading} />
                  <Button onClick={handleSendMessage} size="icon" disabled={isLoading || !message.trim()}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
}
