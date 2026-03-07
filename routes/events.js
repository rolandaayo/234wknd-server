const express = require("express");
const { getDB } = require("../utils/mongodb");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = user;
      next();
    },
  );
};

// Get all events (public)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const events = db.collection("events");

    const allEvents = await events
      .find({ status: "published" })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      events: allEvents,
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get user's events (authenticated)
router.get("/my-events", authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const events = db.collection("events");

    const userEvents = await events
      .find({ createdBy: req.user.userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      events: userEvents,
    });
  } catch (error) {
    console.error("Get user events error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Create new event (authenticated)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      price,
      maxAttendees,
      category,
      imageUrl,
    } = req.body;

    // Validation
    if (!title || !description || !date || !time || !location || !price) {
      return res.status(400).json({
        error: "All required fields must be provided",
      });
    }

    const db = getDB();
    const events = db.collection("events");

    const newEvent = {
      title,
      description,
      date,
      time,
      location,
      price: parseFloat(price),
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      category: category || "general",
      imageUrl: imageUrl || null,
      createdBy: req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "published",
      attendees: [],
    };

    const result = await events.insertOne(newEvent);

    res.status(201).json({
      message: "Event created successfully",
      event: {
        id: result.insertedId,
        ...newEvent,
      },
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Update event (authenticated, owner only)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      date,
      time,
      location,
      price,
      maxAttendees,
      category,
      imageUrl,
      status,
    } = req.body;

    const db = getDB();
    const events = db.collection("events");
    const { ObjectId } = require("mongodb");

    // Check if event exists and user owns it
    const existingEvent = await events.findOne({
      _id: new ObjectId(id),
      createdBy: req.user.userId,
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: "Event not found or you don't have permission to edit it",
      });
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (location) updateData.location = location;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (maxAttendees !== undefined)
      updateData.maxAttendees = maxAttendees ? parseInt(maxAttendees) : null;
    if (category) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status) updateData.status = status;

    const result = await events.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    res.json({
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Delete event (authenticated, owner only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const events = db.collection("events");
    const { ObjectId } = require("mongodb");

    // Check if event exists and user owns it
    const existingEvent = await events.findOne({
      _id: new ObjectId(id),
      createdBy: req.user.userId,
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: "Event not found or you don't have permission to delete it",
      });
    }

    const result = await events.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    res.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get single event by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const events = db.collection("events");
    const { ObjectId } = require("mongodb");

    const event = await events.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    res.json({
      event,
    });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
