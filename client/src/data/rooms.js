// Single source of truth for room definitions.
// Imported by BookPage, BookingFlow, and any future component that needs room data.
export const ROOMS = [
  { name: 'Jungle Suite',  price: 120, desc: 'Garden view · King bed · Private outdoor shower', capacity: 2 },
  { name: 'Terrace Villa', price: 220, desc: 'Rice terrace view · King bed · Private plunge pool',  capacity: 2 },
  { name: 'Retreat Villa', price: 380, desc: 'Panoramic view · King bed · Private infinity pool',   capacity: 4 },
]
