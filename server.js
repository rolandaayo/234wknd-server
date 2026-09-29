const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

// Import database connection
const { connectDB } = require("./utils/mongodb");

// Import routes
const messageRoutes = require("./routes/messageRoutes");
const sponsorRoutes = require("./routes/sponsorRoutes");
const paymentRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");
const contactRoutes = require("./routes/contact");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const merchRoutes = require("./routes/merch");
const ticketEventRoutes = require("./routes/ticketEvents");

const app = express();
const server = http.createServer(app);

// Allowed origins: support multiple comma-separated values in CLIENT_URL
const rawOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and listed origins
    if (!origin || rawOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = socketIo(server, {
  cors: {
    origin: rawOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // pre-flight for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/messages", messageRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/merch", merchRoutes);
app.use("/api/ticket-events", ticketEventRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle incoming messages
  socket.on("message", (messageData) => {
    console.log("Message received:", messageData);

    // Broadcast message to all connected clients
    io.emit("message", {
      ...messageData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    });

    // Auto-reply from admin (simulate admin response)
    setTimeout(() => {
      const adminReply = {
        id: Date.now() + 1,
        text: "Thank you for your message! Our sponsorship team will review your inquiry and get back to you shortly.",
        sender: "admin",
        timestamp: new Date().toISOString(),
      };
      io.emit("message", adminReply);
    }, 2000);
  });

  // Handle sponsor inquiry
  socket.on("sponsor-inquiry", (inquiryData) => {
    console.log("Sponsor inquiry received:", inquiryData);

    // Emit confirmation to sender
    socket.emit("inquiry-received", {
      message: "Your sponsorship inquiry has been received!",
      inquiryId: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "234 WKND Server is running" });
});

const PORT = process.env.PORT || 3001;

// Warn about insecure fallback secrets at startup
const warnIfInsecure = () => {
  const insecureJWT =
    !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 20;
  const insecureAdmin =
    !process.env.ADMIN_SECRET ||
    process.env.ADMIN_SECRET === "234wknd-admin-secret";
  if (insecureJWT) {
    console.warn(
      "⚠️  JWT_SECRET is missing or too short. Set a long random value in .env",
    );
  }
  if (insecureAdmin) {
    console.warn(
      "⚠️  ADMIN_SECRET is using an insecure default. Set a strong value in .env",
    );
  }
};

// Initialize database connection and start server
const startServer = async () => {
  try {
    warnIfInsecure();

    // Connect to MongoDB
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 234 WKND Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready for connections`);
      console.log(`💾 MongoDB connected successfully`);
      console.log(`🌐 Allowed origins: ${rawOrigins.join(", ")}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
