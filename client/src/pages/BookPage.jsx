import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useCart } from "../context/CartContext"

const ROOMS = [
  { name: 'Jungle Suite', price: 120, desc: 'Garden view · King bed · Private outdoor shower', capacity: 2 },
  { name: 'Terrace Villa', price: 220, desc: 'Rice terrace view · King bed · Private plunge pool', capacity: 2 },
  { name: 'Retreat Villa', price: 380, desc: 'Panoramic view · King bed · Private infinity pool', capacity: 4 },
]

const ADD_ONS = [
  { id: 'airport', label: 'Airport Transfer', price: 45, unit: 'one-way' },
  { id: 'spa', label: 'Balinese Spa Treatment', price: 35, unit: 'per session' },
  { id: 'cooking', label: 'Cooking Class', price: 25, unit: 'per person' },
  { id: 'yoga', label: 'Private Yoga Session', price: 20, unit: 'per session' },
]

export default function BookPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  const preselected = searchParams.get('room')

  const [added, setAdded] = useState(false)

  const [step, setStep] = useState(1)
  const [selectedRoom, setSelectedRoom] = useState(
    ROOMS.find(r => r.name === preselected) || null
  )
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [numGuests, setNumGuests] = useState(1)
  const [selectedAddOns, setSelectedAddOns] = useState([])
  const [specialRequests, setSpecialRequests] = useState('')

  useEffect(() => {
    if (preselected) {
      const room = ROOMS.find(r => r.name === preselected)
      if (room) { setSelectedRoom(room); setStep(2) }
    }
  }, [preselected])

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0

  const addOnTotal = selectedAddOns.reduce((sum, id) => {
    const a = ADD_ONS.find(a => a.id === id)
    return sum + (a?.price || 0)
  }, 0)

  const total = selectedRoom ? (selectedRoom.price * nights) + addOnTotal : 0

  function toggleAddOn(id) {
    setSelectedAddOns(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function handleAddToPending() {
    addToCart({
      room: selectedRoom,
      checkIn, checkOut, numGuests, nights,
      addOns: selectedAddOns.map(id => ADD_ONS.find(a => a.id === id)),
      specialRequests, total,
    })
    setAdded(true)
  }

  return (
    <div className="page">
      <nav className="nav">
        <Link to="/" className="nav-logo">SERAI</Link>
        <div className="nav-links">
          <Link to="/rooms">Rooms</Link>
          <Link to="/amenities">Amenities</Link>
          <Link to="/my-booking">My Booking</Link>
        </div>
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>✕</button>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/rooms" onClick={() => setMenuOpen(false)}>Rooms</Link>
        <Link to="/amenities" onClick={() => setMenuOpen(false)}>Amenities</Link>
        <Link to="/my-booking" onClick={() => setMenuOpen(false)}>My Booking</Link>
      </div>

      <div className="page-content" style={{ maxWidth: 680 }}>
        <h1 className="page-title">Book Your Stay</h1>
        <p className="page-sub">Complete your reservation details below.</p>

        {/* Progress */}
        <div className="booking-progress" style={{ marginBottom: '2rem' }}>
          {['Room', 'Dates & Guests', 'Add-ons', 'Review'].map((label, i) => (
            <div key={label} className={`booking-step-dot ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
              <span>{step > i + 1 ? '✓' : i + 1}</span>
              <p>{label}</p>
            </div>
          ))}
        </div>

        {/* Step 1 — Room */}
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
              <Link to="/rooms" className="booking-cancel">← Back to Rooms</Link>
              <button className="btn-primary" onClick={() => setStep(2)} disabled={!selectedRoom}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Dates & Guests */}
        {step === 2 && (
          <div className="booking-section">
            <p className="booking-section-title">When are you visiting?</p>
            <div className="booking-date-row">
                <div className="booking-field">
                    <label>Check-in</label>
                    <input type="date" value={checkIn}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => {
                        setCheckIn(e.target.value)
                        if (checkOut && e.target.value >= checkOut) setCheckOut('')
                    }}
                    className="input" />
                </div>
                <div className="booking-field">
                    <label>Check-out</label>
                    <input type="date" value={checkOut}
                    min={checkIn ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={e => {
                        setCheckOut(e.target.value)
                        if (checkIn && e.target.value <= checkIn) setCheckIn('')
                    }}
                    className="input" />
                </div>
                </div>
            <div className="booking-field">
              <label>Guests</label>
              <select value={numGuests} onChange={e => setNumGuests(Number(e.target.value))} className="input">
                {Array.from({ length: selectedRoom?.capacity || 2 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="booking-field">
              <label>Special requests <span className="optional">(optional)</span></label>
              <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                placeholder="Early check-in, dietary needs, celebrations..."
                className="input" rows={2} />
            </div>
            {nights > 0 && (
              <div className="booking-price-preview">
                {nights} night{nights > 1 ? 's' : ''} × ${selectedRoom?.price} = <strong>${selectedRoom?.price * nights}</strong>
              </div>
            )}
            <div className="booking-actions">
              <button className="booking-cancel" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(3)}
                disabled={!checkIn || !checkOut || nights < 1}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Add-ons */}
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
                Add-ons: +${addOnTotal} · Room: ${selectedRoom?.price * nights} · <strong>Total: ${total}</strong>
              </div>
            )}
            <div className="booking-actions">
              <button className="booking-cancel" onClick={() => setStep(2)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(4)}>Review →</button>
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && !added && (
          <div className="booking-section">
            <p className="booking-section-title">Review your booking</p>
            <div className="booking-review">
              <div><span>Room</span><strong>{selectedRoom?.name}</strong></div>
              <div><span>Check-in</span><strong>{checkIn}</strong></div>
              <div><span>Check-out</span><strong>{checkOut}</strong></div>
              <div><span>Duration</span><strong>{nights} night{nights > 1 ? 's' : ''}</strong></div>
              <div><span>Guests</span><strong>{numGuests}</strong></div>
              {selectedAddOns.length > 0 && (
                <div><span>Add-ons</span><strong>{selectedAddOns.map(id => ADD_ONS.find(a => a.id === id)?.label).join(', ')}</strong></div>
              )}
              {specialRequests && <div><span>Requests</span><strong>{specialRequests}</strong></div>}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span>Est. Total</span><strong style={{ color: 'var(--earth)', fontSize: '1.1rem' }}>${total}</strong>
              </div>
            </div>
            <p className="booking-note" style={{ marginTop: '1rem' }}>
              This adds your room to pending. Complete payment at checkout to confirm.
            </p>
            <div className="booking-actions">
              <button className="booking-cancel" onClick={() => setStep(3)}>← Back</button>
              <button className="btn-primary" onClick={handleAddToPending}>
                Add to Pending 🛒
              </button>
            </div>
          </div>
        )}
        {/* Added confirmation */}
        {added && (
          <div className="booking-section" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Added to Pending!</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
              Your room has been saved. What would you like to do next?
            </p>
            <div className="booking-actions" style={{ justifyContent: 'center', gap: '1rem' }}>
              <Link to="/" className="btn-secondary">← Back to Home</Link>
              <Link to="/checkout" className="btn-primary">Proceed to Checkout →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}