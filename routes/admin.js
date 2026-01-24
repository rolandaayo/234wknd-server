const express = require("express");
const { getDB, Collections } = require("../utils/mongodb");
const { sendTicketEmail } = require("../utils/email");
const nodemailer = require("nodemailer");

const router = express.Router();

// Get all users
router.get("/users", async (req, res) => {
  try {
    const db = getDB();
    const bookingsCollection = db.collection(Collections.BOOKINGS);

    // Get unique users from bookings
    const users = await bookingsCollection
      .aggregate([
        {
          $group: {
            _id: "$email",
            fullName: { $first: "$fullName" },
            email: { $first: "$email" },
            phone: { $first: "$phone" },
            createdAt: { $first: "$createdAt" },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

// Get all tickets
router.get("/tickets", async (req, res) => {
  try {
    const db = getDB();
    const ticketsCollection = db.collection(Collections.TICKETS);

    const tickets = await ticketsCollection
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
        status: "active", // You can add status logic here
      })),
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ success: false, error: "Failed to fetch tickets" });
  }
});

// Get all messages (from chat/contact forms)
router.get("/messages", async (req, res) => {
  try {
    const db = getDB();

    // Check if messages collection exists, if not create some sample data
    const messagesCollection = db.collection("messages");
    const messageCount = await messagesCollection.countDocuments();

    if (messageCount === 0) {
      // Insert some sample messages for demo
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

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

// Get all payments
router.get("/payments", async (req, res) => {
  try {
    const db = getDB();
    const paymentsCollection = db.collection(Collections.PAYMENTS);

    const payments = await paymentsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      payments: payments.map((payment) => ({
        _id: payment._id,
        reference: payment.reference,
        email: payment.customer?.email || payment.email,
        amount: payment.amount ? payment.amount / 100 : 0, // Convert from kobo
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
router.get("/stats", async (req, res) => {
  try {
    const db = getDB();

    // Get total unique users
    const bookingsCollection = db.collection(Collections.BOOKINGS);
    const uniqueUsers = await bookingsCollection.distinct("email");

    // Get total tickets
    const ticketsCollection = db.collection(Collections.TICKETS);
    const totalTickets = await ticketsCollection.countDocuments();

    // Get total revenue
    const paymentsCollection = db.collection(Collections.PAYMENTS);
    const revenueResult = await paymentsCollection
      .aggregate([
        { $match: { status: "success" } },
        {
          $group: { _id: null, total: { $sum: { $divide: ["$amount", 100] } } },
        },
      ])
      .toArray();

    // Get pending messages
    const messagesCollection = db.collection("messages");
    const pendingMessages = await messagesCollection.countDocuments({
      replied: false,
    });

    const stats = {
      totalUsers: uniqueUsers.length,
      totalTickets,
      totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
      pendingMessages,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// Reply to message
router.post("/reply", async (req, res) => {
  try {
    const { messageId, replyText, recipientEmail } = req.body;

    if (!messageId || !replyText || !recipientEmail) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Update message as replied
    const db = getDB();
    const messagesCollection = db.collection("messages");

    await messagesCollection.updateOne(
      { _id: require("mongodb").ObjectId(messageId) },
      {
        $set: {
          replied: true,
          repliedAt: new Date(),
          replyText,
        },
      },
    );

    // Send email reply
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: "Re: Your 234WKND Inquiry",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>234WKND Support</h1>
            </div>
            
            <div class="content">
              <h2>Hello!</h2>
              <p>Thank you for reaching out to us. Here's our response to your inquiry:</p>
              
              <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
                ${replyText.replace(/\n/g, "<br>")}
              </div>
              
              <p>If you have any further questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>The 234WKND Team</p>
            </div>
            
            <div class="footer">
              <p>Contact us at <a href="mailto:support@234wknd.com">support@234wknd.com</a></p>
              <p>© 2026 234WKND Events. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Reply sent successfully",
    });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ success: false, error: "Failed to send reply" });
  }
});

// Export data as CSV
router.get("/export/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const db = getDB();

    let data = [];
    let filename = "";
    let headers = [];

    switch (type) {
      case "users":
        const bookingsCollection = db.collection(Collections.BOOKINGS);
        const users = await bookingsCollection
          .aggregate([
            {
              $group: {
                _id: "$email",
                fullName: { $first: "$fullName" },
                email: { $first: "$email" },
                phone: { $first: "$phone" },
                createdAt: { $first: "$createdAt" },
              },
            },
          ])
          .toArray();

        data = users;
        headers = ["Full Name", "Email", "Phone", "Created At"];
        filename = "users.csv";
        break;

      case "tickets":
        const ticketsCollection = db.collection(Collections.TICKETS);
        data = await ticketsCollection.find({}).toArray();
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
        const paymentsCollection = db.collection(Collections.PAYMENTS);
        data = await paymentsCollection.find({}).toArray();
        headers = ["Reference", "Email", "Amount", "Status", "Created At"];
        filename = "payments.csv";
        break;

      default:
        return res
          .status(400)
          .json({ success: false, error: "Invalid export type" });
    }

    // Generate CSV
    let csv = headers.join(",") + "\n";

    data.forEach((item) => {
      let row = [];
      switch (type) {
        case "users":
          row = [
            `"${item.fullName || ""}"`,
            `"${item.email || ""}"`,
            `"${item.phone || ""}"`,
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
