// Single source of truth for room definitions.
// Imported by BookPage, BookingFlow, RoomDetail, and any future component that
// needs room data.
//
// `id` and `slug` are intentionally the same kebab-case string: `id` is what we
// pass around in app state / cart items, `slug` is what appears in the URL
// (/rooms/:slug). Keeping them identical avoids a lookup table.
export const ROOMS = [
  {
    id: 'jungle-suite',
    slug: 'jungle-suite',
    name: 'Jungle Suite',
    price: 120,
    desc: 'Garden view · King bed · Private outdoor shower',
    capacity: 2,
    amenities: [
      'Garden view',
      'King bed',
      'Private outdoor shower',
      'Air conditioning',
      'Free WiFi',
      'Daily breakfast',
    ],
  },
  {
    id: 'terrace-villa',
    slug: 'terrace-villa',
    name: 'Terrace Villa',
    price: 220,
    desc: 'Rice terrace view · King bed · Private plunge pool',
    capacity: 2,
    amenities: [
      'Rice terrace view',
      'King bed',
      'Private plunge pool',
      'Air conditioning',
      'Free WiFi',
      'Daily breakfast',
    ],
  },
  {
    id: 'retreat-villa',
    slug: 'retreat-villa',
    name: 'Retreat Villa',
    price: 380,
    desc: 'Panoramic view · King bed · Private infinity pool',
    capacity: 4,
    amenities: [
      'Panoramic view',
      'King bed',
      'Private infinity pool',
      'Spacious living area',
      'Air conditioning',
      'Free WiFi',
      'Daily breakfast',
    ],
  },
]

// kebab-case a room name into the same form used for `slug` above. Used by
// components that only have a room name (e.g. Supabase rows) and need to build
// a /rooms/:slug link.
export function slugifyRoomName(name) {
  return String(name).toLowerCase().trim().replace(/\s+/g, '-')
}

export function getRoomBySlug(slug) {
  return ROOMS.find(r => r.slug === slug) || null
}

export function getRoomById(id) {
  return ROOMS.find(r => r.id === id) || null
}
