import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Rooms from './pages/Rooms'
import Amenities from './pages/Amenities'
import MyBooking from './pages/MyBooking'
import ChatWidget from './components/ChatWidget'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/amenities" element={<Amenities />} />
        <Route path="/my-booking" element={<MyBooking />} />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  )
}