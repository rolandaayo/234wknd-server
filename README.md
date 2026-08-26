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
