import { useParams, useNavigate, Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import RoomCarousel from '../components/RoomCarousel'
import { getRoomBySlug } from '../data/rooms'
import { roomImages } from '../data/roomImages'

export default function RoomDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const room = getRoomBySlug(slug)

  // Unknown slug — guide the user back to the rooms list rather than crashing.
  if (!room) {
    return (
      <div className="page">
        <NavBar />
        <div className="page-content" style={{ maxWidth: 720 }}>
          <h1 className="page-title">Room not found</h1>
          <p className="page-sub">We couldn't find the room you were looking for.</p>
          <Link to="/rooms" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
            ← Back to Rooms
          </Link>
        </div>
      </div>
    )
  }

  const gallery = roomImages[room.name]?.gallery || []

  // Pre-select this room on the booking page via router state (no query string).
  function handleBookNow() {
    navigate('/book', { state: { preselectedRoomId: room.id } })
  }

  return (
    <div className="page">
      <NavBar />

      <div className="page-content" style={{ maxWidth: 720, paddingBottom: 80 }}>
        <button className="booking-cancel" onClick={() => navigate('/rooms')} style={{ marginBottom: '1.25rem' }}>
          ← Back to Rooms
        </button>

        <div className="room-detail-card">
          <RoomCarousel
            images={gallery}
            roomName={room.name}
            className="room-detail-carousel"
          />
          <div className="room-detail-body">
            <div className="room-detail-header">
              <h1>{room.name}</h1>
              <span className="room-price">${room.price} / night</span>
            </div>
            <p className="room-desc">{room.desc}</p>

            <div className="amenities-list">
              {room.amenities?.map(a => (
                <span key={a} className="amenity-tag">{a}</span>
              ))}
            </div>

            <p className="room-capacity" style={{ marginTop: '1rem' }}>
              Up to {room.capacity} guest{room.capacity > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="booking-actions" style={{ marginTop: '2rem', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={handleBookNow}>
            Book Now →
          </button>
        </div>
      </div>
    </div>
  )
}
