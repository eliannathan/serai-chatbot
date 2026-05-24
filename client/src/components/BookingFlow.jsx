import { useState } from 'react'

const ROOMS = [
  { name: 'Jungle Suite', price: 120, desc: 'Garden view, king bed, private outdoor shower', capacity: 2 },
  { name: 'Terrace Villa', price: 220, desc: 'Rice terrace view, king bed, private plunge pool', capacity: 2 },
  { name: 'Retreat Villa', price: 380, desc: 'Panoramic view, king bed, private infinity pool', capacity: 4 },
]

export default function BookingFlow({ persona, onComplete, onCancel }) {
  const [step, setStep] = useState(1)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [numGuests, setNumGuests] = useState(1)
  const [specialRequests, setSpecialRequests] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(null)

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 0

  const total = selectedRoom ? selectedRoom.price * nights : 0

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          persona,
          bookingRequest: {
            guest_name: persona?.name || 'Guest',
            guest_email: persona?.email || '',
            room_name: selectedRoom.name,
            check_in: checkIn,
            check_out: checkOut,
            num_guests: numGuests,
            special_requests: specialRequests || null,
          }
        })
      })
      const data = await res.json()
      if (data.bookingConfirmed) {
        setConfirmed(data.ref)
        setStep(4)
        onComplete?.(data.ref)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  // Step 4 — Confirmation
  if (step === 4 && confirmed) {
    return (
      <div className="booking-flow">
        <div className="booking-confirmed">
          <span className="booking-confirmed-icon">🌿</span>
          <h3>Request Received!</h3>
          <p>Your booking request has been submitted. Our team will confirm within 24 hours.</p>
          <div className="booking-ref-box">
            <span>Reference</span>
            <strong>{confirmed}</strong>
          </div>
          <div className="booking-summary-mini">
            <div><span>Room</span><strong>{selectedRoom?.name}</strong></div>
            <div><span>Check-in</span><strong>{checkIn}</strong></div>
            <div><span>Check-out</span><strong>{checkOut}</strong></div>
            <div><span>Guests</span><strong>{numGuests}</strong></div>
            <div><span>Est. Total</span><strong>${total}</strong></div>
          </div>
          <button className="btn-primary" onClick={onCancel}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-flow">
      {/* Progress */}
      <div className="booking-progress">
        {['Room', 'Dates', 'Review'].map((label, i) => (
          <div key={label} className={`booking-step-dot ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
            <span>{step > i + 1 ? '✓' : i + 1}</span>
            <p>{label}</p>
          </div>
        ))}
      </div>

      {/* Step 1 — Room Selection */}
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
            <button
              className="btn-primary"
              onClick={() => setStep(2)}
              disabled={!selectedRoom}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Dates + Guests */}
      {step === 2 && (
        <div className="booking-section">
          <p className="booking-section-title">When are you planning to visit?</p>
          <div className="booking-date-row">
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
              {nights} night{nights > 1 ? 's' : ''} × ${selectedRoom?.price} = <strong>${total}</strong>
            </div>
          )}
          <div className="booking-actions">
            <button className="booking-cancel" onClick={() => setStep(1)}>← Back</button>
            <button
              className="btn-primary"
              onClick={() => setStep(3)}
              disabled={!checkIn || !checkOut || nights < 1}
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div className="booking-section">
          <p className="booking-section-title">Review your request</p>
          <div className="booking-review">
            <div><span>Guest</span><strong>{persona?.name || 'Guest'}</strong></div>
            <div><span>Email</span><strong>{persona?.email || '—'}</strong></div>
            <div><span>Room</span><strong>{selectedRoom?.name}</strong></div>
            <div><span>Check-in</span><strong>{checkIn}</strong></div>
            <div><span>Check-out</span><strong>{checkOut}</strong></div>
            <div><span>Guests</span><strong>{numGuests}</strong></div>
            <div><span>Duration</span><strong>{nights} night{nights > 1 ? 's' : ''}</strong></div>
            <div><span>Est. Total</span><strong>${total}</strong></div>
            {specialRequests && <div><span>Requests</span><strong>{specialRequests}</strong></div>}
          </div>
          <p className="booking-note">
            This submits a booking inquiry. Our team will confirm availability and contact you within 24 hours.
          </p>
          <div className="booking-actions">
            <button className="booking-cancel" onClick={() => setStep(2)}>← Back</button>
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request 🌿'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}