import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import RoomCarousel from '../components/RoomCarousel'
import { roomImages } from '../data/roomImages'
import NavBar from '../components/NavBar'

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const navigate = useNavigate()
  
  useEffect(() => {
    async function fetchRooms() {
      const { data, error } = await supabase.from('rooms').select('*')
      if (error || !data) {
        setFetchError(true)
      } else {
        setRooms(data)
      }
      setLoading(false)
    }
    fetchRooms()
  }, [])

  return (
    <div className="page">
      <NavBar />

      <div className="page-content">
        <h1 className="page-title">Our Rooms</h1>
        <p className="page-sub">Three spaces. Each one its own world.</p>

        {loading ? (
          <p className="loading">Loading rooms...</p>
        ) : fetchError ? (
          <p className="error-msg">Unable to load rooms. Please refresh the page.</p>
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