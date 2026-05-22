import { useState, useRef, useEffect, useCallback } from 'react'
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

const MIN_W = 280, MIN_H = 400, MAX_W = 600, MAX_H = 700

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello, I'm Sari 🌿 Your Serai concierge. How can I help you today?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [size, setSize] = useState({ w: 340, h: 520 })
  const bottomRef = useRef(null)
  const panelRef = useRef(null)
  const resizing = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startResize = useCallback((e, direction) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h

    resizing.current = { startX, startY, startW, startH, direction }

    const onMove = (e) => {
      const dx = e.clientX - resizing.current.startX
      const dy = e.clientY - resizing.current.startY
      const dir = resizing.current.direction

      let newW = resizing.current.startW
      let newH = resizing.current.startH

      if (dir.includes('e')) newW = Math.min(MAX_W, Math.max(MIN_W, resizing.current.startW + dx))
      if (dir.includes('w')) newW = Math.min(MAX_W, Math.max(MIN_W, resizing.current.startW - dx))
      if (dir.includes('n')) newH = Math.min(MAX_H, Math.max(MIN_H, resizing.current.startH - dy))
      if (dir.includes('s')) newH = Math.min(MAX_H, Math.max(MIN_H, resizing.current.startH + dy))

      setSize({ w: newW, h: newH })
    }

    const onUp = () => {
      resizing.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [size])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      if (messages.length === 1) {
        await supabase.from('leads').insert({ message: text, source: 'chat_widget' })
      }

      const apiMessages = newMessages
        .filter((_, i) => !(i === 0 && newMessages[0].role === 'assistant'))
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      })

      const data = await res.json()
      const reply = data.content?.[0]?.text || "I'm sorry, I couldn't process that. Please try again."
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a moment of quiet — please try again shortly. 🙏"
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

const handles = [
  { dir: 'n',  style: { top: -6, left: -6, width: 'calc(100% + 12px)', height: 16, cursor: 'n-resize' } },
  { dir: 's',  style: { bottom: -6, left: -6, width: 'calc(100% + 12px)', height: 16, cursor: 's-resize' } },
  { dir: 'e',  style: { right: -6, top: -6, height: 'calc(100% + 12px)', width: 16, cursor: 'e-resize' } },
  { dir: 'w',  style: { left: -6, top: -6, height: 'calc(100% + 12px)', width: 16, cursor: 'w-resize' } },
  { dir: 'ne', style: { top: -6, right: -6, width: 24, height: 24, cursor: 'ne-resize' } },
  { dir: 'nw', style: { top: -6, left: -6, width: 24, height: 24, cursor: 'nw-resize' } },
  { dir: 'se', style: { bottom: -6, right: -6, width: 24, height: 24, cursor: 'se-resize' } },
  { dir: 'sw', style: { bottom: -6, left: -6, width: 24, height: 24, cursor: 'sw-resize' } },
]

  return (
    <>
      <button onClick={() => setOpen(o => !o)} className="chat-toggle" aria-label="Open chat">
        {open ? '✕' : '🌿'}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="chat-panel"
          style={{ width: size.w, height: size.h, resize: 'none' }}
        >
          {/* Resize handles */}
            {handles.map(h => (
              <div
                key={h.dir}
                onMouseDown={(e) => startResize(e, h.dir)}
                style={{
                  position: 'absolute',
                  ...h.style,
                  zIndex: 10,
                  userSelect: 'none',
                }}
              />
            ))}
          <div className="chat-inner">
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
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="chat-send">
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}