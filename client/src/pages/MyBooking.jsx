import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useCart } from "../context/CartContext"

export default function MyBooking() {
  const [ref, setRef] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { cartCount: pendingCount } = useCart()

  async function handleLookup() {
    setLoading(true)
    setError('')
    setBooking(null)

    const { data, error: err } = await supabase
      .from('bookings')
      .select('*, rooms(name, type)')
      .eq('booking_ref', ref.trim().toUpperCase())
      .eq('guest_email', email.trim().toLowerCase())
      .single()

    if (err || !data) {
      setError('No booking found. Please check your reference and email.')
    } else {
      setBooking(data)
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <nav className="nav">
        <Link to="/" className="nav-logo">SERAI</Link>
        <div className="nav-links">
          <Link to="/rooms">Rooms</Link>
          <Link to="/amenities">Amenities</Link>
          <Link to="/my-booking">My Booking</Link>
          {pendingCount > 0 && (
            <Link to="/checkout" className="nav-pending">
              Pending <span className="nav-pending-badge">{pendingCount}</span>
            </Link>
          )}
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
        {pendingCount > 0 && (
          <Link to="/checkout" onClick={() => setMenuOpen(false)}>
            Pending ({pendingCount})
          </Link>
        )}
      </div>

      <div className="page-content narrow">
        <h1 className="page-title">My Booking</h1>
        <p className="page-sub">Enter your booking reference and email to view your reservation.</p>

        <div className="booking-form">
          <input
            placeholder="Booking reference (e.g. SR-2847)"
            value={ref}
            onChange={e => setRef(e.target.value)}
            className="input"
          />
          <input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
          />
          <button onClick={handleLookup} className="btn-primary" disabled={loading}>
            {loading ? 'Looking up...' : 'Find My Booking'}
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        {booking && (
          <div className="booking-result">
            <h2>{booking.rooms?.name}</h2>
            <div className="booking-details">
              <div><span>Reference</span><strong>{booking.booking_ref}</strong></div>
              <div><span>Guest</span><strong>{booking.guest_name}</strong></div>
              <div><span>Check-in</span><strong>{booking.check_in}</strong></div>
              <div><span>Check-out</span><strong>{booking.check_out}</strong></div>
              <div><span>Total</span><strong>${booking.total_price}</strong></div>
              <div><span>Status</span><strong className={`status-${booking.status}`}>{booking.status}</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}