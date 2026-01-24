const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

const sendTicketEmail = async ({
  email,
  fullName,
  ticketData,
  qrCodeBuffer,
}) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "🎫 Your 234WKND Event Ticket - A Weekend Experience",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Event Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .qr-section { text-align: center; background: white; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your Ticket is Ready!</h1>
            <p>234WKND - A Weekend Experience</p>
          </div>
          
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            <p>Thank you for booking your spot at <strong>A Weekend Experience</strong>. Your payment has been confirmed and your ticket is ready!</p>
            
            <div class="ticket-info">
              <h3>📅 Event Details</h3>
              <p><strong>Event:</strong> ${ticketData.eventTitle}</p>
              <p><strong>Date:</strong> ${ticketData.eventDate}</p>
              <p><strong>Location:</strong> ${ticketData.eventLocation}</p>
              <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
            </div>
            
            <div class="qr-section">
              <h3>🎫 Your Digital Ticket</h3>
              <p>Present this QR code at the event entrance:</p>
              <img src="cid:qrcode" alt="Ticket QR Code" style="max-width: 250px; margin: 20px 0;">
              <p><small>Save this QR code to your phone for easy access</small></p>
            </div>
            
            <div class="important">
              <h4>⚠️ Important Information</h4>
              <ul>
                <li>Arrive 30 minutes before the event starts</li>
                <li>Bring a valid ID for verification</li>
                <li>This ticket is non-transferable</li>
                <li>Screenshots of the QR code are acceptable</li>
              </ul>
            </div>
            
            <p>We're excited to see you at the event! If you have any questions, please don't hesitate to contact us.</p>
          </div>
          
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@234wknd.com">support@234wknd.com</a></p>
            <p>© 2026 234WKND Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: "ticket-qr-code.png",
        content: qrCodeBuffer,
        cid: "qrcode",
      },
    ],
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendTicketEmail,
};
