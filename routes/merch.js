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

// GET all merch (public)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const items = await db
      .collection("merch")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create merch (admin)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, price, category, image, description, tag } = req.body;
    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ error: "Name, price, and category are required" });
    }
    const db = getDB();
    const result = await db.collection("merch").insertOne({
      name,
      price: parseFloat(price),
      category,
      image: image || null,
      description: description || "",
      tag: tag || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res
      .status(201)
      .json({ message: "Merch item created", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update merch (admin)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const { name, price, category, image, description, tag } = req.body;
    const db = getDB();
    const result = await db
      .collection("merch")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            name,
            price: parseFloat(price),
            category,
            image,
            description,
            tag,
            updatedAt: new Date(),
          },
        },
      );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Merch item updated" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE merch (admin)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const db = getDB();
    const result = await db
      .collection("merch")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Merch item deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
