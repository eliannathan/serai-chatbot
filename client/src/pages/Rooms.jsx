import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import RoomCarousel from '../components/RoomCarousel'
import { roomImages } from '../data/roomImages'
import { useCart } from "../context/CartContext"
import { useNavigate } from 'react-router-dom'

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const { cartCount: pendingCount } = useCart()
  const navigate = useNavigate()
  
  useEffect(() => {
    async function fetchRooms() {
      const { data, error } = await supabase.from('rooms').select('*')
      if (!error) setRooms(data)
      setLoading(false)
    }
    fetchRooms()
  }, [])

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
        <h1 className="page-title">Our Rooms</h1>
        <p className="page-sub">Three spaces. Each one its own world.</p>

        {loading ? (
          <p className="loading">Loading rooms...</p>
        ) : (
          <div className="rooms-list">
            {rooms.map(room => (
              <div key={room.id} className="room-detail-card">
                <RoomCarousel
                  images={roomImages[room.name]?.gallery || []}
                  roomName={room.name}
                  className="room-detail-carousel"
                />
                <div className="room-detail-body">
                  <div className="room-detail-header">
                    <h2>{room.name}</h2>
                    <span className="room-price">${room.price_per_night} / night</span>
                  </div>
                  <p className="room-desc">{room.description}</p>
                  <div className="amenities-list">
                    {room.amenities?.map(a => (
                      <span key={a} className="amenity-tag">{a}</span>
                    ))}
                  </div>
                  <div className="room-detail-footer">
                    <p className="room-capacity">Up to {room.capacity} guests</p>
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => navigate(`/book?room=${encodeURIComponent(room.name)}`)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}