# Serai AI Concierge Chatbot

A full-stack AI-powered hotel concierge and booking system built as a portfolio demonstration.

**Live demo:** https://serai-chatbot.vercel.app

Visitors land on a marketing site for Serai Retreat, a fictional boutique eco-resort in Ubud, Bali. A floating chat bubble opens an AI concierge named Sari, who answers questions about the property, knows the live booking of whichever demo persona you select, and can launch a multi-step booking flow without leaving the chat. Bookings move through a cart and checkout, then write to a Postgres database. Past bookings can be looked up by email or reference number.

## What this demonstrates

Built to demonstrate real-world full-stack capabilities for freelance hospitality clients. Specifically:

- **End-to-end ownership** — system prompt design, database schema, serverless API, React frontend, deployment
- **AI integration with structure** — Sari emits action tags the UI parses into navigation buttons and booking triggers, not just plain text
- **Production-aware code** — input sanitization, per-IP rate limiting, prompt-injection mitigation, XSS-safe rendering, race-free ID generation
- **Cohesive state** — a single cart context backs two independent booking flows that funnel into one database write path
- **Domain modelling** — multi-step booking with add-ons, room capacity validation, persona-aware AI context

## Features

**AI concierge (Sari)**
- Context-aware responses driven by the active guest's live booking from the database
- `[ACTION:NAME]` tags in AI responses become navigation buttons and overlay triggers in the UI
- Per-persona chat history persisted in sessionStorage
- Rate-limited and sanitised on the backend

**Two booking flows, one cart**
- Full-page flow at `/book` — 4 steps: room, dates, add-ons, review
- In-chat overlay flow — 6 steps including guest info and a confirmation screen; saves a draft so accidentally closing the overlay doesn't lose progress
- Both call `addToCart()`; only `/checkout` inserts into the database

**Cart and checkout**
- Up to 5 pending items, persisted in sessionStorage
- "Pending" badge in the nav bar
- Demo payment UI with a real Supabase insert — bookings get unique `SR-XXXXXX` references generated via `crypto.getRandomValues`

**Booking lookup**
- Search by email or booking reference (`SR-XXXX`)
- Returns room, dates, total, and status

**Other**
- Three demo personas (James Wilson, Sarah Chen, Michael Torres) with pre-loaded bookings, plus a "new visitor" path
- Mobile-responsive throughout — full-screen chat panel on mobile, stacked booking forms, iOS keyboard-zoom fix

## Tech stack

- **Frontend:** React 19, Vite, React Router v6, custom CSS (no UI framework)
- **Backend:** Vercel serverless functions; Express for local development
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4o-mini
- **Deployment:** Vercel

## Project structure

```
serai-chatbot/
├── server.js                # Local Express backend (port 8080)
├── client/
│   ├── api/
│   │   └── chat.js          # Vercel serverless function (production)
│   ├── src/
│   │   ├── components/      # ChatWidget, BookingFlow, NavBar, ...
│   │   ├── pages/           # Landing, Rooms, RoomDetail, BookPage, Checkout, MyBooking, Amenities
│   │   ├── context/         # CartContext
│   │   ├── data/            # ROOMS, ADD_ONS, room images
│   │   └── supabase.js
│   ├── vite.config.js       # Proxies /api → :8080 in dev
│   └── vercel.json
```

The Vite dev server proxies `/api` to the Express backend, so the frontend uses the same `/api/chat` URL in both environments. `client/api/chat.js` is the production-grade implementation (rate limiting, sanitization, cart context, action parsing); `server.js` is a thinner local mirror.

## Local setup

Prerequisites: Node 18+, an OpenAI API key, and a Supabase project with `rooms`, `bookings`, and `leads` tables.

```bash
git clone https://github.com/eliannathan/serai-chatbot.git
cd serai-chatbot
npm install
cd client && npm install && cd ..
```

Create a `.env` in the project root (used by the local Express server):

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=...
```

And a `client/.env` (used by Vite for direct Supabase reads from the frontend):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Run the backend and frontend in separate terminals:

```bash
node server.js                # backend on :8080
```

```bash
cd client && npm run dev      # frontend on :5173
```

Open http://localhost:5173 and pick a demo persona to start.

## Architecture notes

**Persona system.** The active demo persona is stored in sessionStorage and sent with every chat request. The backend fetches that guest's live booking from Supabase and injects it into the system prompt, so Sari can answer questions like "what room am I in?" with real data.

**Action tags.** The AI can include `[ACTION:NAME]` tokens in its response. The serverless function strips them out and returns them in a structured array. The chat widget maps them to clickable buttons — `[ACTION:START_BOOKING]` opens the in-chat booking overlay, `[ACTION:GO_CHECKOUT]` routes to `/checkout`, and so on.

**Cart as funnel.** Both booking flows call `addToCart()`. `Checkout.jsx` is the only file that inserts into the `bookings` table, which keeps the write path simple and auditable.

**XSS safety.** AI-rendered messages are HTML-escaped before any markdown transforms, so a successful prompt-injection attempt cannot inject DOM nodes.

**Rate limiting.** Per-IP and in-memory on the serverless function, with periodic pruning to bound memory growth. A production deployment under significant traffic would back this with Redis.

## Customising for a new client

The codebase was designed to be re-skinnable for any single-property hospitality client. To adapt:

1. `client/api/chat.js` — `BASE_PROMPT` constant: business info, policies, action rules
2. `client/src/data/rooms.js` and `addons.js` — inventory and pricing
3. `client/src/index.css` — find-and-replace `#4a7c59` with the client's brand colour
4. `client/src/App.jsx` and `client/src/components/DemoModal.jsx` — welcome copy and personas
