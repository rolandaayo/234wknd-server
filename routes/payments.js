const express = require("express");
const axios = require("axios");
const QRCode = require("qrcode");
const { ObjectId } = require("mongodb");
const {
  getDB,
  saveBooking,
  savePayment,
  saveTicket,
  getTicketByReference,
  getBookingByReference,
  updateBookingStatus,
} = require("../utils/mongodb");
const { sendTicketEmail } = require("../utils/email");

const router = express.Router();

// Initialize payment
router.post("/create-payment", async (req, res) => {
  try {
    const { email, fullName, phone, eventId, quantity = 1 } = req.body;

    // Validate required fields
    if (!email || !fullName || !phone || !eventId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10) {
      return res.status(400).json({ error: "Quantity must be between 1 and 10" });
    }

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Invalid event" });
    }

    const event = await getDB()
      .collection("ticketEvents")
      .findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const ticketAmount = Number(event.price) * parsedQuantity;
    if (!Number.isFinite(ticketAmount) || ticketAmount <= 0) {
      return res.status(400).json({ error: "Event has an invalid price" });
    }
    const totalAmount = ticketAmount + 500;

    const reference = `234wknd_${eventId}_${Date.now()}`;

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: totalAmount * 100,
        currency: "NGN",
        reference,
        callback_url: `${process.env.CLIENT_URL}/payment/success`,
        metadata: {
          eventId,
          fullName,
          phone,
          quantity: parsedQuantity,
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location,
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
        quantity: parsedQuantity,
        amount: totalAmount,
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

    const booking = await getBookingByReference(reference);
    if (!booking) {
      return res.status(404).json({
        error: "Booking not found",
        success: false,
      });
    }

    if (paymentData.amount !== booking.amount * 100) {
      return res.status(400).json({
        error: "Payment amount does not match booking",
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
    const { paymentReference } = req.body;

    if (!paymentReference) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingTicket = await getTicketByReference(paymentReference);
    if (existingTicket) {
      return res.json({ success: true, ticketId: existingTicket.ticketId });
    }

    const booking = await getBookingByReference(paymentReference);
    if (!booking || booking.paymentStatus !== "completed") {
      return res.status(400).json({ error: "Payment has not been verified" });
    }

    const { email, eventId, fullName } = booking;
    const event = await getDB()
      .collection("ticketEvents")
      .findOne({ _id: new ObjectId(eventId) });

    // Generate unique ticket ID
    const ticketId = `234WKND-${eventId}-${Date.now()}`;

    // Create ticket data for QR code
    const ticketData = {
      ticketId,
      eventId,
      fullName,
      email,
      paymentReference,
      quantity: booking.quantity || 1,
      eventTitle: event?.title || "A Weekend Experience",
      eventDate: event?.date || "",
      eventLocation: event?.location || "",
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
