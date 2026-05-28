import { useState } from 'react'
import { supabase } from '../supabase'
import NavBar from '../components/NavBar'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function MyBooking() {
  const [email, setEmail] = useState('')
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLookup() {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')
    setBookings([])

    const { data, error: err } = await supabase
      .from('bookings')
      .select('booking_ref, guest_name, check_in, check_out, total_price, status, rooms(name, type)')
      .eq('guest_email', email.trim().toLowerCase())
      .order('check_in', { ascending: true })

    if (err || !data || data.length === 0) {
      setError('No bookings found for this email address.')
    } else {
      setBookings(data)
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <NavBar />

      <div className="page-content narrow">
        <h1 className="page-title">My Booking</h1>
        <p className="page-sub">Enter your email to view all your reservations.</p>

        <div className="booking-form">
          <input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            className="input"
          />
          <button
            onClick={handleLookup}
            className="btn-primary"
            disabled={loading || !email.trim()}
          >
            {loading ? 'Looking up...' : 'Find My Bookings'}
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        {bookings.length > 0 && (
          <div className="bookings-list">
            <p className="bookings-count">{bookings.length} booking{bookings.length > 1 ? 's' : ''} found</p>
            {bookings.map(booking => (
              <div key={booking.booking_ref} className="booking-result">
                <div className="booking-result-header">
                  <h2>{booking.rooms?.name}</h2>
                  <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                </div>
                <div className="booking-details">
                  <div><span>Reference</span><strong>{booking.booking_ref}</strong></div>
                  <div><span>Guest</span><strong>{booking.guest_name}</strong></div>
                  <div><span>Check-in</span><strong>{booking.check_in}</strong></div>
                  <div><span>Check-out</span><strong>{booking.check_out}</strong></div>
                  <div><span>Total</span><strong>${booking.total_price}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}