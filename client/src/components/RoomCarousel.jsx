import { useState } from 'react'
import ImageGallery from './ImageGallery'

export default function RoomCarousel({ images, roomName, className = '' }) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

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
          src={images[current]}
          alt={`${roomName} ${current + 1}`}
          className="room-carousel-img"
        />

        {/* Arrows */}
        <button className="carousel-arrow left" onClick={prev}>‹</button>
        <button className="carousel-arrow right" onClick={next}>›</button>

        {/* Dots */}
        <div className="carousel-dots">
          {images.map((_, i) => (
            <span
              key={i}
              className={`carousel-dot ${i === current ? 'active' : ''}`}
              onClick={e => { e.stopPropagation(); setCurrent(i) }}
            />
          ))}
        </div>

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