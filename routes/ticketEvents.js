const express = require("express");
const { getDB } = require("../utils/mongodb");
const jwt = require("jsonwebtoken");
const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });
  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err)
        return res.status(403).json({ error: "Invalid or expired token" });
      req.user = user;
      next();
    },
  );
};

// GET all ticket events (public)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const events = await db
      .collection("ticketEvents")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create ticket event (admin)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, date, location, price, description, image, capacity, tag } =
      req.body;
    if (!title || !date || !price) {
      return res
        .status(400)
        .json({ error: "Title, date, and price are required" });
    }
    const db = getDB();
    const result = await db.collection("ticketEvents").insertOne({
      title,
      date,
      location: location || "Undisclosed Location",
      price: parseFloat(price),
      description: description || "",
      image: image || "/images/img-02.jpg",
      capacity: capacity || "Limited Spots",
      tag: tag || "Event",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res
      .status(201)
      .json({ message: "Ticket event created", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update ticket event (admin)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const { title, date, location, price, description, image, capacity, tag } =
      req.body;
    const db = getDB();
    const result = await db
      .collection("ticketEvents")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            title,
            date,
            location,
            price: parseFloat(price),
            description,
            image,
            capacity,
            tag,
            updatedAt: new Date(),
          },
        },
      );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Event not found" });
    res.json({ message: "Ticket event updated" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE ticket event (admin)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const db = getDB();
    const result = await db
      .collection("ticketEvents")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Event not found" });
    res.json({ message: "Ticket event deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
