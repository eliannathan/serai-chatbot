import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'

const SYSTEM_PROMPT = `You are Sari, the warm and knowledgeable concierge assistant for Serai Retreat — an intimate luxury retreat nestled in the rice terraces of Ubud, Bali.

You help guests with:
- Room information (Jungle Suite $120/night, Terrace Villa $220/night, Retreat Villa $380/night)
- Booking inquiries and availability questions
- Amenities: Balinese spa, farm-to-table dining, yoga pavilion, plunge pools, airport transfers
- General questions about Ubud, Bali, travel tips, and what to expect at the retreat

Your tone is: warm, calm, poetic but not over-the-top. You speak like a knowledgeable local host, not a corporate chatbot. Keep responses concise — 2-4 sentences max unless the guest asks for detail.

When a guest asks about booking, direct them to contact hello@serai.retreat or visit the My Booking page for existing reservations.

Never make up prices, policies, or availability you don't know. If unsure, say so gracefully and offer to connect them with the team.`

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello, I\'m Sari 🌿 Your Serai concierge. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Save lead to Supabase on first user message
      if (messages.length === 1) {
        await supabase.from('leads').insert({ message: text, source: 'chat_widget' })
      }

      // Build messages array for API (exclude the initial assistant greeting from history)
      const apiMessages = newMessages
        .filter((_, i) => !(i === 0 && newMessages[0].role === 'assistant'))
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      })

      const data = await res.json()
      const reply = data.content?.[0]?.text || 'I\'m sorry, I couldn\'t process that. Please try again.'

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m having a moment of quiet — please try again shortly. 🙏'
      }])
    }

    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setOpen(o => !o)}
        className="chat-toggle"
        aria-label="Open chat"
      >
        {open ? '✕' : '🌿'}
      </button>

      {/* CHAT PANEL */}
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-avatar">S</span>
              <div>
                <p className="chat-name">Sari</p>
                <p className="chat-role">Serai Concierge</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="chat-close">✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble assistant">
                <span className="chat-typing">
                  <span /><span /><span />
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Sari anything..."
              className="chat-input"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="chat-send"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}