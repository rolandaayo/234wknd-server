# Authentication & Event Posting Setup

## Features Implemented

### 1. Authentication System

- **Login/Create Account**: Full JWT-based authentication
- **Protected Routes**: Event creation and management require authentication
- **User Context**: Global authentication state management
- **Secure Storage**: JWT tokens stored in localStorage with automatic verification

### 2. Event Posting System

- **Create Events**: Authenticated users can create events
- **Event Management**: Users can view, edit, and delete their own events
- **Public Event Listing**: All published events are visible to everyone
- **Event Categories**: Support for different event types (music, culture, nightlife, etc.)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `GET /api/auth/verify` - Verify JWT token

### Events

- `GET /api/events` - Get all published events (public)
- `POST /api/events` - Create new event (protected)
- `GET /api/events/my-events` - Get user's events (protected)
- `PUT /api/events/:id` - Update event (protected, owner only)
- `DELETE /api/events/:id` - Delete event (protected, owner only)
- `GET /api/events/:id` - Get single event (public)

## Pages Added

### Client Pages

- `/login` - User login page
- `/create-account` - User registration page
- `/create-event` - Event creation form (protected)
- `/my-events` - User's event management (protected)
- `/admin/events` - View all events (admin view)

### Navigation Updates

- **Authenticated Users**: See "My Events", "Create Event", and "Logout" options
- **Unauthenticated Users**: See "Login" and "Create Account" options
- **Dynamic Navbar**: Changes based on authentication state

## Environment Variables

### Server (.env)

```env
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
MONGODB_URI=mongodb://localhost:27017/234wknd
PORT=3001
CLIENT_URL=http://localhost:3000
```

### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Database Collections

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Events Collection

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  date: String,
  time: String,
  location: String,
  price: Number,
  maxAttendees: Number (optional),
  category: String,
  imageUrl: String (optional),
  createdBy: ObjectId (user ID),
  createdAt: Date,
  updatedAt: Date,
  status: String ('published', 'draft'),
  attendees: Array
}
```

## Deployment Configuration

### Vercel Configuration (server/vercel.json)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

## Security Features

1. **Password Hashing**: Using bcryptjs with salt rounds
2. **JWT Tokens**: 7-day expiration with secure secret
3. **Route Protection**: Middleware validates tokens on protected routes
4. **Input Validation**: Server-side validation for all inputs
5. **CORS Configuration**: Proper cross-origin setup
6. **Owner-only Operations**: Users can only edit/delete their own events

## Usage Instructions

### For Users

1. **Create Account**: Visit `/create-account` to register
2. **Login**: Visit `/login` to sign in
3. **Create Events**: Once logged in, use "Create Event" in navigation
4. **Manage Events**: View and manage your events at `/my-events`

### For Developers

1. **Start Server**: `cd server && npm run dev`
2. **Start Client**: `cd client && npm run dev`
3. **Database**: Ensure MongoDB is running
4. **Environment**: Copy `.env.example` files and configure

## Testing the Features

1. **Registration Flow**:
   - Go to `/create-account`
   - Fill in all fields
   - Should redirect to home page when successful

2. **Login Flow**:
   - Go to `/login`
   - Use registered credentials
   - Should redirect to home page when successful

3. **Event Creation**:
   - Login first
   - Go to `/create-event`
   - Fill in event details
   - Should redirect to `/my-events` when successful

4. **Event Management**:
   - Go to `/my-events` to see your events
   - Delete events with trash icon
   - View all community events at `/admin/events`

## Next Steps

1. **Email Verification**: Add email confirmation for new accounts
2. **Password Reset**: Implement forgot password functionality
3. **Event Images**: Add image upload functionality
4. **Event Booking**: Allow users to book/attend events
5. **Admin Panel**: Create proper admin interface with user management
6. **Event Search**: Add search and filtering for events
7. **Event Categories**: Expand category system
8. **Notifications**: Add email/push notifications for events
