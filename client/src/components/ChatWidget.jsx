import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import BookingFlow from './BookingFlow'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const MIN_W = 280, MIN_H = 400, MAX_W = 600, MAX_H = 700

const ACTION_MAP = {
  GO_ROOMS:     { label: '🛏️ Browse Rooms',     path: '/rooms' },
  GO_BOOKING:   { label: '📋 My Booking',        path: '/my-booking' },
  GO_AMENITIES: { label: '🌿 Amenities',          path: '/amenities' },
  GO_CHECKOUT:  { label: '🛒 Go to Checkout',     path: '/checkout' },
  SHOW_BOOKING: { label: '📋 View My Booking',    path: '/my-booking' },
  CONTACT_TEAM: { label: '📧 Contact Team',       path: null, email: 'reservations@serairetreat.com' },
}

// Escape HTML before injecting AI content — prevents XSS if the model ever
// returns tags (e.g. via a successful prompt-injection attempt).
function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function bubbleHTML(content) {
  return {
    __html: escapeHtml(content)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }
}

// ─── Subcomponents defined at module level ────────────────────────────────────
// Keeping these outside ChatWidget means React sees stable component identities
// between renders, so it never unmounts/remounts their DOM nodes. This preserves
// textarea focus and avoids message-list flicker on every state change.

function MessageList({ messages, loading, navigate, showBookingFlow, onStartBooking, bottomRef }) {
  return (
    <>
      {messages.map((m, i) => (
        <div key={i} className={`chat-bubble-wrap ${m.role}`}>
          <div
            className={`chat-bubble ${m.role}`}
            dangerouslySetInnerHTML={bubbleHTML(m.content)}
          />
          {m.actions?.length > 0 && (
            <div className="chat-action-btns">
              {m.actions.map(a => (
                <button
                  key={a.label}
                  className="chat-action-btn"
                  onClick={() => a.path ? navigate(a.path) : window.location.href = `mailto:${a.email}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
          {m.showBookingBtn && !showBookingFlow && (
            <button className="chat-action-btn primary" onClick={onStartBooking}>
              🌿 Start Booking
            </button>
          )}
        </div>
      ))}
      {loading && (
        <div className="chat-bubble assistant">
          <span className="chat-typing"><span /><span /><span /></span>
        </div>
      )}
      <div ref={bottomRef} />
    </>
  )
}

function QuickReplies({ messages, quickReplies, handleQuickReply, loading, className }) {
  if (messages.length > 2) return null
  return (
    <div className={className}>
      {quickReplies.map(qr => (
        <button
          key={qr.label}
          className="quick-reply-btn"
          onClick={() => handleQuickReply(qr.message)}
          disabled={loading}
        >
          {qr.label}
        </button>
      ))}
    </div>
  )
}

function InputRow({ input, setInput, handleKey, sendMessage, loading, isMobile, className }) {
  return (
    <div className={className}>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask Sari anything..."
        className={`chat-input${isMobile ? ' chat-input-mobile' : ''}`}
        rows={1}
      />
      <button onClick={sendMessage} disabled={loading || !input.trim()} className="chat-send">↑</button>
    </div>
  )
}

function BookingOverlay({ showBookingFlow, persona, onComplete, onCancel }) {
  if (!showBookingFlow) return null
  return (
    <div className="booking-flow-overlay">
      <BookingFlow
        persona={persona}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatWidget({ persona }) {
  const [open, setOpen] = useState(false)
  const [showBookingFlow, setShowBookingFlow] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [size, setSize] = useState({ w: 340, h: 520 })
  const [nudgeSent, setNudgeSent] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  const navigate = useNavigate()
  const { cart, cartCount } = useCart()
  const storageKey = `serai_chat_${persona?.id || 'visitor'}`

  const bottomRef = useRef(null)
  const panelRef = useRef(null)
  const mobileScrollRef = useRef(null)
  const resizing = useRef(null)

  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(storageKey)
    if (saved) return JSON.parse(saved)
    const greeting = persona?.room
      ? `Welcome back, ${persona.name.split(' ')[0]}! 🌿 I can see you have the ${persona.room} booked for ${persona.dates}. How can I help with your stay?`
      : "Hello! I'm Sari 🌿 Your Serai concierge. How can I help you today?"
    return [{ role: 'assistant', content: greeting }]
  })

  // Persist messages
  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  // Responsive isMobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Lock body scroll on mobile.
  // Save and restore previous values so we don't stomp on another overlay
  // (e.g. the ImageGallery lightbox) that may have set overflow independently.
  useEffect(() => {
    if (open && isMobile) {
      const prevOverflow = document.body.style.overflow
      const prevPosition = document.body.style.position
      const prevWidth    = document.body.style.width
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width    = '100%'
      return () => {
        document.body.style.overflow = prevOverflow
        document.body.style.position = prevPosition
        document.body.style.width    = prevWidth
      }
    }
  }, [open, isMobile])

  // Cart nudge
  useEffect(() => {
    if (open && cartCount > 0 && !nudgeSent && messages.length <= 1) {
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I noticed you have ${cartCount} room${cartCount > 1 ? 's' : ''} waiting in your cart 🛒 Ready to complete your booking?`,
          actions: [ACTION_MAP.GO_CHECKOUT]
        }])
        setNudgeSent(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [open, cartCount, nudgeSent, messages.length])

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startResize = useCallback((e, direction) => {
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const startW = size.w, startH = size.h
    resizing.current = { startX, startY, startW, startH, direction }

    const onMove = (e) => {
      const dx = e.clientX - resizing.current.startX
      const dy = e.clientY - resizing.current.startY
      const dir = resizing.current.direction
      let newW = resizing.current.startW
      let newH = resizing.current.startH
      if (dir.includes('e')) newW = Math.min(MAX_W, Math.max(MIN_W, startW + dx))
      if (dir.includes('w')) newW = Math.min(MAX_W, Math.max(MIN_W, startW - dx))
      if (dir.includes('n')) newH = Math.min(MAX_H, Math.max(MIN_H, startH - dy))
      if (dir.includes('s')) newH = Math.min(MAX_H, Math.max(MIN_H, startH + dy))
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

  async function sendMessageWithText(text) {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      if (messages.length === 1) {
        await supabase.from('leads').insert({ message: text.trim(), source: 'chat_widget' })
      }

      const apiMessages = newMessages
        .filter((_, i) => !(i === 0 && newMessages[0].role === 'assistant'))
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          persona,
          cart: cart.map(item => ({
            room: item.room?.name,
            checkIn: item.checkIn,
            checkOut: item.checkOut,
            nights: item.nights,
            total: item.total,
            addOns: item.addOns?.map(a => a?.label).filter(Boolean)
          }))
        })
      })

      if (!res.ok) throw new Error(`API error ${res.status}`)

      const data = await res.json()
      const reply = data.content?.[0]?.text || "I'm sorry, I couldn't process that. Please try again."
      const actions = data.actions || []

      if (actions.includes('START_BOOKING')) handleStartBooking()

      const actionButtons = actions
        .filter(a => a !== 'START_BOOKING')
        .map(a => ACTION_MAP[a])
        .filter(Boolean)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        actions: actionButtons,
        showBookingBtn: actions.includes('START_BOOKING')
      }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a moment of quiet — please try again shortly. 🙏"
      }])
    }
    setLoading(false)
  }

  function sendMessage() { sendMessageWithText(input) }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleQuickReply(message) {
    setInput(message)
    setTimeout(() => sendMessageWithText(message), 0)
  }

  // On mobile the overlay is too cramped, so close the chat and route to the
  // full /rooms page where the user can browse and book with more space.
  // Desktop keeps the in-widget BookingFlow overlay.
  const handleStartBooking = useCallback(() => {
    if (window.innerWidth < 768) {
      setOpen(false)
      navigate('/rooms')
    } else {
      setShowBookingFlow(true)
    }
  }, [navigate])

  // BookingFlow callbacks — kept as plain functions since BookingOverlay is
  // now a stable component type and will only re-render (not remount) on prop changes.
  function handleBookingComplete(roomName) {
    // BookingFlow now adds to the pending cart (not Supabase). It shows its own
    // "Added to Pending!" screen with a Go to Checkout button; we drop a chat
    // message + checkout action as a fallback in case the user closes the overlay
    // without navigating.
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `${roomName} added to your cart 🛒 You can head to checkout when you're ready to confirm.`,
      actions: [ACTION_MAP.GO_CHECKOUT]
    }])
  }

  function handleBookingCancel() {
    setShowBookingFlow(false)
  }

  const quickReplies = persona?.room
    ? [
        { label: '📋 View my booking',    message: 'Can you pull up my booking details?' },
        { label: '📅 Make a new booking', message: 'I want to book a room' },
        { label: '💆 Spa hours',           message: 'What are the spa hours?' },
        { label: '📍 Things to do nearby', message: 'What are some local recommendations?' },
      ]
    : [
        { label: '🛏️ View rooms',  message: 'What rooms do you have available?' },
        { label: '💰 Room prices', message: 'How much are the rooms?' },
        { label: '📅 Book a room', message: 'I want to book a room' },
        { label: '🌿 Amenities',   message: 'What amenities does the resort offer?' },
      ]

  const handles = [
    { dir: 'n',  style: { top: -6,    left: -6,    width: 'calc(100% + 12px)', height: 16, cursor: 'n-resize'  } },
    { dir: 's',  style: { bottom: -6, left: -6,    width: 'calc(100% + 12px)', height: 16, cursor: 's-resize'  } },
    { dir: 'e',  style: { right: -6,  top: -6,     height: 'calc(100% + 12px)', width: 16, cursor: 'e-resize'  } },
    { dir: 'w',  style: { left: -6,   top: -6,     height: 'calc(100% + 12px)', width: 16, cursor: 'w-resize'  } },
    { dir: 'ne', style: { top: -6,    right: -6,   width: 24, height: 24, cursor: 'ne-resize' } },
    { dir: 'nw', style: { top: -6,    left: -6,    width: 24, height: 24, cursor: 'nw-resize' } },
    { dir: 'se', style: { bottom: -6, right: -6,   width: 24, height: 24, cursor: 'se-resize' } },
    { dir: 'sw', style: { bottom: -6, left: -6,    width: 24, height: 24, cursor: 'sw-resize' } },
  ]

  // Shared props bundles passed to the module-level subcomponents
  const messageListProps = { messages, loading, navigate, showBookingFlow, onStartBooking: handleStartBooking, bottomRef }
  const quickRepliesProps = { messages, quickReplies, handleQuickReply, loading }
  const inputRowProps = { input, setInput, handleKey, sendMessage, loading, isMobile }
  const bookingOverlayProps = {
    showBookingFlow,
    persona,
    onComplete: handleBookingComplete,
    onCancel: handleBookingCancel,
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} className="chat-toggle" aria-label="Open chat">
        {open ? '✕' : '🌿'}
      </button>

      {/* DESKTOP */}
      {open && !isMobile && (
        <div ref={panelRef} className="chat-panel" style={{ width: size.w, height: size.h, resize: 'none' }}>
          {handles.map(h => (
            <div
              key={h.dir}
              onMouseDown={(e) => startResize(e, h.dir)}
              style={{ position: 'absolute', ...h.style, zIndex: 10, userSelect: 'none' }}
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
              <MessageList {...messageListProps} />
            </div>
            <QuickReplies {...quickRepliesProps} className="chat-quick-replies" />
            <InputRow {...inputRowProps} className="chat-input-row" />
            <BookingOverlay {...bookingOverlayProps} />
          </div>
        </div>
      )}

      {/* MOBILE */}
      {open && isMobile && (
        <div className="chat-mobile">
          <div className="chat-mobile-header">
            <button onClick={() => setOpen(false)} className="chat-back-btn">←</button>
            <span className="chat-avatar">S</span>
            <div>
              <p className="chat-name">Sari</p>
              <p className="chat-role">Serai Concierge</p>
            </div>
          </div>
          <div className="chat-mobile-messages" ref={mobileScrollRef}>
            <MessageList {...messageListProps} />
          </div>
          <QuickReplies {...quickRepliesProps} className="chat-mobile-quick-replies" />
          <InputRow {...inputRowProps} className="chat-mobile-input-row" />
          <BookingOverlay {...bookingOverlayProps} />
        </div>
      )}
    </>
  )
}
