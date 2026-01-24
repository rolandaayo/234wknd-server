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

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/messages", messageRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

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

// Initialize database connection and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 234 WKND Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready for connections`);
      console.log(`💾 MongoDB connected successfully`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
