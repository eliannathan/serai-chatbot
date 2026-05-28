import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Rooms from './pages/Rooms'
import Amenities from './pages/Amenities'
import MyBooking from './pages/MyBooking'
import Checkout from './pages/Checkout'
import BookPage from './pages/BookPage'
import ChatWidget from './components/ChatWidget'
import DemoModal from './components/DemoModal'
import { CartProvider } from './context/CartContext'

export default function App() {
  const [persona, setPersona] = useState(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('serai_persona')
    if (!saved) return
    // If the stored value is corrupt, drop it and fall back to the persona picker.
    try {
      setPersona(JSON.parse(saved))
    } catch {
      sessionStorage.removeItem('serai_persona')
    }
  }, [])

  function handlePersonaSelect(p) {
    sessionStorage.setItem('serai_persona', JSON.stringify(p))
    setPersona(p)
  }

  return (
    <CartProvider>
      <BrowserRouter>
        {!persona && <DemoModal onSelect={handlePersonaSelect} />}
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/my-booking" element={<MyBooking />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
        {persona && <ChatWidget persona={persona} />}
      </BrowserRouter>
    </CartProvider>
  )
}