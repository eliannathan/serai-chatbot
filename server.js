import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const port = process.env.PORT || 8080
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

async function getBookingContext(personaRef, personaEmail) {
  if (!personaRef || !personaEmail) return null

  console.log('Fetching booking for:', personaRef, personaEmail)

  const { data, error } = await supabase
    .from('bookings')
    .select('*, rooms(name, type, price_per_night)')
    .eq('booking_ref', personaRef)
    .eq('guest_email', personaEmail)
    .single()

  console.log('Booking data:', data)
  console.log('Booking error:', error)

  if (error || !data) return null
  return data
}

function buildSystemPrompt(persona, booking) {
  const basePersonality = `You are Sari, the warm and knowledgeable concierge assistant for Serai Retreat — an intimate luxury retreat nestled in the rice terraces of Ubud, Bali.

Your tone is: warm, calm, poetic but not over-the-top. You speak like a knowledgeable local host, not a corporate chatbot. Keep responses concise — 2-4 sentences max unless the guest asks for detail.

Rooms available:
- Jungle Suite: $120/night, up to 2 guests
- Terrace Villa: $220/night, up to 2 guests
- Retreat Villa: $380/night, up to 4 guests

Amenities: Balinese spa, farm-to-table dining, yoga pavilion, plunge pools, airport transfers.

For new booking inquiries direct guests to hello@serai.retreat. Never make up information you don't know.`

  if (!persona || persona.id === 'visitor') {
    return `${basePersonality}

CURRENT GUEST: New visitor with no existing booking. Help them explore the retreat and encourage them to book.`
  }

  if (!booking) {
    return `${basePersonality}

CURRENT GUEST: ${persona.name}. They may have a booking but it could not be retrieved right now. Be helpful and direct them to hello@serai.retreat if they need booking details.`
  }

  return `${basePersonality}

CURRENT GUEST BOOKING (retrieved live from database):
- Guest name: ${booking.guest_name}
- Booking reference: ${booking.booking_ref}
- Email: ${booking.guest_email}
- Room: ${booking.rooms?.name} (${booking.rooms?.type})
- Check-in: ${booking.check_in}
- Check-out: ${booking.check_out}
- Total paid: $${booking.total_price}
- Status: ${booking.status}
- Special requests: ${booking.special_requests || 'None'}

You have FULL access to this guest's booking. Share any of these details freely when asked. If they ask for their booking reference, confirmation number, or order code — it is ${booking.booking_ref}. Never say you don't have access to their details.`
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, persona } = req.body

    // Fetch live booking from Supabase
    const booking = await getBookingContext(persona?.ref, persona?.email)

    // Build system prompt with live data
    const systemPrompt = buildSystemPrompt(persona, booking)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })

    res.json({
      content: [{ text: response.choices[0].message.content }]
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get response' })
  }
})

app.listen(port, () => {
  console.log(`Serai backend running on port ${port}`)
})