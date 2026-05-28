import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ROOMS } from '../data/rooms'
import { ADD_ONS } from '../data/addons'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// 6-step progress: input on steps 1–5, success screen on step 6.
// Labels kept short (≤7 chars) so the row fits in the ~340px chat widget.
const STEP_LABELS = ['Room', 'Dates', 'Add-ons', 'Info', 'Review', 'Confirm']

export default function BookingFlow({ persona, onComplete, onCancel }) {
  const navigate = useNavigate()
  const { addToCart, cartFull, maxCartItems } = useCart()

  const [step, setStep] = useState(1)
  // Scroll container ref — reset to top when advancing steps so users always
  // land at the top of the new step's content (not halfway down a long form).
  const containerRef = useRef(null)

  function advanceTo(n) {
    setStep(n)
    if (containerRef.current) containerRef.current.scrollTop = 0
  }

  const [selectedRoom, setSelectedRoom] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [numGuests, setNumGuests] = useState(1)
  const [selectedAddOns, setSelectedAddOns] = useState([])
  const [specialRequests, setSpecialRequests] = useState('')

  // Pre-fill name/email from persona when it's a named demo guest.
  // The visitor persona has no booking, so we leave the fields blank.
  const [guestName, setGuestName] = useState(
    persona?.name && persona.id !== 'visitor' ? persona.name : ''
  )
  const [guestEmail, setGuestEmail] = useState(
    persona?.email && persona.id !== 'visitor' ? persona.email : ''
  )
  const [guestInfoError, setGuestInfoError] = useState('')

  // Noon anchor avoids DST edge-case miscounts (consistent with BookPage)
  const nights = checkIn && checkOut
    ? Math.max(0, (new Date(checkOut + 'T12:00:00') - new Date(checkIn + 'T12:00:00')) / 86400000)
    : 0

  const addOnTotal = selectedAddOns.reduce((sum, id) => {
    const a = ADD_ONS.find(a => a.id === id)
    return sum + (a?.price || 0)
  }, 0)

  const roomSubtotal = selectedRoom ? selectedRoom.price * nights : 0
  const total = roomSubtotal + addOnTotal

  function toggleAddOn(id) {
    setSelectedAddOns(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function handleGuestInfoNext() {
    if (!guestName.trim()) {
      setGuestInfoError('Please enter your full name.')
      return
    }
    if (!isValidEmail(guestEmail)) {
      setGuestInfoError('Please enter a valid email address.')
      return
    }
    setGuestInfoError('')
    advanceTo(5)
  }

  function handleAddToPending() {
    if (cartFull) return

    // Add to cart instead of inserting into Supabase. Checkout.jsx is the only
    // place that talks to the bookings table — it sets expires_at and the rest
    // of the DB fields when the order is finalised.
    const added = addToCart({
      room:            selectedRoom,
      checkIn,
      checkOut,
      numGuests,
      nights,
      addOns:          selectedAddOns.map(id => ADD_ONS.find(a => a.id === id)).filter(Boolean),
      specialRequests,
      total,
      // Carry guest info so Checkout.jsx can pre-fill its name/email fields
      guestName:  guestName.trim(),
      guestEmail: guestEmail.trim().toLowerCase(),
    })

    if (added) {
      advanceTo(6)
      onComplete?.(selectedRoom?.name)
    }
  }

  function handleGoToCheckout() {
    // Close the overlay first so it doesn't linger over /checkout after navigation
    onCancel?.()
    navigate('/checkout')
  }

  // ─── Step 6 — Success: Added to Pending ────────────────────────────────
  if (step === 6) {
    return (
      <div className="booking-flow" ref={containerRef}>
        <div className="booking-progress">
          {STEP_LABELS.map(label => (
            <div key={label} className="booking-step-dot done">
              <span>✓</span>
              <p>{label}</p>
            </div>
          ))}
        </div>
        <div className="booking-confirmed">
          <span className="booking-confirmed-icon">🛒</span>
          <h3>Added to Pending!</h3>
          <p>{selectedRoom?.name} is saved to your cart.</p>
          <div className="booking-ref-box">
            <span>Total</span>
            <strong>${total}</strong>
          </div>
          <div className="booking-actions" style={{ justifyContent: 'center', gap: '0.75rem' }}>
            <button className="booking-cancel" onClick={onCancel}>Close</button>
            <button className="btn-primary" onClick={handleGoToCheckout}>
              Go to Checkout →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-flow">
      {/* Progress — 6 steps */}
      <div className="booking-progress">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className={`booking-step-dot ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
            <span>{step > i + 1 ? '✓' : i + 1}</span>
            <p>{label}</p>
          </div>
        ))}
      </div>

      {/* ─── Step 1 — Room ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="booking-section">
          <p className="booking-section-title">Which room calls to you?</p>
          <div className="booking-room-list">
            {ROOMS.map(room => (
              <button
                key={room.name}
                className={`booking-room-option ${selectedRoom?.name === room.name ? 'selected' : ''}`}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="booking-room-option-info">
                  <p className="booking-room-option-name">{room.name}</p>
                  <p className="booking-room-option-desc">{room.desc}</p>
                </div>
                <span className="booking-room-option-price">${room.price}/night</span>
              </button>
            ))}
          </div>
          <div className="booking-actions">
            <button className="booking-cancel" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" onClick={() => advanceTo(2)} disabled={!selectedRoom}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2 — Dates + Guests ───────────────────────────────────── */}
      {/* Date inputs stack vertically (no `booking-date-row`) — the chat   */}
      {/* widget is too narrow to render them side-by-side comfortably.     */}
      {step === 2 && (
        <div className="booking-section">
          <p className="booking-section-title">When are you planning to visit?</p>
          <div className="booking-field">
            <label>Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setCheckIn(e.target.value)}
              className="input"
            />
          </div>
          <div className="booking-field">
            <label>Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || new Date().toISOString().split('T')[0]}
              onChange={e => setCheckOut(e.target.value)}
              className="input"
            />
          </div>
          <div className="booking-field">
            <label>Number of guests</label>
            <select
              value={numGuests}
              onChange={e => setNumGuests(Number(e.target.value))}
              className="input"
            >
              {Array.from({ length: selectedRoom?.capacity || 2 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div className="booking-field">
            <label>Special requests <span className="optional">(optional)</span></label>
            <textarea
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder="Early check-in, dietary requirements, celebrations..."
              className="input"
              rows={2}
            />
          </div>
          {nights > 0 && (
            <div className="booking-price-preview">
              {nights} night{nights > 1 ? 's' : ''} × ${selectedRoom?.price} = <strong>${roomSubtotal}</strong>
            </div>
          )}
          <div className="booking-actions">
            <button className="booking-cancel" onClick={() => setStep(1)}>← Back</button>
            <button
              className="btn-primary"
              onClick={() => advanceTo(3)}
              disabled={!checkIn || !checkOut || nights < 1}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3 — Add-ons ──────────────────────────────────────────── */}
      {step === 3 && (
        <div className="booking-section">
          <p className="booking-section-title">Enhance your stay</p>
          <div className="addon-list">
            {ADD_ONS.map(a => (
              <button
                key={a.id}
                className={`addon-option ${selectedAddOns.includes(a.id) ? 'selected' : ''}`}
                onClick={() => toggleAddOn(a.id)}
              >
                <div className="addon-option-info">
                  <p className="addon-option-name">{a.label}</p>
                  <p className="addon-option-unit">{a.unit}</p>
                </div>
                <div className="addon-option-right">
                  <span className="addon-option-price">+${a.price}</span>
                  <span className="addon-check">{selectedAddOns.includes(a.id) ? '✓' : '+'}</span>
                </div>
              </button>
            ))}
          </div>
          {addOnTotal > 0 && (
            <div className="booking-price-preview">
              Add-ons: +${addOnTotal} · Room: ${roomSubtotal} · <strong>Total: ${total}</strong>
            </div>
          )}
          <div className="booking-actions">
            <button className="booking-cancel" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary" onClick={() => advanceTo(4)}>Next →</button>
          </div>
        </div>
      )}

      {/* ─── Step 4 — Guest Info ───────────────────────────────────────── */}
      {step === 4 && (
        <div className="booking-section">
          <p className="booking-section-title">Your details</p>
          <div className="booking-field">
            <label>Full Name</label>
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Your name"
              className="input"
              autoComplete="name"
            />
          </div>
          <div className="booking-field">
            <label>Email</label>
            <input
              type="email"
              value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              autoComplete="email"
            />
          </div>
          {guestInfoError && <p className="error-msg">{guestInfoError}</p>}
          <div className="booking-actions">
            <button className="booking-cancel" onClick={() => setStep(3)}>← Back</button>
            <button className="btn-primary" onClick={handleGuestInfoNext}>
              Review →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 5 — Review ───────────────────────────────────────────── */}
      {step === 5 && (
        <div className="booking-section">
          <p className="booking-section-title">Review your request</p>
          <div className="booking-review">
            <div><span>Room</span><strong>{selectedRoom?.name}</strong></div>
            <div><span>Check-in</span><strong>{checkIn}</strong></div>
            <div><span>Check-out</span><strong>{checkOut}</strong></div>
            <div><span>Guests</span><strong>{numGuests}</strong></div>
            <div><span>Duration</span><strong>{nights} night{nights > 1 ? 's' : ''}</strong></div>
            {selectedAddOns.length > 0 && (
              <div>
                <span>Add-ons</span>
                <strong>
                  {selectedAddOns.map(id => ADD_ONS.find(a => a.id === id)?.label).filter(Boolean).join(', ')}
                </strong>
              </div>
            )}
            <div><span>Total</span><strong>${total}</strong></div>
            <div><span>Name</span><strong>{guestName}</strong></div>
            <div><span>Email</span><strong>{guestEmail}</strong></div>
            {specialRequests && <div><span>Requests</span><strong>{specialRequests}</strong></div>}
          </div>
          {cartFull && (
            <p className="error-msg" style={{ marginTop: '0.75rem' }}>
              Cart is full ({maxCartItems} items max). Please check out before adding more.
            </p>
          )}
          <div className="booking-actions">
            <button className="booking-cancel" onClick={() => setStep(4)}>← Back</button>
            <button
              className="btn-primary"
              onClick={handleAddToPending}
              disabled={cartFull}
            >
              Add to Pending 🛒
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
