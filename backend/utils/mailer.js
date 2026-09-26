const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send OTP email for password reset
 * @param {string} toEmail - recipient email address
 * @param {string} otp - 6-digit OTP code
 */
const sendOTPEmail = async (toEmail, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Ledgra - Password Reset OTP',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #121212; color: #f5f5f5; padding: 40px; border-radius: 12px;">
        <h1 style="color: #e85c5c; margin-bottom: 8px;">Ledgra</h1>
        <p style="color: #aaa; margin-bottom: 32px;">Inventory Management System</p>
        <h2 style="font-size: 20px; margin-bottom: 16px;">Password Reset Request</h2>
        <p style="color: #ccc; margin-bottom: 24px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #e85c5c;">${otp}</span>
        </div>
        <p style="color: #777; font-size: 13px;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 OTP email sent: ${info.messageId}`);
  // For Ethereal: log preview URL
  if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
    console.log(`📬 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
};

module.exports = { sendOTPEmail };
