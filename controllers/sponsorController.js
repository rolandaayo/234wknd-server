// Sponsor Controller - handles sponsorship inquiries
class SponsorController {
  constructor() {
    this.inquiries = []; // In-memory storage (use database in production)
  }

  // Get all sponsor inquiries
  getAllInquiries = (req, res) => {
    try {
      res.json({
        success: true,
        inquiries: this.inquiries,
        count: this.inquiries.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching inquiries",
        error: error.message,
      });
    }
  };

  // Create new sponsor inquiry
  createInquiry = (req, res) => {
    try {
      const { companyName, contactPerson, email, phone, budget, message } =
        req.body;

      // Validation
      if (!companyName || !contactPerson || !email || !message) {
        return res.status(400).json({
          success: false,
          message:
            "Company name, contact person, email, and message are required",
        });
      }

      const newInquiry = {
        id: Date.now(),
        companyName,
        contactPerson,
        email,
        phone: phone || null,
        budget: budget || null,
        message,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.inquiries.push(newInquiry);

      res.status(201).json({
        success: true,
        message: "Sponsorship inquiry submitted successfully",
        data: newInquiry,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating inquiry",
        error: error.message,
      });
    }
  };

  // Get inquiry by ID
  getInquiryById = (req, res) => {
    try {
      const { inquiryId } = req.params;
      const inquiry = this.inquiries.find((inq) => inq.id == inquiryId);

      if (!inquiry) {
        return res.status(404).json({
          success: false,
          message: "Inquiry not found",
        });
      }

      res.json({
        success: true,
        data: inquiry,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching inquiry",
        error: error.message,
      });
    }
  };

  // Update inquiry status
  updateInquiryStatus = (req, res) => {
    try {
      const { inquiryId } = req.params;
      const { status } = req.body;

      const inquiry = this.inquiries.find((inq) => inq.id == inquiryId);

      if (!inquiry) {
        return res.status(404).json({
          success: false,
          message: "Inquiry not found",
        });
      }

      const validStatuses = ["pending", "reviewing", "approved", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status. Must be one of: " + validStatuses.join(", "),
        });
      }

      inquiry.status = status;
      inquiry.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: "Inquiry status updated successfully",
        data: inquiry,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating inquiry",
        error: error.message,
      });
    }
  };

  // Get inquiries by status
  getInquiriesByStatus = (req, res) => {
    try {
      const { status } = req.params;
      const filteredInquiries = this.inquiries.filter(
        (inq) => inq.status === status,
      );

      res.json({
        success: true,
        inquiries: filteredInquiries,
        count: filteredInquiries.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching inquiries by status",
        error: error.message,
      });
    }
  };
}

module.exports = new SponsorController();
