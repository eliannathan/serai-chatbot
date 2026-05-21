import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to Serai Retreat! I\'m Sari, your personal concierge. How can I help you today? 🌿' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [size, setSize] = useState({ width: 360, height: 480 })
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      })
      const data = await response.json()
      if (!response.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || 'Something went wrong. Please try again.'
        }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startResize = (e, direction) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.width
    const startH = size.height

    const onMouseMove = (e) => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let newW = startW
      let newH = startH

      if (direction.includes('w')) newW = Math.min(650, Math.max(280, startW - dx))
      if (direction.includes('e')) newW = Math.min(650, Math.max(280, startW + dx))
      if (direction.includes('n')) newH = Math.min(700, Math.max(350, startH - dy))
      if (direction.includes('s')) newH = Math.min(700, Math.max(350, startH + dy))

      setSize({ width: newW, height: newH })
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }
  return (
    <div className="chat-wrapper">

      {/* Chat window — only renders when isOpen is true */}
      {isOpen && (
        <div className="resize-wrapper" style={{ width: size.width, height: size.height }}>
          {/* Edge handles */}
          <div className="rh rh-n" onMouseDown={(e) => startResize(e, 'n')} />
          <div className="rh rh-s" onMouseDown={(e) => startResize(e, 's')} />
          <div className="rh rh-w" onMouseDown={(e) => startResize(e, 'w')} />
          <div className="rh rh-e" onMouseDown={(e) => startResize(e, 'e')} />
          {/* Corner handles */}
          <div className="rh rh-nw" onMouseDown={(e) => startResize(e, 'nw')} />
          <div className="rh rh-ne" onMouseDown={(e) => startResize(e, 'ne')} />
          <div className="rh rh-sw" onMouseDown={(e) => startResize(e, 'sw')} />
          <div className="rh rh-se" onMouseDown={(e) => startResize(e, 'se')} />
          <div className="chat-window">
            <div className="chat-header">
              <div className="header-info">
                <div className="avatar">S</div>
                <div>
                  <div className="bot-name">Sari</div>
                  <div className="bot-status">Serai Retreat Concierge</div>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="bubble">{msg.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="message assistant">
                  <div className="bubble typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about our resort..."
                disabled={isLoading}
              />
              <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating bubble button */}
      <button className="chat-bubble" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </button>

    </div>
  )
}

export default App