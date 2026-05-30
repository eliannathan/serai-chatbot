import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ROOMS, slugifyRoomName } from '../data/rooms'
import { ADD_ONS } from '../data/addons'
import { getPersonaDefaults } from '../utils/personaUtils'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// 6-step progress: input on steps 1–5, success screen on step 6.
// Labels kept short (≤7 chars) so the row fits in the ~340px chat widget.
const STEP_LABELS = ['Room', 'Dates', 'Add-ons', 'Info', 'Review', 'Done']

// Placeholder values we never want to treat as real guest details when pre-filling.
const PLACEHOLDER_NAME = 'guest'
const PLACEHOLDER_EMAIL = 'guest@gmail.com'

// sessionStorage key for an in-progress booking draft, so accidentally closing
// and reopening the overlay restores the user's progress.
const DRAFT_KEY = 'serai_booking_draft'

// All sessionStorage access is wrapped — private browsing / disabled storage
// throws on access, and JSON.parse can throw on corrupt data.
function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore storage errors
  }
}

export default function BookingFlow({ onComplete, onCancel }) {
  const navigate = useNavigate()
  const { cart, addToCart, cartFull, maxCartItems } = useCart()

  // Read any saved draft once on mount. Only restorable if it carries a room;
  // step is clamped to 1–5 so we never resume directly onto the success screen.
  const [draft] = useState(() => loadDraft())
  const validDraft = Boolean(draft?.selectedRoom)

  const [step, setStep] = useState(() =>
    validDraft ? Math.min(Math.max(draft.currentStep || 1, 1), 5) : 1
  )
  // Scroll container ref — reset to top when advancing steps so users always
  // land at the top of the new step's content (not halfway down a long form).
  const containerRef = useRef(null)

  function advanceTo(n) {
    setStep(n)
    if (containerRef.current) containerRef.current.scrollTop = 0
  }

  const [selectedRoom, setSelectedRoom] = useState(() => {
    if (!validDraft) return null
    // Re-resolve against the canonical ROOMS list so price/capacity stay current;
    // fall back to the stored object if the room is no longer in the list.
    return ROOMS.find(r => r.id === draft.selectedRoom.id) || draft.selectedRoom
  })
  const [checkIn, setCheckIn] = useState(() => (validDraft ? draft.checkIn || '' : ''))
  const [checkOut, setCheckOut] = useState(() => (validDraft ? draft.checkOut || '' : ''))
  const [numGuests, setNumGuests] = useState(() => (validDraft ? draft.numGuests || 1 : 1))
  const [selectedAddOns, setSelectedAddOns] = useState(() =>
    validDraft && Array.isArray(draft.selectedAddOns) ? draft.selectedAddOns : []
  )
  const [specialRequests, setSpecialRequests] = useState(() =>
    validDraft ? draft.specialRequests || '' : ''
  )

  // Pre-fill name/email from an earlier cart item that carries real guest details.
  // Empty values and the "guest"/"guest@gmail.com" placeholders are ignored, so
  // a first-time guest always starts with blank fields.
  const prefillSource = cart.find(i =>
    i.guestName?.trim() && i.guestName.trim().toLowerCase() !== PLACEHOLDER_NAME &&
    i.guestEmail?.trim() && i.guestEmail.trim().toLowerCase() !== PLACEHOLDER_EMAIL
  )
  // A restored draft takes priority over the cart prefill (it's the user's most
  // recent in-progress input), then the cart prefill, then the active persona.
  // Each initializer runs once on mount so user edits are never clobbered.
  const [guestName, setGuestName] = useState(() =>
    validDraft
      ? draft.guestName || ''
      : prefillSource?.guestName?.trim() || getPersonaDefaults()?.name || ''
  )
  const [guestEmail, setGuestEmail] = useState(() =>
    validDraft
      ? draft.guestEmail || ''
      : prefillSource?.guestEmail?.trim() || getPersonaDefaults()?.email || ''
  )
  const [prefilledFromCart] = useState(Boolean(prefillSource) && !validDraft)
  const [guestInfoError, setGuestInfoError] = useState('')

  // Persist the in-progress draft on every step/field change. The success screen
  // (step 6) is skipped — by then the booking is in the cart and the draft has
  // been cleared, so there's nothing to save.
  useEffect(() => {
    if (step === 6) return
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        currentStep: step,
        selectedRoom,
        checkIn,
        checkOut,
        numGuests,
        specialRequests,
        selectedAddOns,
        guestName,
        guestEmail,
      }))
    } catch {
      // ignore storage errors (private browsing, quota exceeded, etc.)
    }
  }, [step, selectedRoom, checkIn, checkOut, numGuests, specialRequests, selectedAddOns, guestName, guestEmail])

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
      // Booking is now in the cart — discard the draft so the next open starts fresh.
      clearDraft()
      advanceTo(6)
      onComplete?.(selectedRoom?.name)
    }
  }

  // Cancelling/closing the flow discards the draft so reopening starts fresh.
  function handleCancel() {
    clearDraft()
    onCancel?.()
  }

  function handleGoToCheckout() {
    // Close the overlay first so it doesn't linger over /checkout after navigation
    handleCancel()
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
            <button className="booking-cancel" onClick={handleCancel}>Close</button>
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
          <div className="booking-step-content">
          <p className="booking-section-title">Which room calls to you?</p>
          <div className="booking-room-list">
            {ROOMS.map(room => (
              <div key={room.name} className="booking-room-item">
                <button
                  className={`booking-room-option ${selectedRoom?.name === room.name ? 'selected' : ''}`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="booking-room-option-info">
                    <p className="booking-room-option-name">{room.name}</p>
                    <p className="booking-room-option-desc">{room.desc}</p>
                  </div>
                  <span className="booking-room-option-price">${room.price}/night</span>
                </button>
                {/* Lets the user see full room photos/details without abandoning
                    the flow via a hard cancel. Routes to this room's detail page. */}
                <button
                  type="button"
                  className="booking-room-details-link"
                  onClick={() => navigate(`/rooms/${slugifyRoomName(room.name)}`)}
                >
                  View details →
                </button>
              </div>
            ))}
          </div>
          </div>
          <div className="booking-actions">
            <button className="booking-cancel" onClick={handleCancel}>Cancel</button>
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
          <div className="booking-step-content">
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
          </div>
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
          <div className="booking-step-content">
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
          </div>
          <div className="booking-actions">
            <button className="booking-cancel" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary" onClick={() => advanceTo(4)}>Next →</button>
          </div>
        </div>
      )}

      {/* ─── Step 4 — Guest Info ───────────────────────────────────────── */}
      {step === 4 && (
        <div className="booking-section">
          <div className="booking-step-content">
          <p className="booking-section-title">Your details</p>
          {prefilledFromCart && (
            <p className="booking-prefill-note">Using details from your previous booking</p>
          )}
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
          </div>
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
          <div className="booking-step-content">
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
          </div>
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
