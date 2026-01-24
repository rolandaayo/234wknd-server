const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

// GET /api/messages - Get all messages
router.get("/", messageController.getAllMessages);

// POST /api/messages - Create new message
router.post("/", messageController.createMessage);

// GET /api/messages/room/:roomId - Get messages by room
router.get("/room/:roomId", messageController.getMessagesByRoom);

// PUT /api/messages/:messageId/read - Mark message as read
router.put("/:messageId/read", messageController.markAsRead);

module.exports = router;
