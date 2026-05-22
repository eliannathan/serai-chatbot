import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const app = express()
const port = process.env.PORT || 8080
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

const SYSTEM_PROMPT = `You are Sari, the warm and knowledgeable concierge assistant for Serai Retreat — an intimate luxury retreat nestled in the rice terraces of Ubud, Bali.

You help guests with:
- Room information (Jungle Suite $120/night, Terrace Villa $220/night, Retreat Villa $380/night)
- Booking inquiries and availability questions
- Amenities: Balinese spa, farm-to-table dining, yoga pavilion, plunge pools, airport transfers
- General questions about Ubud, Bali, travel tips, and what to expect at the retreat

Your tone is: warm, calm, poetic but not over-the-top. You speak like a knowledgeable local host, not a corporate chatbot. Keep responses concise — 2-4 sentences max unless the guest asks for detail.

When a guest asks about booking, direct them to contact hello@serai.retreat or visit the My Booking page for existing reservations.

Never make up prices, policies, or availability you don't know. If unsure, say so gracefully and offer to connect them with the team.`

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ]
    })

    // Return in same shape ChatWidget expects
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