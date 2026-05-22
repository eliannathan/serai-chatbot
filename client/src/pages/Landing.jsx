import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="landing">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">SERAI</div>
        <div className="nav-links">
          <Link to="/rooms">Rooms</Link>
          <Link to="/amenities">Amenities</Link>
          <Link to="/my-booking">My Booking</Link>
        </div>
      </nav>

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
          {[
            { name: 'Jungle Suite', price: '$120', desc: 'Bamboo, mist, and birdsong.' },
            { name: 'Terrace Villa', price: '$220', desc: 'Plunge pool over the valley.' },
            { name: 'Retreat Villa', price: '$380', desc: 'Your own private compound.' },
          ].map(r => (
            <div key={r.name} className="room-card">
              <div className="room-card-img" />
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