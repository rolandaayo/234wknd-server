const express = require("express");
const router = express.Router();
const sponsorController = require("../controllers/sponsorController");

// GET /api/sponsors - Get all sponsor inquiries
router.get("/", sponsorController.getAllInquiries);

// POST /api/sponsors - Create new sponsor inquiry
router.post("/", sponsorController.createInquiry);

// GET /api/sponsors/:inquiryId - Get inquiry by ID
router.get("/:inquiryId", sponsorController.getInquiryById);

// PUT /api/sponsors/:inquiryId/status - Update inquiry status
router.put("/:inquiryId/status", sponsorController.updateInquiryStatus);

// GET /api/sponsors/status/:status - Get inquiries by status
router.get("/status/:status", sponsorController.getInquiriesByStatus);

module.exports = router;
