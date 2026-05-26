import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from "../context/CartContext"

const amenities = [
  { icon: '🌿', title: 'Rice Terrace Views', desc: 'Every villa faces the valley. Sunrise from your balcony is non-negotiable.' },
  { icon: '♨️', title: 'Balinese Spa', desc: 'Daily treatments available. Traditional Boreh scrub, hot stone, and flower bath.' },
  { icon: '🍃', title: 'Farm-to-Table Dining', desc: 'Breakfast included. Ingredients from our on-site garden and local farmers.' },
  { icon: '🏊', title: 'Plunge Pools', desc: 'Terrace Villa and Retreat Villa both include private plunge pools.' },
  { icon: '🧘', title: 'Yoga Pavilion', desc: 'Open-air sessions at 7am daily. Private sessions bookable through Sari.' },
  { icon: '🚐', title: 'Airport Transfers', desc: 'Included with Retreat Villa. Available for other rooms at IDR 350,000.' },
]

export default function Amenities() {

  const [menuOpen, setMenuOpen] = useState(false)
  const { cartCount: pendingCount } = useCart()
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

      <div className="page-content">
        <h1 className="page-title">Amenities</h1>
        <p className="page-sub">Everything included. Nothing unnecessary.</p>

        <div className="amenities-grid">
          {amenities.map(a => (
            <div key={a.title} className="amenity-card">
              <span className="amenity-icon">{a.icon}</span>
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}