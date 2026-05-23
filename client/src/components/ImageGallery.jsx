import { useState, useEffect, useCallback } from 'react'

export default function ImageGallery({ images, roomName, onClose }) {
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [prev, next, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-panel" onClick={e => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>✕</button>

        <div className="lightbox-img-wrap">
          <img
            src={images[current]}
            alt={`${roomName} ${current + 1}`}
            className="lightbox-img"
          />
          <button className="lightbox-arrow left" onClick={prev}>‹</button>
          <button className="lightbox-arrow right" onClick={next}>›</button>
        </div>

        <div className="lightbox-footer">
          <p className="lightbox-room-name">{roomName}</p>
          <div className="lightbox-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`lightbox-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
          <p className="lightbox-counter">{current + 1} / {images.length}</p>
        </div>

        <div className="lightbox-thumbs">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`thumb ${i + 1}`}
              className={`lightbox-thumb ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}