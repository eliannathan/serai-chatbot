import { Link } from 'react-router-dom'
import { useState } from 'react'
import RoomCarousel from '../components/RoomCarousel'
import { roomImages } from '../data/roomImages'
import { useCart } from "../context/CartContext"

export default function Landing() {

  const [menuOpen, setMenuOpen] = useState(false)

  const { cartCount: pendingCount } = useCart()

  const rooms = [
    { name: 'Jungle Suite', price: '$120', desc: 'Bamboo, mist, and birdsong.' },
    { name: 'Terrace Villa', price: '$220', desc: 'Plunge pool over the valley.' },
    { name: 'Retreat Villa', price: '$380', desc: 'Your own private compound.' },
  ]
  
  return (
    <div className="landing">
      {/* NAV */}
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

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <p className="hero-eyebrow">Ubud, Bali</p>
          <h1>Where the jungle<br />holds its breath</h1>
          <p className="hero-sub">
            An intimate retreat carved into the rice terraces of Ubud.
            Three villas. No crowds. Complete stillness.
          </p>
          <Link to="/rooms" className="btn-primary">Explore Rooms</Link>
        </div>
      </section>

      {/* ROOM CARDS PREVIEW */}
      <section className="rooms-preview">
        <h2>The Spaces</h2>
        <div className="room-grid">
          {rooms.map(r => (
            <div key={r.name} className="room-card">
              <RoomCarousel
                images={roomImages[r.name].gallery}
                roomName={r.name}
                className="room-card-carousel"
              />
              <div className="room-card-body">
                <h3>{r.name}</h3>
                <p>{r.desc}</p>
                <span className="price">from {r.price} / night</span>
              </div>
            </div>
          ))}
        </div>
        <Link to="/rooms" className="btn-secondary">View All Rooms</Link>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2025 Serai Retreat · Ubud, Bali · hello@serai.retreat</p>
      </footer>
    </div>
  )
}