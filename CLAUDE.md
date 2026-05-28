# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Serai is an AI concierge chatbot demo for a fictional boutique eco-resort in Ubud, Bali. It features a floating chat widget powered by GPT-4o-mini, a multi-step booking flow, and a cart/checkout system backed by Supabase. Live at: https://serai-chatbot.vercel.app

## Commands

### Frontend (React + Vite)
```bash
cd client
npm install       # first time
npm run dev       # dev server on :5173
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview production build
```

### Local Backend (Express)
```bash
# from repo root
npm install       # first time
node server.js    # runs on :8080
```

No tests are configured.

## Architecture

### Dual Backend Pattern
There are **two API implementations** that must stay in sync:

| File | Used when |
|------|-----------|
| `server.js` | Local development (Express on port 8080) |
| `client/api/chat.js` | Production (Vercel serverless function) |

`vite.config.js` proxies `/api` → `http://localhost:8080`, so the frontend always calls `/api/chat` regardless of environment. `client/api/chat.js` is the authoritative/complete version — it has rate limiting, input sanitization, cart context, and action tag parsing. `server.js` is a simpler version used locally.

### Persona System (Demo Mode)
On first load, `DemoModal` asks the user to pick a demo persona (visitor or a named guest with a booking). The selection is stored in `sessionStorage` as `serai_persona` and passed as a `persona` prop through `App` → `ChatWidget`. Every API call includes `persona`, which causes the backend to fetch the guest's live booking from Supabase and inject it into the system prompt.

### AI Action Tags
The AI can include `[ACTION:TAG_NAME]` tokens in its response text. `chat.js` strips these out via `parseActions()` and returns them as an `actions[]` array. `ChatWidget` maps them to `ACTION_MAP` to render clickable navigation buttons. The special `START_BOOKING` action triggers the inline `BookingFlow` overlay instead of navigating.

Available actions: `GO_ROOMS`, `GO_BOOKING`, `GO_AMENITIES`, `GO_CHECKOUT`, `START_BOOKING`, `SHOW_BOOKING`, `CONTACT_TEAM`.

### Two Booking Flows
1. **Page flow** (`/book` → `/checkout`): `BookPage` is a 4-step form (room, dates, add-ons, review) that calls `addToCart()`. `Checkout` page then batch-inserts all cart items to Supabase `bookings` table.
2. **Chat overlay flow** (`BookingFlow` component): A 3-step form that opens inside the chat widget (triggered by `START_BOOKING` action). Submits via `POST /api/chat` with a `bookingRequest` payload — the serverless function handles the Supabase insert.

### Cart
`CartContext` (`client/src/context/CartContext.jsx`) stores items in `sessionStorage` (`serai_cart`). Max 5 items. Cart contents are serialized and sent with every chat message so the AI can reference pending items.

### Supabase Access Pattern
- **Frontend (anon key)**: `MyBooking` page reads bookings; `Checkout` inserts bookings; `ChatWidget` inserts to `leads` on first message.
- **Serverless function (service key)**: `chat.js` reads bookings to build the personalized system prompt.

The Supabase client is initialized lazily in `chat.js` via `getClients()` to survive cold starts. The frontend client lives in `client/src/supabase.js`.

### Session Storage Keys
- `serai_persona` — selected demo persona
- `serai_cart` — booking cart items
- `serai_chat_{persona.id}` — per-persona chat history

## Environment Variables

**Frontend** (`client/.env`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
(`VITE_API_URL` is in the README but not used in code — the Vite proxy handles routing.)

**Backend / Vercel**:
```
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

## Customizing for a New Client

Three places to change:
1. **`client/api/chat.js`** — `BASE_PROMPT` constant (resort info, policies, room details, action rules)
2. **`client/src/App.css`** — brand color `#4a7c59` (one find-and-replace)
3. **`client/src/App.jsx`** — welcome message and persona display text

## Deployment

Root Vercel project is `client/`. `client/vercel.json` rewrites `/api/*` to the serverless functions in `client/api/`. The `SeraiApi/` directory (ASP.NET Core) is a legacy backend from an earlier version — the active production backend is the Node.js serverless function.
