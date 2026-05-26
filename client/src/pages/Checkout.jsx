import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../supabase'

function generateRef() {
  return 'SR-' + Math.floor(1000 + Math.random() * 9000)
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Checkout() {
  const { cart, clearCart, cartCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [refs, setRefs] = useState([])
  const [error, setError] = useState('')

  const addOnLabels = (addOns) => addOns?.map(a => a?.label).filter(Boolean).join(', ') || '—'
  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0)

  async function generateUniqueRef() {
    let ref, exists
    do {
      ref = generateRef()
      const { data } = await supabase
        .from('bookings')
        .select('booking_ref')
        .eq('booking_ref', ref)
        .single()
      exists = !!data
    } while (exists)
    return ref
  }

  async function handleFinishOrder() {
    if (!name.trim() || !isValidEmail(email)) {
      setError('Please enter a valid name and email.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      // Batch fetch all room IDs in one query
      const roomNames = [...new Set(cart.map(item => item.room.name))]
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name')
        .in('name', roomNames)

      if (roomsError) throw roomsError

      const roomMap = Object.fromEntries(roomsData.map(r => [r.name, r.id]))

      // Build all inserts
      const inserts = await Promise.all(cart.map(async (item) => {
        const ref = await generateUniqueRef()
        return {
          booking_ref: ref,
          guest_name: name.trim(),
          guest_email: email.trim().toLowerCase(),
          room_id: roomMap[item.room.name] || null,
          check_in: item.checkIn,
          check_out: item.checkOut,
          num_guests: item.numGuests,
          total_price: item.total,
          status: 'confirmed',
          special_requests: item.specialRequests || null,
          add_ons: item.addOns?.map(a => a?.label).filter(Boolean) || [],
          protected: false,
          expires_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        }
      }))

      const { error: insertError } = await supabase.from('bookings').insert(inserts)
      if (insertError) throw insertError

      clearCart()
      setRefs(inserts.map(i => i.booking_ref))
      setDone(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    }

    setSubmitting(false)
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
        {done ? (
          <div className="checkout-success">
            <div className="checkout-success-icon">✓</div>
            <h1>Booking Confirmed!</h1>
            <p>Thank you, {name}. Your reservation{refs.length > 1 ? 's are' : ' is'} confirmed.</p>
            <div className="checkout-refs">
              {refs.map(r => (
                <div key={r} className="checkout-ref-pill">{r}</div>
              ))}
            </div>
            <p className="checkout-ref-note">
              Save your reference number{refs.length > 1 ? 's' : ''}. Use them with your email to look up your booking under <strong>My Booking</strong>.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <Link to="/my-booking" className="btn-primary">View My Booking</Link>
              <Link to="/" className="btn-secondary">Back to Home</Link>
            </div>
          </div>
        ) : cartCount === 0 ? (
          <div className="checkout-empty">
            <h1 className="page-title">Checkout</h1>
            <p>Your cart is empty.</p>
            <Link to="/rooms" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>Browse Rooms</Link>
          </div>
        ) : (
          <>
            <h1 className="page-title">Checkout</h1>
            <p className="page-sub">Review your selections and complete your booking.</p>

            <div className="checkout-items">
              {cart.map((item, i) => (
                <div key={i} className="checkout-item">
                  <div className="checkout-item-header">
                    <h3>{item.room?.name}</h3>
                    <strong>${item.total}</strong>
                  </div>
                  <div className="checkout-item-meta">
                    <span>{item.checkIn} → {item.checkOut}</span>
                    <span>{item.nights} night{item.nights > 1 ? 's' : ''} · {item.numGuests} guest{item.numGuests > 1 ? 's' : ''}</span>
                    {item.addOns?.length > 0 && <span>Add-ons: {addOnLabels(item.addOns)}</span>}
                    {item.specialRequests && <span>Requests: {item.specialRequests}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-summary">
              <div><span>Subtotal</span><strong>${grandTotal}</strong></div>
              <div><span>Taxes & fees</span><strong>Included</strong></div>
              <div className="checkout-total"><span>Total</span><strong>${grandTotal}</strong></div>
            </div>

            <div className="checkout-guest-info">
              <h2>Guest Information</h2>
              <div className="booking-field">
                <label>Full Name</label>
                <input className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="booking-field">
                <label>Email</label>
                <input className="input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="checkout-payment-demo">
              <div className="checkout-demo-banner">DEMO — Payment not processed</div>
              <div className="checkout-payment-fields">
                <div className="booking-field">
                  <label>Card Number</label>
                  <input className="input" placeholder="4242 4242 4242 4242" disabled />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="booking-field" style={{ flex: 1 }}>
                    <label>Expiry</label>
                    <input className="input" placeholder="MM/YY" disabled />
                  </div>
                  <div className="booking-field" style={{ flex: 1 }}>
                    <label>CVV</label>
                    <input className="input" placeholder="•••" disabled />
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="error-msg" style={{ marginTop: '1rem' }}>{error}</p>}

            <div className="booking-actions" style={{ marginTop: '2rem' }}>
              <Link to="/book" className="booking-cancel">← Add Another Room</Link>
              <button
                className="btn-primary"
                onClick={handleFinishOrder}
                disabled={submitting || !name.trim() || !email.trim()}
              >
                {submitting ? 'Confirming...' : 'Finish Order →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}