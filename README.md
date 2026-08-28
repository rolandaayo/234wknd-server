# +234WKND Server

**+234WKND Server** is a Node.js/Express backend for an event platform featuring:

## Core Features

- User auth (OTP verification, JWT login)
- Event & ticket management with QR code generation
- Merchandise listings
- Sponsor inquiries
- Real-time messaging (Socket.IO)
- Payment processing (Paystack integration)
- Admin dashboard with stats

## Tech Stack

Express, MongoDB, Socket.IO, JWT, Paystack, Nodemailer

## Key API Routes

`/api/auth`, `/api/events`, `/api/ticket-events`, `/api/merch`, `/api/messages`, `/api/sponsors`, `/api/payments`, `/api/admin`

## Setup

```bash
npm install
npm run dev
```

Set the variables in `.env` before starting the server. Paystack secrets stay
on the server; the client only needs `NEXT_PUBLIC_API_URL` pointing at this
API. Set `CLIENT_URL` to the deployed client URL so Paystack returns to
`/payment/success`. Use `sk_test_...` while testing, then replace it with the
Paystack live secret when the production domain and webhook settings are ready.
