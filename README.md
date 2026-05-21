# Serai AI Concierge Chatbot

A custom AI-powered customer support chatbot built with ASP.NET Core and React. 
Deployed live as a demo for Serai Retreat, a fictional boutique eco-resort in Ubud, Bali.

**Live Demo:** https://serai-chatbot.vercel.app

---

## What This Is

A fully embeddable chat widget that gives any business a 24/7 AI concierge — 
trained on their specific information, branded to their style, and owned entirely 
by the client with no ongoing platform fees.

## Features

- Floating chat bubble embeddable on any website
- Context-aware multi-turn conversations (bot remembers earlier messages)
- Custom AI persona trained on business-specific knowledge
- Resizable chat window
- Typing indicator and graceful error handling
- Rate limiting (10 requests/minute per IP)
- Fully responsive

## Tech Stack

**Backend:** ASP.NET Core 8 (C#), OpenAI API (gpt-4o-mini)  
**Frontend:** React 19, Vite  
**Deployment:** Vercel (frontend + serverless API)  
**Architecture:** REST API → OpenAI, conversation history passed per request

---

## Running Locally

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- OpenAI API key (platform.openai.com)

### Backend (ASP.NET)

```bash
cd SeraiApi
dotnet user-secrets set "OpenAI:ApiKey" "your-key-here"
dotnet watch
```

Runs at `http://localhost:5293`

### Frontend (React)

```bash
cd client
npm install
npm run dev
```

Runs at `http://localhost:5173`

Make sure `client/.env` contains:

VITE_API_URL=http://localhost:5293/chat

---

## Customizing for a New Client

Three files to change — nothing else:

**1. `SeraiApi/SeraiSystemPrompt.cs`**  
Replace the prompt content with the new client's business info — their services, 
policies, pricing, tone, and FAQs. This is what the AI reads before every conversation.

**2. `client/src/App.css`**  
Update the green color (`#4a7c59`) to match the client's brand color. 
One find-and-replace covers the entire file.

**3. `client/src/App.jsx`**  
Update the welcome message and placeholder text to match the client's business name.

That's it. The bot becomes a completely different concierge for a completely different business.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo to vercel.com (root directory: `client`)
3. Add environment variables:
   - `OPENAI_API_KEY` = your OpenAI key
   - `VITE_API_URL` = `/api/chat`
4. Deploy

The `client/api/chat.js` serverless function handles the OpenAI call in production.

---

## Project Structure
├── SeraiApi/               # ASP.NET Core backend
│   ├── Program.cs          # API setup, CORS, rate limiting, /chat endpoint
│   ├── SeraiSystemPrompt.cs # The AI persona and business knowledge
│   └── Dockerfile          # For Docker-based deployment
│
└── client/                 # React frontend
├── api/
│   └── chat.js         # Vercel serverless function (production)
├── src/
│   ├── App.jsx         # Chat widget component
│   └── App.css         # All widget styling
└── .env                # Local API URL config

---

## Client Handoff Notes

When delivering this to a client:
- The client creates their own OpenAI account and API key (~$5 to get started)
- Expected API costs: $5–15/month depending on traffic
- No subscription fees, no platform lock-in — they own the code entirely
- Setup is done live via screen-share call (30 minutes)