# +234WKND Server

This is the backend service for the +234WKND event platform. It powers the event catalog, ticketing flow, user authentication, sponsorship inquiries, messaging, and admin operations for the brand.

The server is built with Express.js, MongoDB, Socket.IO, and Paystack-ready payment flows for a nightlife and event experience focused on Nigeria.

## Overview

The +234WKND server handles all API requests for:

- User registration and login
- Email OTP verification
- Event and ticket event management
- Merch listings and updates
- Ticket generation and payment verification
- Contact and sponsor inquiries
- Admin dashboard data
- Real-time message broadcasting via Socket.IO

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Socket.IO
- JWT authentication
- Paystack payment integration
- Nodemailer for email delivery
- QR code generation for event tickets

## Project Structure

- server.js — main Express app and server startup
- routes/ — API route definitions
- controllers/ — request handlers for messages and sponsors
- utils/ — MongoDB connection, email utilities, and helper logic

## Local Setup

```bash
npm install
npm run dev
```


## API Overview

All routes are prefixed with /api unless noted otherwise.

### Authentication

- POST /api/auth/send-otp
  - Sends a 6-digit OTP to a user email for registration verification.

- POST /api/auth/verify-otp
  - Verifies the OTP sent to the email.

- POST /api/auth/register
  - Registers a new user account after successful email verification.

- POST /api/auth/login
  - Signs in a user and returns a JWT.

- GET /api/auth/profile
  - Returns the authenticated user's profile.

- PUT /api/auth/profile
  - Updates the current user profile.

- GET /api/auth/verify
  - Validates the current JWT token.

- POST /api/auth/make-admin
  - Grants admin access to a user using the admin secret key.

### Events

- GET /api/events
  - Returns published public events.

- GET /api/events/my-events
  - Returns events created by the authenticated user.

- POST /api/events
  - Creates a new event for an authenticated user.

- PUT /api/events/:id
  - Updates an event owned by the authenticated user.

- DELETE /api/events/:id
  - Deletes an event owned by the authenticated user.

### Ticket Events

- GET /api/ticket-events
  - Returns all ticketed event listings.

- POST /api/ticket-events
  - Creates a new ticket event (admin/authenticated route).

- PUT /api/ticket-events/:id
  - Updates a ticket event.

- DELETE /api/ticket-events/:id
  - Deletes a ticket event.

### Merch

- GET /api/merch
  - Returns all merch items.

- POST /api/merch
  - Adds a new merch item.

- PUT /api/merch/:id
  - Updates a merch item.

- DELETE /api/merch/:id
  - Removes a merch item.

### Messages

- GET /api/messages
  - Returns all messages.

- POST /api/messages
  - Creates a new message record.

- GET /api/messages/room/:roomId
  - Fetches messages for a specific room.

- PUT /api/messages/:messageId/read
  - Marks a message as read.

### Contact

- POST /api/contact/submit
  - Submits a contact form message to the database.

### Sponsors

- GET /api/sponsors
  - Lists all sponsor inquiries.

- POST /api/sponsors
  - Creates a sponsor inquiry.

- GET /api/sponsors/:inquiryId
  - Fetches a specific inquiry.

- PUT /api/sponsors/:inquiryId/status
  - Updates the sponsor inquiry status.

- GET /api/sponsors/status/:status
  - Retrieves inquiries by status.

### Payments and Tickets

- POST /api/payments/create-payment
  - Initializes a Paystack payment for an event booking.

- GET /api/payments/verify-payment/:reference
  - Verifies a successful payment with Paystack.

- POST /api/payments/generate-ticket
  - Generates a QR-based ticket and emails it to the customer.

### Admin

- GET /api/admin/users
  - Returns registered users for the admin dashboard.

- GET /api/admin/tickets
  - Returns all generated tickets.

- GET /api/admin/messages
  - Returns all tracked messages.

- GET /api/admin/payments
  - Returns recorded payments.

- GET /api/admin/stats
  - Returns dashboard totals such as users, tickets, revenue, and pending messages.

- POST /api/admin/reply
  - Sends an admin reply for a message thread.

## Real-time Communication

The server also runs a Socket.IO instance for live messaging.

Available events include:

- message
  - Client sends a message and the server broadcasts it to connected clients.

- sponsor-inquiry
  - Client sends a sponsor inquiry and receives a confirmation event.

Server responses include:

- message
- inquiry-received

## Notes

- The backend expects a MongoDB database to be running and configured via MONGODB_URI.
- Some endpoints are protected with JWT and require a valid Authorization header.
- Payment and email features depend on external credentials being set correctly in the environment.

## License

This project is currently provided without an explicit open-source license and is intended for internal or project-specific use unless otherwise stated.
