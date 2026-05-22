import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Rooms from './pages/Rooms'
import Amenities from './pages/Amenities'
import MyBooking from './pages/MyBooking'
import ChatWidget from './components/ChatWidget'
import DemoModal from './components/DemoModal'

export default function App() {
  const [persona, setPersona] = useState(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('serai_persona')
    if (saved) setPersona(JSON.parse(saved))
  }, [])

  function handlePersonaSelect(p) {
    sessionStorage.setItem('serai_persona', JSON.stringify(p))
    setPersona(p)
  }

  return (
    <BrowserRouter>
      {!persona && <DemoModal onSelect={handlePersonaSelect} />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/amenities" element={<Amenities />} />
        <Route path="/my-booking" element={<MyBooking />} />
      </Routes>
      {persona && <ChatWidget persona={persona} />}
    </BrowserRouter>
  )
}