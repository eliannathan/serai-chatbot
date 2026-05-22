const personas = [
  {
    id: 'james',
    name: 'James Wilson',
    room: 'Jungle Suite',
    ref: 'SR-2847',
    email: 'james@demo.com',
    dates: 'June 12–15',
    nights: 3,
    total: 360,
    emoji: '🌿'
  },
  {
    id: 'sarah',
    name: 'Sarah Chen',
    room: 'Terrace Villa',
    ref: 'SR-3291',
    email: 'sarah@demo.com',
    dates: 'July 3–7',
    nights: 4,
    total: 880,
    emoji: '🏊'
  },
  {
    id: 'michael',
    name: 'Michael Torres',
    room: 'Retreat Villa',
    ref: 'SR-4105',
    email: 'michael@demo.com',
    dates: 'Aug 20–25',
    nights: 5,
    total: 1900,
    emoji: '🌺'
  },
  {
    id: 'visitor',
    name: 'New Visitor',
    room: null,
    ref: null,
    email: null,
    dates: null,
    nights: null,
    total: null,
    emoji: '👤'
  }
]

export default function DemoModal({ onSelect }) {
  return (
    <div className="demo-overlay">
      <div className="demo-modal">
        <div className="demo-modal-header">
          <p className="demo-eyebrow">Interactive Demo</p>
          <h2>Welcome to Serai Retreat</h2>
          <p className="demo-sub">
            Choose a persona to explore the full guest experience,
            or browse as a new visitor.
          </p>
        </div>

        <div className="demo-personas">
          {personas.map(p => (
            <button
              key={p.id}
              className={`demo-persona-card ${p.id === 'visitor' ? 'visitor' : ''}`}
              onClick={() => onSelect(p)}
            >
              <span className="demo-persona-emoji">{p.emoji}</span>
              <div className="demo-persona-info">
                <p className="demo-persona-name">{p.name}</p>
                {p.room ? (
                  <>
                    <p className="demo-persona-room">{p.room}</p>
                    <p className="demo-persona-meta">{p.ref} · {p.dates}</p>
                  </>
                ) : (
                  <p className="demo-persona-room">No booking · Exploring</p>
                )}
              </div>
            </button>
          ))}
        </div>

        <p className="demo-disclaimer">
          This is a portfolio demo. All bookings and guest data are fictional.
        </p>
      </div>
    </div>
  )
}