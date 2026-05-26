import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import BookingFlow from './BookingFlow'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const MIN_W = 280, MIN_H = 400, MAX_W = 600, MAX_H = 700

export default function ChatWidget({ persona }) {

  const [open, setOpen] = useState(false)
  const storageKey = `serai_chat_${persona?.id || 'visitor'}`
  const [showBookingFlow, setShowBookingFlow] = useState(false)
  const navigate = useNavigate()
  const { cart, cartCount } = useCart()

  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(storageKey)
    if (saved) return JSON.parse(saved)
    const greeting = persona?.room
      ? `Welcome back, ${persona.name.split(' ')[0]}! 🌿 I can see you have the ${persona.room} booked for ${persona.dates}. How can I help with your stay?`
      : "Hello! I'm Sari 🌿 Your Serai concierge. How can I help you today?"
    return [{ role: 'assistant', content: greeting }]
  })

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  // Lock body scroll when mobile chat is open
  useEffect(() => {
    if (open && window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [open])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [size, setSize] = useState({ w: 340, h: 520 })
  const bottomRef = useRef(null)
  const panelRef = useRef(null)
  const mobileScrollRef = useRef(null)
  const resizing = useRef(null)

  const [nudgeSent, setNudgeSent] = useState(false)

  useEffect(() => {
    if (open && cartCount > 0 && !nudgeSent && messages.length <= 1) {
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I noticed you have ${cartCount} room${cartCount > 1 ? 's' : ''} waiting in your cart 🛒 Ready to complete your booking?`,
          actions: [{ label: '🛒 Go to Checkout', path: '/checkout' }]
        }])
        setNudgeSent(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [open, cartCount, nudgeSent])

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

      const data = await res.json()
      const reply = data.content?.[0]?.text || "I'm sorry, I couldn't process that. Please try again."
      const actions = data.actions || []

      // Handle actions
      actions.forEach(action => {
        if (action === 'START_BOOKING') setShowBookingFlow(true)
      })

      // Build message with action buttons
      const actionButtons = actions
        .filter(a => a !== 'START_BOOKING')
        .map(a => {
          const map = {
            GO_ROOMS: { label: '🛏️ Browse Rooms', path: '/rooms' },
            GO_BOOKING: { label: '📋 My Booking', path: '/my-booking' },
            GO_AMENITIES: { label: '🌿 Amenities', path: '/amenities' },
            GO_CHECKOUT: { label: '🛒 Go to Checkout', path: '/checkout' },
            SHOW_BOOKING: { label: '📋 View My Booking', path: '/my-booking' },
            CONTACT_TEAM: { label: '📧 Contact Team', path: null, email: 'reservations@serairetreat.com' },
          }
          return map[a]
        })
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

  function sendMessage() {
    sendMessageWithText(input)
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

  const quickReplies = persona?.room
    ? [
        { label: '📋 View my booking', message: 'Can you pull up my booking details?' },
        { label: '📅 Make a new booking', message: 'I want to book a room' },
        { label: '💆 Spa hours', message: 'What are the spa hours?' },
        { label: '📍 Things to do nearby', message: 'What are some local recommendations?' },
      ]
    : [
        { label: '🛏️ View rooms', message: 'What rooms do you have available?' },
        { label: '💰 Room prices', message: 'How much are the rooms?' },
        { label: '📅 Book a room', message: 'I want to book a room' },
        { label: '🌿 Amenities', message: 'What amenities does the resort offer?' },
      ]

  function handleQuickReply(message) {
    setInput(message)
    setTimeout(() => { sendMessageWithText(message) }, 0)
  }

  const isMobile = window.innerWidth <= 768

  const bubbleHTML = (content) => ({
    __html: content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  })

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

      {/* DESKTOP: floating panel */}
      {open && !isMobile && (
        <div
          ref={panelRef}
          className="chat-panel"
          style={{ width: size.w, height: size.h, resize: 'none' }}
        >
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
                <div key={i} className={`chat-bubble-wrap ${m.role}`}>
                  <div
                    className={`chat-bubble ${m.role}`}
                    dangerouslySetInnerHTML={bubbleHTML(m.content)}
                  />
                  {/* Action buttons */}
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
                  {/* Start booking button */}
                  {m.showBookingBtn && !showBookingFlow && (
                    <button
                      className="chat-action-btn primary"
                      onClick={() => setShowBookingFlow(true)}
                    >
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
            </div>

            {messages.length <= 2 && (
              <div className="chat-quick-replies">
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
            )}

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
            {/* Booking Flow Overlay */}
            {showBookingFlow && (
              <div className="booking-flow-overlay">
                <BookingFlow
                  persona={persona}
                  onComplete={(ref) => {
                    setShowBookingFlow(false)
                    setMessages(prev => [...prev, {
                      role: 'assistant',
                      content: `Your booking request has been submitted! 🌿 Reference: **${ref}**. Our team will confirm within 24 hours at ${persona?.email || 'your email'}.`
                    }])
                  }}
                  onCancel={() => setShowBookingFlow(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE: full screen chat */}
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
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble-wrap ${m.role}`}>
                <div
                  className={`chat-bubble ${m.role}`}
                  dangerouslySetInnerHTML={bubbleHTML(m.content)}
                />
                {/* Action buttons */}
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
                {/* Start booking button */}
                {m.showBookingBtn && !showBookingFlow && (
                  <button
                    className="chat-action-btn primary"
                    onClick={() => setShowBookingFlow(true)}
                  >
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
          </div>

          {messages.length <= 2 && (
            <div className="chat-mobile-quick-replies">
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
          )}

          <div className="chat-mobile-input-row">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Sari anything..."
              className="chat-input chat-input-mobile"
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
          {/* Booking Flow Overlay */}
          {showBookingFlow && (
            <div className="booking-flow-overlay">
              <BookingFlow
                persona={persona}
                onComplete={(ref) => {
                  setShowBookingFlow(false)
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Your booking request has been submitted! 🌿 Reference: **${ref}**. Our team will confirm within 24 hours at ${persona?.email || 'your email'}.`
                  }])
                }}
                onCancel={() => setShowBookingFlow(false)}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}