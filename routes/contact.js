const express = require("express");
const { getDB } = require("../utils/mongodb");

const router = express.Router();

// Submit contact form message
router.post("/submit", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    const db = getDB();
    const messagesCollection = db.collection("messages");

    const messageData = {
      text: message,
      sender: name,
      email: email,
      timestamp: new Date(),
      replied: false,
      source: "contact_form",
    };

    await messagesCollection.insertOne(messageData);

    res.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

module.exports = router;
