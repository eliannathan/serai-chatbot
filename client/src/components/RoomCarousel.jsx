import { useState } from 'react'
import ImageGallery from './ImageGallery'

export default function RoomCarousel({ images, roomName, className = '' }) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Guard: empty or missing images would crash on images[current] / images.length
  if (!images || images.length === 0) {
    return (
      <div className={`room-carousel ${className}`}>
        <div
          className="room-carousel-img"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#e8e3db',
            color: '#8a8071',
            fontSize: '0.9rem',
          }}
        >
          No image available
        </div>
      </div>
    )
  }

  // Clamp current index defensively in case `images` shrinks between renders
  const safeIndex = ((current % images.length) + images.length) % images.length

  function prev(e) {
    e.stopPropagation()
    setCurrent(c => (c - 1 + images.length) % images.length)
  }

  function next(e) {
    e.stopPropagation()
    setCurrent(c => (c + 1) % images.length)
  }

  return (
    <>
      <div
        className={`room-carousel ${className}`}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={images[safeIndex]}
          alt={`${roomName} ${safeIndex + 1}`}
          className="room-carousel-img"
        />

        {/* Arrows — only shown when there's more than one image */}
        {images.length > 1 && (
          <>
            <button className="carousel-arrow left" onClick={prev}>‹</button>
            <button className="carousel-arrow right" onClick={next}>›</button>
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="carousel-dots">
            {images.map((_, i) => (
              <span
                key={i}
                className={`carousel-dot ${i === safeIndex ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); setCurrent(i) }}
              />
            ))}
          </div>
        )}

        {/* Expand hint */}
        <div className="carousel-expand-hint">⤢ View all photos</div>
      </div>

      {lightboxOpen && (
        <ImageGallery
          images={images}
          roomName={roomName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}