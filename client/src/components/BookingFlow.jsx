import { useState } from 'react'
import { supabase } from '../supabase'
import { ROOMS } from '../data/rooms'
import { ADD_ONS } from '../data/addons'

function generateRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return 'SR-' + Array.from(bytes, b => chars[b % chars.length]).join('')
}

// Step indices:
//   1 = Room, 2 = Dates, 3 = Add-ons, 4 = Review, 5 = Confirmation
const STEP_LABELS = ['Room', 'Dates', 'Add-ons', 'Review']

export default function BookingFlow({ persona, onComplete, onCancel }) {
  const [step, setStep] = useState(1)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [numGuests, setNumGuests] = useState(1)
  const [selectedAddOns, setSelectedAddOns] = useState([])
  const [specialRequests, setSpecialRequests] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(null)
  const [error, setError] = useState('')

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

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', selectedRoom.name)
        .single()

      if (roomError || !roomData) throw new Error('Room lookup failed')

      const ref = generateRef()
      const { error: insertError } = await supabase.from('bookings').insert({
        booking_ref: ref,
        guest_name: persona?.name || 'Guest',
        guest_email: persona?.email || 'guest@demo.com',
        room_id: roomData.id,
        check_in: checkIn,
        check_out: checkOut,
        num_guests: numGuests,
        total_price: total,
        status: 'confirmed',
        special_requests: specialRequests || null,
        add_ons: selectedAddOns
          .map(id => ADD_ONS.find(a => a.id === id)?.label)
          .filter(Boolean),
        protected: false,
        expires_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      })

      if (insertError) throw insertError

      setConfirmed(ref)
      setStep(5)
      onComplete?.(ref)
    } catch (err) {
      console.error(err)
      setError('Unable to confirm booking. Please try again.')
    }
    setLoading(false)
  }

  // ─── Step 5 — Confirmation ──────────────────────────────────────────────
  if (step === 5 && confirmed) {
    return (
      <div className="booking-flow">
        <div className="booking-confirmed">
          <span className="booking-confirmed-icon">🌿</span>
          <h3>Booking Confirmed!</h3>
          <p>We look forward to welcoming you to Serai Retreat.</p>
          <div className="booking-ref-box">
            <span>Reference</span>
            <strong>{confirmed}</strong>
          </div>
          <div className="booking-summary-mini">
            <div><span>Room</span><strong>{selectedRoom?.name}</strong></div>
            <div><span>Check-in</span><strong>{checkIn}</strong></div>
            <div><span>Check-out</span><strong>{checkOut}</strong></div>
            <div><span>Guests</span><strong>{numGuests}</strong></div>
            <div><span>Total</span><strong>${total}</strong></div>
          </div>
          <button className="btn-primary" onClick={onCancel}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-flow">
      {/* Progress — 4 steps */}
      <div className="booking-progress">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className={`booking-step-dot ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
            <span>{step > i + 1 ? '✓' : i + 1}</span>
            <p>{label}</p>
          </div>
        ))}
      </div>

      {/* ─── Step 1 — Room Selection ──────────────────────────────────── */}
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
            <button className="btn-primary" onClick={() => setStep(2)} disabled={!selectedRoom}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2 — Dates + Guests ──────────────────────────────────── */}
      {/* Date inputs stack vertically (no `booking-date-row`) — the chat */}
      {/* widget is too narrow to render them side-by-side comfortably.    */}
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
              onClick={() => setStep(3)}
              disabled={!checkIn || !checkOut || nights < 1}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3 — Add-ons ─────────────────────────────────────────── */}
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
            <button className="btn-primary" onClick={() => setStep(4)}>Review →</button>
          </div>
        </div>
      )}

      {/* ─── Step 4 — Review + Confirm ────────────────────────────────── */}
      {step === 4 && (
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
            {selectedAddOns.length > 0 && (
              <div>
                <span>Add-ons</span>
                <strong>
                  {selectedAddOns.map(id => ADD_ONS.find(a => a.id === id)?.label).filter(Boolean).join(', ')}
                </strong>
              </div>
            )}
            <div><span>Total</span><strong>${total}</strong></div>
            {specialRequests && <div><span>Requests</span><strong>{specialRequests}</strong></div>}
          </div>
          {error && <p className="error-msg" style={{ marginTop: '0.75rem' }}>{error}</p>}
          <div className="booking-actions">
            <button className="booking-cancel" onClick={() => setStep(3)}>← Back</button>
            <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm Booking 🌿'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
