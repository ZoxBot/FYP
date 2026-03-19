const nodemailer = require('nodemailer');

// Configure transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE !== 'host' ? process.env.EMAIL_SERVICE : undefined,
  host: process.env.EMAIL_SERVICE === 'host' ? process.env.EMAIL_HOST : undefined,
  port: process.env.EMAIL_SERVICE === 'host' ? process.env.EMAIL_PORT : undefined,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Kaamko Kura" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Kaamko Kura',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to Kaamko Kura!</h2>
        <p>Thank you for signing up. Please use the following 6-digit code to verify your email address:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. If you did not sign up for this account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2026 Kaamko Kura. All rights reserved.</p>
      </div>
    `,
  };

  try {
    // Only attempt to send if credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}`);
    } else {
      console.log('--- EMAIL MOCK (No SMTP credentials in .env) ---');
      console.log(`To: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log('-----------------------------------------------');
    }
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const mailOptions = {
    from: `"Kaamko Kura" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - Kaamko Kura',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Password Reset Request</h2>
        <p>You requested a password reset for your Kaamko Kura account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
        <p style="font-size: 12px; color: #6b7280; break-word: break-all;">Link: ${resetLink}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2026 Kaamko Kura. All rights reserved.</p>
      </div>
    `,
  };

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`Reset email sent to ${email}`);
    } else {
      console.log('--- PASSWORD RESET EMAIL MOCK ---');
      console.log(`To: ${email}`);
      console.log(`Link: ${resetLink}`);
      console.log('-------------------------------');
    }
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

module.exports = { sendOTP, sendPasswordResetEmail };
