import NavBar from '../components/NavBar'

const amenities = [
  { icon: '🌿', title: 'Rice Terrace Views',    desc: 'Every villa faces the valley. Sunrise from your balcony is non-negotiable.' },
  { icon: '♨️', title: 'Balinese Spa',           desc: 'Daily treatments available. Traditional Boreh scrub, hot stone, and flower bath.' },
  { icon: '🍃', title: 'Farm-to-Table Dining',  desc: 'Breakfast included. Ingredients from our on-site garden and local farmers.' },
  { icon: '🏊', title: 'Plunge Pools',           desc: 'Terrace Villa and Retreat Villa both include private plunge pools.' },
  { icon: '🧘', title: 'Yoga Pavilion',          desc: 'Open-air sessions at 7am daily. Private sessions bookable through Sari.' },
  { icon: '🚐', title: 'Airport Transfers',      desc: 'Included with Retreat Villa. Available for other rooms at IDR 350,000.' },
]

export default function Amenities() {
  return (
    <div className="page">
      <NavBar />

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