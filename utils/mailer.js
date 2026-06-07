const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (to, firstName, otp) => {
  const mailOptions = {
    from: `"+234WKND" <${process.env.EMAIL_USER}>`,
    to,
    subject: "+234WKND — Verify Your Email",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width:480px;background-color:#111;border:1px solid rgba(255,101,66,0.2);border-radius:16px;overflow:hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color:#FF6542;padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;">
                        +234WKND
                      </h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:2px;">
                        Email Verification
                      </p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 32px;">
                      <p style="margin:0 0 8px;color:#EFD6AC;font-size:16px;font-weight:600;">
                        Hey ${firstName} 👋
                      </p>
                      <p style="margin:0 0 32px;color:rgba(239,214,172,0.6);font-size:14px;line-height:1.6;">
                        Here's your verification code to complete your +234WKND account setup. It expires in <strong style="color:#FF6542;">10 minutes</strong>.
                      </p>
                      <!-- OTP Box -->
                      <div style="background-color:rgba(255,101,66,0.1);border:2px solid rgba(255,101,66,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                        <p style="margin:0 0 8px;color:rgba(239,214,172,0.5);font-size:11px;text-transform:uppercase;letter-spacing:3px;">
                          Your code
                        </p>
                        <p style="margin:0;color:#FF6542;font-size:48px;font-weight:900;letter-spacing:12px;">
                          ${otp}
                        </p>
                      </div>
                      <p style="margin:0;color:rgba(239,214,172,0.4);font-size:12px;line-height:1.6;">
                        If you didn't request this, you can safely ignore this email. Someone may have entered your address by mistake.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 32px;border-top:1px solid rgba(255,101,66,0.1);text-align:center;">
                      <p style="margin:0;color:rgba(239,214,172,0.3);font-size:11px;text-transform:uppercase;letter-spacing:1px;">
                        Global Weekends. Activated Worldwide 🌍
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
