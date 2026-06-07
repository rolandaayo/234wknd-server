const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDB } = require("../utils/mongodb");
const { sendOTPEmail } = require("../utils/mailer");
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

// Send OTP to email
router.post("/send-otp", async (req, res) => {
  try {
    const { email, firstName } = req.body;

    if (!email || !firstName) {
      return res
        .status(400)
        .json({ error: "Email and first name are required" });
    }

    const db = getDB();
    const users = db.collection("users");
    const verifications = db.collection("email_verifications");

    // Check if email is already registered
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert verification record (one per email at a time)
    await verifications.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          email: email.toLowerCase(),
          otp,
          expiresAt,
          verified: false,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    // Send email
    await sendOTPEmail(email, firstName, otp);

    res.json({ message: "Verification code sent to your email" });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const db = getDB();
    const verifications = db.collection("email_verifications");

    const record = await verifications.findOne({ email: email.toLowerCase() });

    if (!record) {
      return res
        .status(400)
        .json({ error: "No verification code found for this email" });
    }

    if (new Date() > new Date(record.expiresAt)) {
      return res
        .status(400)
        .json({
          error: "Verification code has expired. Please request a new one.",
        });
    }

    if (record.otp !== otp.toString()) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Mark as verified
    await verifications.updateOne(
      { email: email.toLowerCase() },
      { $set: { verified: true } },
    );

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const db = getDB();
    const users = db.collection("users");
    const verifications = db.collection("email_verifications");

    // Check email was verified
    const verification = await verifications.findOne({
      email: email.toLowerCase(),
    });
    if (!verification || !verification.verified) {
      return res
        .status(400)
        .json({ error: "Email not verified. Please verify your email first." });
    }

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    // Clean up verification record
    await verifications.deleteOne({ email: email.toLowerCase() });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertedId, email: email.toLowerCase() },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: result.insertedId,
        email: email.toLowerCase(),
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } },
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ error: "First name and last name are required" });
    }

    const { ObjectId } = require("mongodb");
    const db = getDB();
    const users = db.collection("users");

    const result = await users.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: { firstName, lastName, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify token endpoint
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: { userId: req.user.userId, email: req.user.email },
  });
});

// Make a user admin
router.post("/make-admin", async (req, res) => {
  try {
    const { email, secretKey } = req.body;
    if (secretKey !== (process.env.ADMIN_SECRET || "234wknd-admin-secret")) {
      return res.status(403).json({ error: "Invalid secret key" });
    }
    const db = getDB();
    const users = db.collection("users");
    const result = await users.updateOne(
      { email: email.toLowerCase() },
      { $set: { isAdmin: true, updatedAt: new Date() } },
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: `${email} is now an admin` });
  } catch (error) {
    console.error("Make admin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
