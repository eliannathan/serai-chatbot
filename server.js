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
  if (!personaEmail) return null

  const { data, error } = await supabase
    .from('bookings')
    .select('*, rooms(name, type, price_per_night)')
    .eq('guest_email', personaEmail)
    .order('id', { ascending: false })

  if (error || !data || data.length === 0) return null
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

Never make up information you don't know.

ACTIONS — append one of these tags at the END of your message when appropriate (never explain the tag):
- [ACTION:START_BOOKING] — when guest wants to make a new booking or asks to book a room
- [ACTION:SHOW_BOOKING] — when guest asks to see their existing booking details
- [ACTION:GO_ROOMS] — when guest wants to browse or explore rooms
- [ACTION:GO_AMENITIES] — when guest asks about amenities
- [ACTION:GO_CHECKOUT] — when guest is ready to complete a purchase
- [ACTION:CONTACT_TEAM] — only as a last resort if you truly cannot help

For any new booking request, ALWAYS emit [ACTION:START_BOOKING] — never tell them to email.`

  if (!persona || persona.id === 'visitor') {
    return `${basePersonality}

CURRENT GUEST: New visitor with no existing booking. Help them explore the retreat and encourage them to book.`
  }

  if (!booking || booking.length === 0) {
    return `${basePersonality}

CURRENT GUEST: ${persona.name}. They may have a booking but it could not be retrieved right now. Be helpful and direct them to hello@serai.retreat if they need booking details.`
  }

  const bookingLines = booking.map((b, i) => `
Booking ${i + 1}:
- Booking reference: ${b.booking_ref}
- Room: ${b.rooms?.name} (${b.rooms?.type})
- Check-in: ${b.check_in}
- Check-out: ${b.check_out}
- Total paid: $${b.total_price}
- Status: ${b.status}
- Special requests: ${b.special_requests || 'None'}`).join('\n')

  return `${basePersonality}

CURRENT GUEST: ${booking[0].guest_name} (${booking[0].guest_email})
ALL BOOKINGS (retrieved live from database):
${bookingLines}

You have FULL access to all of this guest's bookings. Share any details freely when asked. Never say you don't have access to their details.`
}

function parseActions(text) {
  const actions = []
  const cleaned = text.replace(/\[ACTION:([A-Z_]+)\]/g, (_, tag) => {
    actions.push(tag)
    return ''
  }).trim()
  return { cleaned, actions }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, persona } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request' })
    }

    // Mirror production chat.js: cap history and sanitize user content
    const recentMessages = messages.slice(-20)
    const sanitizedMessages = recentMessages
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: typeof m.content === 'string' ? m.content.trim().slice(0, 2000) : ''
      }))
      .filter(m => m.content)

    // Fetch live booking from Supabase
    const booking = await getBookingContext(persona?.ref, persona?.email)

    // Build system prompt with live data
    const systemPrompt = buildSystemPrompt(persona, booking)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...sanitizedMessages
      ]
    })

    const { cleaned, actions } = parseActions(response.choices[0].message.content)
    res.json({
      content: [{ text: cleaned }],
      actions
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get response' })
  }
})

app.listen(port, () => {
  console.log(`Serai backend running on port ${port}`)
})