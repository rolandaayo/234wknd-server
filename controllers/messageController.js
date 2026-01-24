// Message Controller - handles chat messages
class MessageController {
  constructor() {
    this.messages = []; // In-memory storage (use database in production)
  }

  // Get all messages
  getAllMessages = (req, res) => {
    try {
      res.json({
        success: true,
        messages: this.messages,
        count: this.messages.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching messages",
        error: error.message,
      });
    }
  };

  // Create new message
  createMessage = (req, res) => {
    try {
      const { text, sender, roomId } = req.body;

      if (!text || !sender) {
        return res.status(400).json({
          success: false,
          message: "Text and sender are required",
        });
      }

      const newMessage = {
        id: Date.now(),
        text,
        sender,
        roomId: roomId || "general",
        timestamp: new Date().toISOString(),
        read: false,
      };

      this.messages.push(newMessage);

      res.status(201).json({
        success: true,
        message: "Message created successfully",
        data: newMessage,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating message",
        error: error.message,
      });
    }
  };

  // Get messages by room
  getMessagesByRoom = (req, res) => {
    try {
      const { roomId } = req.params;
      const roomMessages = this.messages.filter((msg) => msg.roomId === roomId);

      res.json({
        success: true,
        messages: roomMessages,
        count: roomMessages.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching room messages",
        error: error.message,
      });
    }
  };

  // Mark message as read
  markAsRead = (req, res) => {
    try {
      const { messageId } = req.params;
      const message = this.messages.find((msg) => msg.id == messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      message.read = true;

      res.json({
        success: true,
        message: "Message marked as read",
        data: message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating message",
        error: error.message,
      });
    }
  };
}

module.exports = new MessageController();
