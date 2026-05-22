import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

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
        </div>
      </nav>

      <div className="page-content">
        <h1 className="page-title">Our Rooms</h1>
        <p className="page-sub">Three spaces. Each one its own world.</p>

        {loading ? (
          <p className="loading">Loading rooms...</p>
        ) : (
          <div className="rooms-list">
            {rooms.map(room => (
              <div key={room.id} className="room-detail-card">
                <div className="room-detail-img" />
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
                  <p className="room-capacity">Up to {room.capacity} guests</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}