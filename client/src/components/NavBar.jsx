import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../context/CartContext'

// Single source of truth for the top navigation rendered on every page.
// Owns its own mobile-menu open state and reads the cart count for the
// "Pending" indicator. Drop-in: <NavBar /> at the top of any page.
export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cartCount: pendingCount } = useCart()

  const close = () => setMenuOpen(false)

  return (
    <>
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
        <button className="mobile-menu-close" onClick={close}>✕</button>
        <Link to="/"            onClick={close}>Home</Link>
        <Link to="/rooms"       onClick={close}>Rooms</Link>
        <Link to="/amenities"   onClick={close}>Amenities</Link>
        <Link to="/my-booking"  onClick={close}>My Booking</Link>
        {pendingCount > 0 && (
          <Link to="/checkout" onClick={close}>
            Pending ({pendingCount})
          </Link>
        )}
      </div>
    </>
  )
}
