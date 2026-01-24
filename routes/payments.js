const express = require("express");
const axios = require("axios");
const QRCode = require("qrcode");
const {
  saveBooking,
  savePayment,
  saveTicket,
  getBookingByReference,
  updateBookingStatus,
} = require("../utils/mongodb");
const { sendTicketEmail } = require("../utils/email");

const router = express.Router();

// Initialize payment
router.post("/create-payment", async (req, res) => {
  try {
    const { email, fullName, phone, eventId, amount } = req.body;

    // Validate required fields
    if (!email || !fullName || !phone || !eventId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const reference = `234wknd_${eventId}_${Date.now()}`;

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: (amount + 500) * 100, // Convert to kobo and add service fee
        currency: "NGN",
        reference,
        callback_url: `${process.env.CLIENT_URL}/payment/success`,
        metadata: {
          eventId,
          fullName,
          phone,
          custom_fields: [
            {
              display_name: "Event ID",
              variable_name: "event_id",
              value: eventId,
            },
            {
              display_name: "Full Name",
              variable_name: "full_name",
              value: fullName,
            },
            {
              display_name: "Phone",
              variable_name: "phone",
              value: phone,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!paystackResponse.data.status) {
      return res.status(400).json({ error: "Payment initialization failed" });
    }

    // Save booking details to MongoDB
    try {
      await saveBooking({
        reference,
        eventId,
        email,
        fullName,
        phone,
        amount: amount + 500,
        status: "pending",
        paymentStatus: "pending",
      });
    } catch (dbError) {
      console.error("Database save error:", dbError);
      // Continue even if DB save fails - payment can still proceed
    }

    res.json({
      authorization_url: paystackResponse.data.data.authorization_url,
      access_code: paystackResponse.data.data.access_code,
      reference: paystackResponse.data.data.reference,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify payment
router.get("/verify-payment/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ error: "Payment reference is required" });
    }

    // Verify payment with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    if (!paystackResponse.data.status) {
      return res.status(400).json({
        error: "Payment verification failed",
        success: false,
      });
    }

    const paymentData = paystackResponse.data.data;

    // Check if payment was successful
    if (paymentData.status !== "success") {
      return res.status(400).json({
        error: "Payment was not successful",
        success: false,
      });
    }

    // Save payment data to MongoDB
    try {
      await savePayment(paymentData);
      await updateBookingStatus(reference, "completed", paymentData);
    } catch (dbError) {
      console.error("Database update error:", dbError);
    }

    res.json({
      success: true,
      data: paymentData,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      error: "Internal server error",
      success: false,
    });
  }
});

// Generate and send ticket
router.post("/generate-ticket", async (req, res) => {
  try {
    const { paymentReference, email, eventId, fullName } = req.body;

    if (!paymentReference || !email || !eventId || !fullName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate unique ticket ID
    const ticketId = `234WKND-${eventId}-${Date.now()}`;

    // Create ticket data for QR code
    const ticketData = {
      ticketId,
      eventId,
      fullName,
      email,
      paymentReference,
      eventTitle: "A Weekend Experience",
      eventDate: "April 5, 2026",
      eventLocation: "Amore Garden, Lagos",
      issuedAt: new Date().toISOString(),
    };

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(ticketData), {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Convert base64 QR code to buffer
    const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");

    // Save ticket to MongoDB
    try {
      await saveTicket(ticketData);
    } catch (dbError) {
      console.error("Database save error:", dbError);
    }

    // Send email with QR code
    await sendTicketEmail({
      email,
      fullName,
      ticketData,
      qrCodeBuffer,
    });

    res.json({
      success: true,
      ticketId,
      message: "Ticket generated and sent successfully",
    });
  } catch (error) {
    console.error("Ticket generation error:", error);
    res.status(500).json({ error: "Failed to generate ticket" });
  }
});

module.exports = router;
