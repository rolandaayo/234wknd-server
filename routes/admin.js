const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB, Collections } = require("../utils/mongodb");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Admin auth middleware — requires valid JWT + isAdmin flag
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });
  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    async (err, decoded) => {
      if (err)
        return res.status(403).json({ error: "Invalid or expired token" });
      try {
        const db = getDB();
        const user = await db
          .collection("users")
          .findOne({ _id: new ObjectId(decoded.userId) });
        if (!user || !user.isAdmin) {
          return res.status(403).json({ error: "Admin access required" });
        }
        req.user = decoded;
        next();
      } catch (e) {
        return res.status(500).json({ error: "Auth check failed" });
      }
    },
  );
};

// Get all registered users (from users collection)
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      users: users.map((u) => ({
        _id: u._id,
        fullName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        email: u.email,
        phone: u.phone || null,
        isAdmin: u.isAdmin || false,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

// Get all tickets
router.get("/tickets", requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const tickets = await db
      .collection(Collections.TICKETS)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      tickets: tickets.map((ticket) => ({
        _id: ticket._id,
        ticketId: ticket.ticketId,
        fullName: ticket.fullName,
        email: ticket.email,
        eventId: ticket.eventId,
        eventTitle: ticket.eventTitle || "A Weekend Experience",
        paymentReference: ticket.paymentReference,
        createdAt: ticket.createdAt,
        status: "active",
      })),
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ success: false, error: "Failed to fetch tickets" });
  }
});

// Get all messages
router.get("/messages", requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const messagesCollection = db.collection("messages");
    const messageCount = await messagesCollection.countDocuments();

    if (messageCount === 0) {
      await messagesCollection.insertMany([
        {
          text: "Hi, I'm interested in VIP packages for the upcoming event. Can you provide more details?",
          sender: "John Doe",
          email: "john@example.com",
          timestamp: new Date(),
          replied: false,
        },
        {
          text: "What's the refund policy for tickets?",
          sender: "Jane Smith",
          email: "jane@example.com",
          timestamp: new Date(),
          replied: false,
        },
      ]);
    }

    const messages = await messagesCollection
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

// Get all payments
router.get("/payments", requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const payments = await db
      .collection(Collections.PAYMENTS)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      payments: payments.map((payment) => ({
        _id: payment._id,
        reference: payment.reference,
        email: payment.customer?.email || payment.email,
        amount: payment.amount ? payment.amount / 100 : 0,
        status: payment.status,
        createdAt: payment.createdAt || payment.paid_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
});

// Get dashboard stats
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const db = getDB();

    const totalUsers = await db.collection("users").countDocuments();
    const totalTickets = await db
      .collection(Collections.TICKETS)
      .countDocuments();

    const revenueResult = await db
      .collection(Collections.PAYMENTS)
      .aggregate([
        { $match: { status: "success" } },
        {
          $group: { _id: null, total: { $sum: { $divide: ["$amount", 100] } } },
        },
      ])
      .toArray();

    const pendingMessages = await db
      .collection("messages")
      .countDocuments({ replied: false });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTickets,
        totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
        pendingMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// Reply to message
router.post("/reply", requireAdmin, async (req, res) => {
  try {
    const { messageId, replyText, recipientEmail } = req.body;

    if (!messageId || !replyText || !recipientEmail) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    const db = getDB();
    await db.collection("messages").updateOne(
      { _id: new ObjectId(messageId) },
      {
        $set: {
          replied: true,
          repliedAt: new Date(),
          replyText,
        },
      },
    );

    // Send email reply if credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransporter({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: "Re: Your 234WKND Inquiry",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:linear-gradient(135deg,#FF6542,#ff8c42);color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0">
              <h1>234WKND Support</h1>
            </div>
            <div style="background:#f9f9f9;padding:20px;border-radius:0 0 10px 10px">
              <h2>Hello!</h2>
              <p>Thank you for reaching out. Here's our response:</p>
              <div style="background:white;padding:15px;border-radius:5px;margin:20px 0;border-left:4px solid #FF6542">
                ${replyText.replace(/\n/g, "<br>")}
              </div>
              <p>Best regards,<br>The 234WKND Team</p>
            </div>
            <p style="text-align:center;color:#666;margin-top:20px">© 2026 234WKND Events. All rights reserved.</p>
          </div>
        `,
      });
    }

    res.json({ success: true, message: "Reply sent successfully" });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ success: false, error: "Failed to send reply" });
  }
});

// Export data as CSV
router.get("/export/:type", requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const db = getDB();
    let data = [];
    let filename = "";
    let headers = [];

    switch (type) {
      case "users":
        data = await db
          .collection("users")
          .find({}, { projection: { password: 0 } })
          .toArray();
        headers = ["Full Name", "Email", "Created At"];
        filename = "users.csv";
        break;
      case "tickets":
        data = await db.collection(Collections.TICKETS).find({}).toArray();
        headers = [
          "Ticket ID",
          "Full Name",
          "Email",
          "Event",
          "Payment Reference",
          "Created At",
        ];
        filename = "tickets.csv";
        break;
      case "payments":
        data = await db.collection(Collections.PAYMENTS).find({}).toArray();
        headers = ["Reference", "Email", "Amount", "Status", "Created At"];
        filename = "payments.csv";
        break;
      default:
        return res
          .status(400)
          .json({ success: false, error: "Invalid export type" });
    }

    let csv = headers.join(",") + "\n";
    data.forEach((item) => {
      let row = [];
      switch (type) {
        case "users":
          row = [
            `"${`${item.firstName || ""} ${item.lastName || ""}`.trim()}"`,
            `"${item.email || ""}"`,
            `"${item.createdAt ? new Date(item.createdAt).toISOString() : ""}"`,
          ];
          break;
        case "tickets":
          row = [
            `"${item.ticketId || ""}"`,
            `"${item.fullName || ""}"`,
            `"${item.email || ""}"`,
            `"${item.eventTitle || "A Weekend Experience"}"`,
            `"${item.paymentReference || ""}"`,
            `"${item.createdAt ? new Date(item.createdAt).toISOString() : ""}"`,
          ];
          break;
        case "payments":
          row = [
            `"${item.reference || ""}"`,
            `"${item.customer?.email || item.email || ""}"`,
            `"${item.amount ? item.amount / 100 : 0}"`,
            `"${item.status || ""}"`,
            `"${item.createdAt ? new Date(item.createdAt).toISOString() : ""}"`,
          ];
          break;
      }
      csv += row.join(",") + "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ success: false, error: "Failed to export data" });
  }
});

module.exports = router;
